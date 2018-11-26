import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table } from 'react-bootstrap';
import { fetchIframeDocs } from '../../shared/actions';
import _ from 'lodash';
import moment from 'moment';

const CFPB_AGENCY_ID = 573;

class CFPBAgency extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      documents: null,
      view_all: false
    };
  }

  componentDidMount() {
    this.props
      .fetchIframeDocs({
        agency_id: CFPB_AGENCY_ID,
        category: 'Regulatory Agenda Item',
        published_from: '01/01/2017',
        feature_name: 'cfpb_landing_page'
      })
      .then(response => {
        this.setState({
          documents: _.orderBy(
            response.documents,
            [
              item => {
                return item.children.length;
              }
            ],
            ['desc']
          )
        });
      });
  }

  pdf_overlay = null;

  openDocument = id => {
    this.props.showDoc(id);
  };

  toggleExpand = toggleDisplayClassName => {
    let new_value = true;
    if (_.isBoolean(this.state[toggleDisplayClassName])) {
      new_value = !this.state[toggleDisplayClassName];
    }
    const new_state = {};
    new_state[toggleDisplayClassName] = new_value;
    this.setState(new_state);
  };

  formatDate = date => {
    if (!date) {
      return '';
    }
    return moment(date).format('MM/DD/YYYY');
  };

  toggleViewAll = () => {
    const view_all = this.state.view_all;
    this.setState({ view_all: !view_all });
  };

  render() {
    if (!this.state.documents) {
      return null;
    }
    const list_items = [];
    this.state.documents.forEach((entity, i) => {
      const stage = entity.agenda_rule && entity.agenda_rule.stage ? entity.agenda_rule.stage : '';

      const hasChildren = entity.children && entity.children.length > 0;

      const parent_row_classes = ['agenda-item'];
      const children_row_classes = [];
      if (this.state['display_' + entity.id]) {
        children_row_classes.push('agenda-item-child-row');
      } else {
        children_row_classes.push('hidden');
      }

      if (this.state.view_all || i < 3) {
        list_items.push(
          <tr key={entity.id} className={parent_row_classes.join(' ')}>
            <td
              className={hasChildren ? 'parent-title' : 'parent-title first-header'}
              onClick={() => this.toggleExpand('display_' + entity.id)}
            >
              <div className="arrow-drop-down-container">
                <i className="material-icons">
                  {this.state['display_' + entity.id] ? 'arrow_drop_up' : 'arrow_drop_down'}
                </i>
              </div>
              <div>
                {entity.title}
                <span>
                  {' - '}
                  {stage}
                </span>
              </div>
            </td>
            <td className="view-pdf-icon" onClick={() => this.openDocument(entity.id)}>
              <div>
                <i className="material-icons">picture_as_pdf</i>
              </div>
            </td>
            <td className="pub_date">{this.formatDate(entity.publication_date)}</td>
          </tr>
        );

        if (hasChildren) {
          entity.children.forEach(child => {
            list_items.push(
              <tr key={child.id} className={children_row_classes.join('')}>
                <td className="child-title">
                  {child.title}
                  <span className="pub_date">
                    {' - '}
                    {child.category}
                  </span>
                </td>
                <td className="view-pdf-icon" onClick={() => this.openDocument(child.id)}>
                  <div>
                    <i className="material-icons">picture_as_pdf</i>
                  </div>
                </td>
                <td className="pub_date">{this.formatDate(child.pub_date)}</td>
              </tr>
            );
          });
        } else {
          list_items.push(
            <tr key={i} className={children_row_classes.join('')}>
              <td className="child-title">{'No related documents have been published.'}</td>
              <td />
              <td className="pub_date" />
            </tr>
          );
        }
      }
    });

    return (
      <div className="agencies-container">
        <h2>{'CFPB: Regulatory Agenda 2017'}</h2>
        <div className="agenda-items-container">
          <Table condensed>
            <thead>
              <tr className="agency-landing-header">
                <th className="first-header">Title, Stage of Rulemaking</th>
                <th />
                <th>{'Publication Date'}</th>
              </tr>
            </thead>
            <tbody>{list_items}</tbody>
          </Table>
        </div>
        <div className="view-all-button" onClick={() => this.toggleViewAll()}>
          <i className="material-icons">{this.state.view_all ? 'expand_less' : 'expand_more'}</i>
          <span>
            {'View '}
            {this.state.view_all ? 'less' : 'all'}
          </span>
        </div>
      </div>
    );
  }
}

CFPBAgency.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    all_documents: state.all_documents
  };
};

const ReduxCFPBAgency = connect(mapStateToProps, {
  fetchIframeDocs
})(CFPBAgency);

export default ReduxCFPBAgency;
