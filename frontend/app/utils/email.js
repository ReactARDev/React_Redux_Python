import React from 'react';
import ReactDOMServer from 'react-dom/server';
import DocumentSummary from '../components/DocumentSummary';
import { fetchDocumentPDF, generateFilename } from './pdf';
import { initiateDownload } from './downloads';
import _ from 'lodash';
import base64 from 'base64-js';

// build a MIME email message using the DocumentSummary component and
// then initiate a download
export function create_email(documents) {
  if (!_.isArray(documents)) {
    documents = [documents];
  }
  let msg = '';

  const boundary = Math.random();

  let subject = 'An important document from Compliance.ai has been shared with you';

  if (documents.length > 1) {
    subject = 'Important documents from Compliance.ai have been shared with you';
  }

  const gen_boundary = is_end => {
    const end = is_end ? '--' : '';
    return `\n--${boundary}${end}\n`;
  };

  let html_body = '<p><br /></p><hr />';

  const pdf_promises = [];

  for (const document of documents) {
    // render the DocumentSummary view to a string. Note it must be
    // fully initialized by its props. Redux will not work here.
    const cur_html = ReactDOMServer.renderToStaticMarkup(
      <DocumentSummary document={document} renderForEmail />
    );

    pdf_promises.push(fetchDocumentPDF(document, true, cur_html));

    html_body += cur_html;
    html_body += '<hr /><br />\n';
  }

  return Promise.all(pdf_promises).then(pdfs => {
    msg += `MIME-Version: 1.0
Subject: ${subject}
X-Unsent: 1
Content-Type: multipart/mixed; boundary=${boundary}
`;

    msg += gen_boundary();

    msg += `Content-Type: text/html; charset=UTF-8\n\n`;

    msg += html_body;

    let i = 0;
    for (const pdf of pdfs) {
      msg += gen_boundary();

      const filename = generateFilename(documents[i].title);

      msg += `Content-Type: application/pdf; name="${filename}"
Content-Disposition: attachment; filename="${filename}"
Content-Transfer-Encoding: base64

`;
      const view = new Uint8Array(pdf);
      msg += base64.fromByteArray(view);
      i++;
    }

    msg += gen_boundary(true);

    const blob = new Blob([msg], { type: 'message/rfc822' });
    const filename = 'Compliance_ai_Shared.eml';

    initiateDownload(blob, filename);

    return msg;
  });
}
