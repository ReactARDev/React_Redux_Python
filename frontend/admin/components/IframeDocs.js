/* eslint-disable max-len */
import React from 'react';
import IframeDoc from './IframeDoc';
import { apiUrl, iframeApiKey } from '../../shared/config';

class IframeDocs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDoc: false,
      doc: ''
    };
  }
  showDoc = doc => {
    this.setState({ showDoc: true, doc });
  };
  render() {
    const { docs, autosuggestItem } = this.props;
    const src = `${apiUrl}/doc_pdf?access_token=${encodeURIComponent(iframeApiKey)}&doc_id=${
      this.state.doc.id
    }`;
    const docList = returnedDocs => {
      return returnedDocs.length > 0 ? (
        returnedDocs.map((doc, i) => (
          <table className="table table-hover">
            <tbody>
              <IframeDoc
                doc={doc}
                showDoc={this.showDoc}
                hideDoc={this.hideDoc}
                autosuggestItem={autosuggestItem}
                key={i}
              />
            </tbody>
          </table>
        ))
      ) : (
        <div className="noDocuments">Sorry, no documents. Try another search</div>
      );
    };
    return (
      <div className="complianceAIDocContainer">
        {this.state.showDoc ? (
          <div className="pdfContainer">
            <div onClick={() => this.setState({ showDoc: false })}>
              <i className="material-icons">navigate_before</i>
              <span>Back to search results</span>
            </div>
            <iframe src={src} />
          </div>
        ) : (
          <div className="docs">{docList(docs)}</div>
        )}
      </div>
    );
  }
}

export default IframeDocs;
