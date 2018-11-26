import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import Select from 'react-select';
import { tagDocument, createTag, fetchTags } from '../../shared/actions';
import { isIE10 } from '../utils/browser';
import classnames from 'classnames';
import { safe_analytics } from '../../shared/utils/analytics';

class DocumentSummaryTags extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      add_open: false,
      custom_error: null
    };
  }

  getTagOptions(input) {
    const document = this.props.document;
    const selected_tag_ids = document.tags.map(t => t[0]);
    const input_regexp = new RegExp(input || '', 'i');
    let has_exact_match = false;

    // only include tags that are not already selected and match the input
    const user_tags = _.filter(this.props.tags.by_id, t => {
      if (!has_exact_match && t.name.toLowerCase() === input.toLowerCase()) {
        has_exact_match = true;
      }

      return selected_tag_ids.indexOf(t.id) === -1 && input_regexp.test(t.name);
    });

    let options = user_tags.map(tag => {
      return {
        label: tag.name,
        value: tag.id
      };
    });

    options = _.sortBy(options, o => o.label.toLowerCase());

    if (input && !has_exact_match) {
      options.push({
        label: `Add new tag "${input}"`,
        value: { custom: true, input }
      });
    }

    return Promise.resolve({ options });
  }
  applyAllTags(tag_id) {
    const document = this.props.document;
    const new_tag = this.props.tags.by_id[tag_id];

    const promises = [];

    // for system tags also mark all non-selected tags as false for ML purposes
    if (new_tag.provenance === 'system') {
      const true_tags = [tag_id];

      for (const tag of document.tags) {
        true_tags.push(tag[0]);
      }

      // XXX update this to use a batch tagging system
      const system_tags = _.filter(this.props.tags.by_id, t => t.provenance === 'system');

      for (const tag of system_tags) {
        if (true_tags.indexOf(tag.id) === -1) {
          promises.push(this.props.tagDocument(document.id, tag.id, false, tag.name));
        }
      }
    }

    // always mark at least this tag as true
    promises.push(this.props.tagDocument(document.id, tag_id, true, new_tag.name));
    return Promise.all(promises);
  }
  handleSelectChange(value) {
    if (value.custom) {
      this.submitCustom(value.input);
    } else {
      this.applyAllTags(value).then(responses => {
        this.setState({ add_open: false, custom_error: null });
      });
    }
  }
  submitCustom(tag_name) {
    if (!tag_name) {
      return;
    }

    // check for duplicate tag names
    for (const tag_id of Object.keys(this.props.tags.by_id)) {
      const tag = this.props.tags.by_id[tag_id];
      if (tag_name.toLowerCase() === tag.name.toLowerCase()) {
        this.setState({
          custom_error: 'Name is already in use. Please select another.'
        });
        return;
      }
    }

    this.setState({ add_open: false, custom_error: null });

    safe_analytics('Personalization – Tags', 'Personalization', 'Tags', tag_name);

    this.props.createTag(tag_name).then(response => {
      const tag_id = response.id;

      this.props.fetchTags(); // update tags in store
      this.props.tagDocument(this.props.document.id, tag_id, true, tag_name);
    });
  }

  scrollToBottom(e) {
    e.preventDefault();

    const rightPanelContainer = document.getElementsByClassName('document-summary-container')[0];

    if (rightPanelContainer) {
      rightPanelContainer.scrollTop = rightPanelContainer.scrollHeight;
    }
  }

  renderTagSelect() {
    if (!this.state.add_open) {
      return null;
    }

    return (
      <div className="add-tag-container" onClick={e => this.scrollToBottom(e)}>
        <Select
          name="add-tag-select"
          value=""
          asyncOptions={(...args) => this.getTagOptions(...args)}
          clearable={false}
          onChange={v => this.handleSelectChange(v)}
        />
      </div>
    );
  }
  render() {
    if (!(this.props.document && this.props.tags.isReady)) {
      return null;
    }

    const document = this.props.document;
    const tag_frag = [];
    const liClasses = classnames({
      ie10: isIE10()
    });

    for (const tag of document.tags) {
      const id = tag[0];
      const name = tag[1];

      const clearTag = () => {
        this.props.tagDocument(document.id, id, false, name);
      };

      tag_frag.push(
        <li key={id} className={liClasses}>
          <span>
            {name}
          </span>
          <i className="material-icons" onClick={clearTag}>
            close
          </i>
        </li>
      );
    }

    if (!this.state.add_open) {
      tag_frag.push(
        <li
          key="add"
          className={`add ${liClasses}`}
          onClick={e => this.setState({ add_open: true })}
        >
          <span>Add</span>
          <i className="material-icons">add</i>
        </li>
      );
    }

    const classes = classnames({
      'document-summary-tags': true,
      ie10: isIE10()
    });
    const ulClasses = classnames({
      ie10: isIE10()
    });

    return (
      <div className={classes}>
        <div className="label-container">Tags</div>
        <div className="tag-container">
          <ul className={ulClasses}>
            {tag_frag}
          </ul>
          {this.renderTagSelect()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    tags: state.tags
  };
};

const mapDispatchToProps = dispatch => {
  return {
    tagDocument: (doc_id, tag_id, tag_status, tag_name) => {
      return dispatch(tagDocument(doc_id, tag_id, tag_status, tag_name));
    },
    createTag: tag_name => {
      return dispatch(createTag(tag_name));
    },
    fetchTags: () => {
      dispatch(fetchTags());
    }
  };
};

const ReduxDocumentSummaryTags = connect(mapStateToProps, mapDispatchToProps)(DocumentSummaryTags);

export default ReduxDocumentSummaryTags;
