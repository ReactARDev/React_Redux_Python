import React from 'react';
import { Table, Pagination } from 'react-bootstrap';
import { connect } from 'react-redux';
import { fetchAggregatedAnnotations } from '../../shared/actions';
import AggregatedAnnotation from './AggregatedAnnotation';
import Select from 'react-select';

class AggregatedAnnotations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aggregated_annotations: [],
      sortAsc: true,
      field: '',
      limit: 20,
      count: 0,
      topicIdToDisplay: 1, //1 is lending,
      offset: 0
    };
  }
  componentDidMount() {
    this.props
      .fetchAggregatedAnnotations(this.state.topicIdToDisplay)
      .then(() => this.forceUpdate());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      aggregated_annotations: nextProps.aggregated_annotations.aggregated_annotations,
      total: nextProps.aggregated_annotations.total
    });
  }
  sortAggregatedAnnotations = field => {
    const sort = {
      [`sorting_${field}`]: this.state.sortAsc ? 'ascending' : 'descending'
    };
    this.props.fetchAggregatedAnnotations(this.state.topicIdToDisplay, sort);
    this.setState({ sortAsc: !this.state.sortAsc });
  };
  sortIcons = field => {
    if (
      field === 'doc_id' ||
      field === 'is_in_agreement' ||
      field === 'gold_difficulty' ||
      field === 'arbitrary_tags' ||
      field === 'notes'
    ) {
      return (
        <span
          className="aggregatedAnnotationsSortIcons"
          onClick={() => this.sortAggregatedAnnotations(field)}
        >
          <i className="material-icons">keyboard_arrow_down</i>
        </span>
      );
    }
    return null;
  };
  handlePageChange = eventKey => {
    const offset = this.state.limit * (eventKey - 1);
    this.setState({
      page: eventKey,
      offset
    });
    this.props
      .fetchAggregatedAnnotations(this.state.topicIdToDisplay, { offset })
      .then(() => this.forceUpdate());
  };
  handleSelectTopicChange = topic => {
    this.setState({ topicIdToDisplay: topic.value });
    this.props.fetchAggregatedAnnotations(topic.value).then(() => this.forceUpdate());
  };
  render() {
    const fields = [
      'doc_id',
      'doc_title',
      'annotation_task_topic_group_name',
      'judges',
      'is_in_agreement',
      'gold annotation',
      'gold_difficulty',
      'arbitrary_tags',
      'notes'
    ];
    return (
      <div className="aggregatedAnnotations">
        <h1>Aggregated Annotations</h1>
        <Table>
          <thead>
            <tr>
              {fields.map((field, i) => {
                if (field === 'annotation_task_topic_group_description') {
                  return (
                    <th key={i}>
                      topic_group_desc
                      {this.sortIcons(field)}
                    </th>
                  );
                }
                if (field === 'annotation_task_topic_group_name') {
                  return (
                    <th key={i}>
                      <Select
                        className="topicFilter"
                        options={this.props.sources.defaultTopics.map(topic => ({
                          value: topic.id,
                          label: topic.label
                        }))}
                        value={this.state.topicIdToDisplay}
                        onChange={obj => this.handleSelectTopicChange(obj)}
                      />
                      topic_group_name
                      {this.sortIcons(field)}
                    </th>
                  );
                }
                return (
                  <th key={i}>
                    {field}
                    {this.sortIcons(field)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {this.state.aggregated_annotations.map((annotation, i) => (
              <AggregatedAnnotation
                {...annotation}
                fields={fields}
                topicIdToDisplay={this.state.topicIdToDisplay}
                key={i}
                offset={this.state.offset}
              />
            ))}
          </tbody>
        </Table>
        <Pagination
          bsSize="small"
          prev
          next
          first
          last
          ellipsis
          boundaryLinks
          items={Math.ceil(this.state.total / this.state.limit)}
          maxButtons={5}
          activePage={this.state.page}
          onSelect={this.handlePageChange}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    aggregated_annotations: state.aggregated_annotations,
    ...state.sources
  };
};

const ReduxAggregatedAnnotations = connect(mapStateToProps, { fetchAggregatedAnnotations })(
  AggregatedAnnotations
);

export default ReduxAggregatedAnnotations;
