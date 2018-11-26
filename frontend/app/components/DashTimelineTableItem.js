import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import { category_from_api } from '../../shared/utils/category';
import { safe_analytics } from '../../shared/utils/analytics';
import { markDocumentAsRead } from '../../shared/actions';
import classNames from 'classnames';

class DashTimelineTableItem extends React.Component {
  constructor(props) {
    super(props);
  }
  selectDocument = (e, doc) => {
    const pathname = '/content';
    const outerScrollContainer = document.querySelector('.newDashboardContainer');
    const innerScrollContainer = document.querySelector('.timelineTable .table-responsive');
    const query = {
      overlay: 'pdf-overlay',
      summary_id: doc.id,
      summary_page: 'summary'
    };
    this.props.markDocumentAsRead(doc.id, true);
    this.context.router.push({
      pathname,
      query,
      state: {
        fromDashboard: {
          outer: outerScrollContainer.scrollTop,
          timelineTable: {
            inner: innerScrollContainer.scrollTop,
            agencyId: this.props.agencyId,
            slideNumber: this.props.slideNumber
          }
        } //added to indicate the source location
      }
    });
    safe_analytics('default', 'Dashboard', 'Timeline Preview Click');
  };
  render() {
    const { doc } = this.props;
    const row_classes = {
      timelineItem: true,
      read_document: doc.read
    };
    const rule = doc.rule || {};
    const comments = rule.comments_close_on ? <strong>Comments close: </strong> : '';
    const comments_date = comments ? moment(rule.comments_close_on).format('MM/DD/YYYY') : '';
    const c_break = comments ? <br /> : '';
    const effective = rule.effective_on ? <strong>Effective: </strong> : '';
    const effective_date = effective ? moment(rule.effective_on).format('MM/DD/YYYY') : '';

    return (
      <tr
        className={classNames(row_classes)}
        onClick={e => this.selectDocument(e, doc)}
        key={doc.id}
      >
        <td className="docName">
          <span className="rowText">{doc.title}</span>
        </td>
        <table className="docProps">
          <tbody>
            <tr>
              <td>
                <span className="rowText">
                  <strong>Publication Date:</strong>&nbsp;
                  {moment(doc.publication_date).format('MM/DD/YYYY')}
                </span>
              </td>
              <td>
                <span className="rowText">
                  {comments}{comments_date}{c_break}{effective}{effective_date}
                </span>
              </td>
              <td>
                <span className="rowText">
                  <strong>Doc Type:</strong> {category_from_api(doc.category)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </tr>
    );
  }
}
DashTimelineTableItem.contextTypes = {
  router: PropTypes.object
};
const mapStateToProps = () => {
  return {};
};

const ReduxDashTimelineTableItem = connect(mapStateToProps, {
  markDocumentAsRead
})(DashTimelineTableItem);

export default ReduxDashTimelineTableItem;
