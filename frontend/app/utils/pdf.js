import React from 'react';
import ReactDOMServer from 'react-dom/server';
import DocumentSummary from '../components/DocumentSummary';
import _ from 'lodash';
import { apiUrl } from '../../shared/config';

export function fetchDocumentPDF(doc, include_coversheet, summary_html = null) {
  let params = null;
  const url = apiUrl + '/document_pdf/' + doc.id;

  if (include_coversheet) {
    let html_body = summary_html;

    if (!html_body) {
      html_body = ReactDOMServer.renderToStaticMarkup(
        <DocumentSummary document={doc} renderForEmail />
      );
    }

    // mess with the body using DOM:
    const elem = document.createElement('div');
    elem.innerHTML = html_body;

    // now translate the html table into the 2D array expected by the API
    const rows = elem.getElementsByTagName('tr');

    const table_contents = [];
    _.each(rows, row => {
      const table_row = [];
      const cells = row.getElementsByTagName('td');

      _.each(cells, cell => {
        table_row.push(cell.innerText);
      });

      table_contents.push(table_row);
    });

    params = {
      coverpage: true,
      title: doc.title,
      text_para: doc.summary_text,
      table_contents
    };
  }

  return new Promise((resolve, reject) => {
    // use pain in the ass XMLHttpRequest directly because reqwest doesn't handle binary data
    const xhr = new XMLHttpRequest();

    xhr.onload = evt => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(xhr);
      }
    };

    const error_fn = e => {
      reject(xhr);
    };
    xhr.onabort = error_fn;
    xhr.onerror = error_fn;

    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.setRequestHeader('Authorization', localStorage.token);
    xhr.responseType = 'arraybuffer';
    xhr.send(JSON.stringify(params));
  });
}

export function generateFilename(title, prefix = 'Compliance_ai_', suffix = 'pdf') {
  title = title.slice(0, 50);
  title = title.replace(/ /g, '_');
  title = title.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${prefix}${title}.${suffix}`;
}
