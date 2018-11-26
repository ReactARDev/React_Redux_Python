import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';
import classNames from 'classnames';
import { explicit_filter_function } from '../utils/filter';
import { safe_analytics } from '../../shared/utils/analytics';
import _ from 'lodash';
import { rateSearchResult, postSearchQuery } from '../../shared/actions';

export class TopicsListItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      relevant: null
    };
  }

  componentWillReceiveProps(nextProps) {
    /*
      If the document has already been rated relevant by the user using the same
      search parameters, surface the last vote cast, otherwise show as if not voted.
    */
    const document = nextProps.document;
    if (document && nextProps.user_vote.voted_docs[document.id]) {
      if (
        _.isEqual(
          nextProps.user_vote.voted_docs[document.id].search_args,
          nextProps.user_vote.search_args
        )
      ) {
        const correct_topic =
          nextProps.user_vote.voted_docs[document.id].search_args.query.topic_id ===
          nextProps.topic.id;
        if (nextProps.user_vote.voted_docs[document.id].relevance && correct_topic) {
          if (this.state.relevant !== true) {
            this.setState({ relevant: true });
          }
        }
        if (nextProps.user_vote.voted_docs[document.id].relevance === false && correct_topic) {
          if (this.state.relevant !== false) {
            this.setState({ relevant: false });
          }
        }
      }
    }
  }

  handleTopicClick = e => {
    e.preventDefault();
    e.stopPropagation();

    explicit_filter_function(
      {},
      this.props.location,
      this.context.router,
      { topic_id: this.props.topic.id, overlay: null },
      this.props
    );
  };

  handleVoting(is_relevant) {
    const { query } = this.props.location;
    this.setState({ relevant: is_relevant });

    const vote = is_relevant ? 'Yes' : 'No';
    safe_analytics('default', 'Feedback', 'Relevant Topic', vote);

    const document = this.props.document;
    const query_with_topic_id = {
      ...query,
      topic_id: this.props.topic.id
    };
    this.props.postSearchQuery({ search_args: { query: query_with_topic_id } }).then(() => {
      const search_args = this.props.user_vote.search_args;
      this.props.rateSearchResult(document.id, is_relevant, search_args);
    });
  }

  render() {
    const topic = this.props.topic;
    const probability = topic.model_probability;

    const relevanceVoteClasses = {
      'material-icons relevant-vote': true,
      relevant: this.state.relevant === true
    };
    const notRelevanceVoteClasses = {
      'material-icons not-relevant-vote': true,
      'not-relevant': this.state.relevant === false
    };

    const showAdminData = this.props.current_user.user.roles
      ? this.props.current_user.user.roles.includes('admin')
      : false;

    return (
      <div className="topic-btn-vote-container">
        <Button bsClass="topic-list-btn" onClick={e => this.handleTopicClick(e)}>
          {topic.name}
          {this.props.rightPanel && showAdminData ? (
            <span>
              {' '}
              ({topic.judge_count}, {topic.positive_judgments}
              , {!_.isNull(probability) ? _.round(probability, 4) : ''})
            </span>
          ) : null}
        </Button>
        {this.props.rightPanel && showAdminData ? (
          <div className="relevance-topic-vote-icons">
            <i
              className={classNames(relevanceVoteClasses)}
              title="Relevant"
              onClick={() => this.handleVoting(true)}
            >
              thumb_up
            </i>
            <i
              className={classNames(notRelevanceVoteClasses)}
              title="Not Relevant"
              onClick={() => this.handleVoting(false)}
            >
              thumb_down
            </i>
          </div>
        ) : null}
      </div>
    );
  }
}

TopicsListItem.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ user_vote, current_user }) => {
  return {
    user_vote,
    current_user
  };
};

const ReduxTopicsListItem = connect(mapStateToProps, {
  rateSearchResult,
  postSearchQuery
})(TopicsListItem);

export default ReduxTopicsListItem;
