import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Button, Form, FormGroup, Col, ControlLabel, FormControl } from 'react-bootstrap';
import { fetchUserCreatedDocuments } from '../../shared/actions';
import CreateDocumentModal from './CreateDocumentModal';

class UserCreatedDocuments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      status: 'all'
    };
  }

  componentWillMount() {
    this.props.fetchUserCreatedDocuments({});
  }

  openModal = id => {
    this.setState({ showModal: true });
  };

  close = () => {
    this.setState({ showModal: false });
  };

  filterByStatus = (field, event) => {
    const new_state = {};
    new_state[field] = event.target.value;
    this.setState(new_state, function () {
      if (this.state.status !== 'all') {
        this.props.fetchUserCreatedDocuments({ status: this.state.status });
      } else {
        this.props.fetchUserCreatedDocuments({});
      }
    });
  };

  updateDocumentsResult = () => {
    this.props.fetchUserCreatedDocuments({});
  };

  render() {
    if (!this.props.user_created_documents.isReady) {
      return null;
    }

    const rows = [];
    const documents = this.props.user_created_documents.items.user_created_documents;
    documents.forEach((document, i) => {
      rows.push(
        <tr key={i}>
          <td>
            <p>
              <b>Title: </b>
              {document.doc_details.title}
            </p>
            <p>
              <b>Pdf url: </b>
              <a href={document.doc_details.pdf_url} target="_blank">
                {document.doc_details.pdf_url}
              </a>
            </p>
            <p>
              <b>Web url: </b>
              <a href={document.doc_details.web_url} target="_blank">
                {document.doc_details.web_url}
              </a>
            </p>
            <p>
              <b>Category: </b>
              {document.doc_details.category}
            </p>
            <p>
              <b>Publication Date: </b>
              {document.doc_details.publication_date}
            </p>
            <p className={document.notes ? '' : 'hidden'}>
              Notes: {document.notes}
            </p>
            <p className={document.failure_notes ? '' : 'hidden'}>
              Failure Notes: {document.failure_notes}
            </p>
          </td>
          <td>
            <p className="uppercase">
              {document.status}{' '}
            </p>
          </td>
        </tr>
      );
    });

    return (
      <div>
        <h1>User Created Documents</h1>
        <Form horizontal>
          <FormGroup bsSize="small">
            <Col sm={10}>
              <Button bsStyle="primary" onClick={() => this.openModal()}>
                Create
              </Button>
            </Col>
            <Col sm={2}>
              <ControlLabel>Filter by status</ControlLabel>
              <FormControl
                componentClass="select"
                defaultValue={this.state.status}
                onChange={e => this.filterByStatus('status', e)}
              >
                <option value="all">ALL</option>
                <option value="queued">QUEUED</option>
                <option value="processed">PROCESSED</option>
                <option value="failed">FAILED</option>
              </FormControl>
            </Col>
          </FormGroup>
        </Form>
        <Table striped condensed hover>
          <tbody>
            {rows}
          </tbody>
        </Table>
        <CreateDocumentModal
          close={this.close}
          showModal={this.state.showModal}
          updateDocumentsResult={this.updateDocumentsResult}
        />
      </div>
    );
  }
}

UserCreatedDocuments.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchUserCreatedDocuments: params => {
      dispatch(fetchUserCreatedDocuments(params));
    }
  };
};

const mapStateToProps = state => {
  return {
    user_created_documents: state.user_created_documents
  };
};

const ReduxUserCreatedDocuments = connect(mapStateToProps, mapDispatchToProps)(
  UserCreatedDocuments
);

export default ReduxUserCreatedDocuments;
