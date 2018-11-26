import React from 'react';
import { Button, Dropdown, MenuItem } from 'react-bootstrap';
import ReactDOM from 'react-dom';
import { category_from_api } from '../../shared/utils/category';
import { safe_analytics } from '../../shared/utils/analytics';
import _ from 'lodash';
import classnames from 'classnames';

class DocumentSummaryLinks extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const document = this.props.document;
    const right_panel_btn = ReactDOM.findDOMNode(this.refs.right_panel_btn);
    if (right_panel_btn) {
      right_panel_btn.addEventListener('click', () => {
        if (category_from_api(document.category) === 'Mainstream News') {
          window.open(document.web_url, '_blank');
        } else {
          this.props.toggleOverlay('pdf-overlay');
        }
      });
    }
  }

  render() {
    const document = this.props.document;

    const buttonClick = event => {
      event.preventDefault();

      safe_analytics(
        'Doc Details – View Agency Website',
        'Doc Details',
        'View Agency Website',
        document.title
      );

      this.props.markDocumentAsRead(document.id, true);
      window.open(event.target.href, '_blank');
    };

    // special handling for when creating summary for email, no location is passed
    const query = this.props.location ? this.props.location.query : null;
    const pdf_label = !_.isNil(query) && query.overlay === 'pdf-overlay' ? 'Close PDF' : 'View PDF';
    const news_label =
      !_.isNil(query) && query.overlay === 'news-overlay' ? 'Close Summary' : 'View Summary';

    const viewLinks = [];

    // First element of viewLink differs for certain documents
    if (category_from_api(document.category) !== 'Mainstream News') {
      // reg pdf doc
      viewLinks.push({
        label: pdf_label,
        onClick: () => this.props.toggleOverlay('pdf-overlay')
      });
    }

    if (document.web_url && document.web_url.match(/^http/)) {
      const label =
        category_from_api(document.category) === 'Mainstream News'
          ? 'View Full Article'
          : 'View on Source Website';
      const href =
        category_from_api(document.category) === 'Mainstream News'
          ? '#'
          : document.web_url;
      viewLinks.push({
        label,
        href,
        onClick: buttonClick
      });
    }


    // greatly simplified formatting for emails
    if (this.props.renderForEmail) {
      const items = viewLinks.map((link, i) => {
        if (link.disabled) {
          return null;
        }
        return (
          <li key={i}>
            <a href={link.href}>{link.label}</a>
          </li>
        );
      });
      return <ul>{items}</ul>;
    }

    let dropdownMenuContents = null;
    let dropdownDisabled = false;

    if (viewLinks.length === 0) {
      dropdownDisabled = true;

      viewLinks.push({
        href: null,
        label: 'View PDF',
        disabled: true
      });
    } else {
      dropdownMenuContents = viewLinks.map((link, i) => {
        if (i === 0) {
          //skip the first item
          return null;
        }
        return (
          <MenuItem
            eventKey={i}
            key={i}
            onClick={viewLinks[i].onClick}
            href={viewLinks[i].href}
            className={viewLinks[i].className}
          >
            {viewLinks[i].label}
          </MenuItem>
        );
      });
    }

    const close_overlay = pdf_label === 'Close PDF' || news_label === 'Close Summary';

    const pdf_btn_classes = {
      'doc-summary-btn': true,
      close_overlay
    };

    const toggle_btn_classes = {
      'dropdown-toggle': true,
      disabled: viewLinks.length < 2,
      close_overlay
    };

    const toggle_menu_classes = {
      disabled: viewLinks.length < 2
    };
    return (
      <Dropdown id="document-summary-view-btn">
        <Button
          ref="right_panel_btn"
          bsStyle="primary"
          disabled={dropdownDisabled}
          href={viewLinks[0].href}
          bsClass={classnames(pdf_btn_classes)}
        >
          {viewLinks[0].label}
        </Button>
        <Dropdown.Toggle
          className={classnames(toggle_btn_classes)}
          disabled={viewLinks.length < 2}
        />
        <Dropdown.Menu className={classnames(toggle_menu_classes)}>
          {dropdownMenuContents}
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}

export default DocumentSummaryLinks;
