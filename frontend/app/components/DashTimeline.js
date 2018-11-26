import React from 'react';
import { connect } from 'react-redux';
import DashTimelineTable from './DashTimelineTable';
import { agencies_skipped_on_timeline } from '../utils/agency';
import { categories_skipped_on_timeline } from '../../shared/utils/category';
import { simpleFetchDocuments } from '../../shared/actions';
import { today, sevenDaysAgo } from '../utils/keyDates';

class NewTimeline extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }
  componentWillMount() {
    const query = {
      skip_agency: agencies_skipped_on_timeline,
      skip_category: [categories_skipped_on_timeline],
      jurisdiction: 'US',
      sort: 'publication_date',
      published_from: sevenDaysAgo,
      published_to: today,
      skip_unused_fields: true,
      limit: 400 // limit response to 400 documents
    };
    this.props.simpleFetchDocuments(query);
  }
  render() {
    return (
      <div className="newTimeline">
        <DashTimelineTable location={this.props.location} />
      </div>
    );
  }
}

const mapStateToProps = () => {
  return {};
};

const ReduxNewTimeline = connect(mapStateToProps, { simpleFetchDocuments })(NewTimeline);

export default ReduxNewTimeline;
