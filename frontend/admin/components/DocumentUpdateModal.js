import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, FormControl, ControlLabel, FormGroup } from 'react-bootstrap';
import Select from 'react-select';
import { updateDocument, fetchAllCategories } from '../../shared/actions';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import moment from 'moment';

class DocumentUpdateModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      saveDisabled: false,
      notes: '',
      format_str: 'YYYY-MM-DDTHH:mm:ss',
      showAlert: false,
      topics: []
    };
  }

  componentWillMount() {
    this.props.fetchAllCategories();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documents_full && nextProps.documents_full.isReady &&
      nextProps.documents_full.ids[this.props.document_id]) {
      const document = nextProps.documents_full.ids[this.props.document_id];
      this.setState({
        title: document.title,
        initial_title: document.title,
        summary_text: document.summary_text,
        initial_summary_text: document.summary_text,
        category: document.category,
        initial_category: document.category,
        publication_date: moment(document.publication_date),
        initial_publication_date: moment(document.publication_date),
        user_flagged_document_id: document.flagged.user_flagged_document_id,
        topics: document.topics.map(topic => ({ name: topic.name, id: topic.id })),
        initial_topics: document.topics.map(topic => ({ name: topic.name, id: topic.id }))
      });
    }

    if (!nextProps.updated_document.isUpdating) {
      // close the modal on success
      if (this.props.showModal && this.state.saveDisabled) {
        this.props.close();
      }
      this.setState({
        saveDisabled: false
      });
    }
  }

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    if (changedfieldname === 'topics') {
      const topics = event.map(obj => ({ name: obj.label, id: obj.value }));
      new_state.topics = topics;
    } else {
      new_state[changedfieldname] = event.target.value;
    }
    this.setState(new_state);
    this.setState({ showAlert: false });
  };

  handleDateChange = date => {
    this.setState({ publication_date: date, showAlert: false });
  };

  handleSubmit = event => {
    event.preventDefault();
    const changes = {};
    if (this.state.title && this.state.title !== this.state.initial_title) {
      changes.title = this.state.title;
    }
    if (this.state.category && this.state.category !== this.state.initial_category) {
      changes.category = this.state.category;
    }
    if (this.state.summary_text && this.state.summary_text !== this.state.initial_summary_text) {
      changes.summary_text = this.state.summary_text;
    }
    if (this.state.topics && !_.isEqual(this.state.topics, this.state.initial_topics)) {
      const initial_topic_lookup = {};
      const existing_topic_lookup = {};
      const topics_to_remove = [];
      const topics_to_add = [];
      for (const topic_dict of this.state.initial_topics) {
        initial_topic_lookup[topic_dict.id] = true;
      }

      for (const topic_dict of this.state.topics) {
        existing_topic_lookup[topic_dict.id] = true;
        if (!initial_topic_lookup[topic_dict.id]) {
          topics_to_add.push(topic_dict);
        }
      }

      for (const topic_dict of this.state.initial_topics) {
        if (!existing_topic_lookup[topic_dict.id]) {
          topics_to_remove.push(topic_dict);
        }
      }

      if (topics_to_add.length > 0) {
        changes.topics_to_add = topics_to_add;
      }

      if (topics_to_remove.length > 0) {
        changes.topics_to_remove = topics_to_remove;
      }
    }

    if (this.state.publication_date) {
      const initial_date = this.state.initial_publication_date.format(this.state.format_str);
      const changed_date = this.state.publication_date.format(this.state.format_str);
      if (initial_date !== changed_date) {
        changes.publication_date = changed_date;
      }
    }

    // Submit if changes were made
    if (_.isEmpty(changes)) {
      this.setState({ showAlert: true });
    } else {
      if (this.state.notes) {
        changes.notes = this.state.notes;
      }
      changes.user_flagged_document_id = this.state.user_flagged_document_id;
      this.props.close();
      this.setState({ saveDisabled: true });
      if (this.props.flagged_status === 'contributor_flagged') {
        changes.fix_contributor_notes = true;
      }
      this.props.updateDocument(this.props.document_id, changes).then(() => {
        this.props.updateDocumentsResult();
      });
    }
  };

  closeModal = () => {
    this.setState({ showAlert: false });
    this.props.close();
  };

  render() {
    if (!this.props.categories.isReady || !this.props.documents_full.isReady) {
      return null;
    }

    const allCategories = this.props.categories.items.categories;
    const categoriesItems = [];
    categoriesItems.push(<option key={0} value="" />);
    allCategories.forEach((category, i) => {
      categoriesItems.push(
        <option key={i + 1} value={category}>
          {category}
        </option>
      );
    });

    return (
      <Modal show={this.props.showModal} onHide={this.closeModal}>
        <Modal.Header>
          <Modal.Title>Document ID: {this.props.document_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup>
            <ControlLabel>Title</ControlLabel>
            <FormControl
              componentClass="textarea"
              value={this.state.title}
              onChange={e => this.handleFieldChange('title', e)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Summary</ControlLabel>
            <FormControl
              componentClass="textarea"
              value={this.state.summary_text}
              onChange={e => this.handleFieldChange('summary_text', e)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Category</ControlLabel>
            <FormControl
              componentClass="select"
              value={this.state.category}
              onChange={e => this.handleFieldChange('category', e)}
            >
              {categoriesItems}
            </FormControl>
          </FormGroup>
          <FormGroup>
            <ControlLabel>Publication Date</ControlLabel>
            <div>
              <DatePicker selected={this.state.publication_date} onChange={this.handleDateChange} />
            </div>
          </FormGroup>
          <FormGroup>
            <ControlLabel>Topics</ControlLabel>
            <Select
              multi
              options={this.props.sources.defaultTopics.map(source => ({
                value: source.id,
                label: source.name
              }))}
              value={this.state.topics.map(topic => ({ value: topic.id, label: topic.name }))}
              onChange={e => this.handleFieldChange('topics', e)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Notes with additional relevant details</ControlLabel>
            <FormControl
              componentClass="textarea"
              onChange={e => this.handleFieldChange('notes', e)}
            />
          </FormGroup>
          <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
            Please modify at least one document field before submit
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.closeModal}>Close</Button>
          <Button
            bsStyle="primary"
            type="submit"
            disabled={this.state.saveDisabled}
            onClick={this.handleSubmit}
          >
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

DocumentUpdateModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    updateDocument: (id, data) => {
      return dispatch(updateDocument(id, data));
    },
    fetchAllCategories: () => {
      dispatch(fetchAllCategories());
    }
  };
};

const mapStateToProps = state => {
  return {
    all_documents: state.all_documents,
    updated_document: state.updated_document,
    categories: state.categories,
    documents_full: state.documents_full,
    ...state.sources
  };
};

const ReduxDocumentUpdateModal = connect(mapStateToProps, mapDispatchToProps)(DocumentUpdateModal);

export default ReduxDocumentUpdateModal;
