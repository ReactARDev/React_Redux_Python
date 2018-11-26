import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchAllAnnotationTasks, fetchContributorReviewsCount } from '../../shared/actions';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router';
import _ from 'lodash';
import {
  REQUIRED_REVIEWS_NUM_MONTHLY,
  REQUIRED_REVIEWS_NUM_TODAY
} from '../../shared/utils/contributor';

class ContributorTasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      all_tasks: null
    };
  }

  componentDidMount() {
    this.props.fetchAllAnnotationTasks({}).then(resp => {
      this.setState({ all_tasks: resp.annotation_tasks });
      if (!_.isEmpty(resp.annotation_tasks)) {
        _.filter(resp.annotation_tasks, {
          type: 'contributor',
          status: 'active'
        }).forEach(task => {
          this.props.fetchContributorReviewsCount(task.id, {});
        });
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (
      _.isEmpty(this.props.all_annotation_tasks.annotation_tasks) &&
      !_.isEmpty(nextProps.all_annotation_tasks.annotation_tasks)
    ) {
      _.filter(nextProps.all_annotation_tasks.annotation_tasks, {
        type: 'contributor',
        status: 'active'
      }).forEach(task => {
        this.props.fetchContributorReviewsCount(task.id, {});
      });
    }
  }

  handleNavigateToProduct = e => {
    e.preventDefault();

    this.context.router.push({
      pathname: '/pro-contributor'
    });
  };

  /*
    XXX: Component developed to display only one contributor task (review document)
         UI (render method) will need to be updated when more tasks are added
  */
  render() {
    if (!this.props.current_user.isReady || !this.state.all_tasks) {
      return null;
    }

    const back_to_pro_btn = (
      <Button bsStyle="primary" className="back-to-product" onClick={this.handleNavigateToProduct}>
        Back to Pro Edition
      </Button>
    );

    const contributor_tasks = _.filter(this.state.all_tasks, {
      type: 'contributor',
      status: 'active'
    });

    if (_.isEmpty(contributor_tasks)) {
      return (
        <div>
          <h4>{'Your document queue is empty'}</h4>
          {back_to_pro_btn}
        </div>
      );
    }

    if (!this.props.contributor_reviews || !this.props.contributor_reviews.isReady) {
      return null;
    }

    const reviews = this.props.contributor_reviews.contributor_reviews_count;
    const month_total = reviews.current_month_total;
    const today_total = reviews.today_total;
    const number_to_review = REQUIRED_REVIEWS_NUM_MONTHLY - month_total;
    let display_start_review = (
      <Link to={'/contributortool?id=' + contributor_tasks[0].id}>
        <Button bsStyle="primary">Review Docs</Button>
      </Link>
    );

    if (today_total >= REQUIRED_REVIEWS_NUM_TODAY) {
      display_start_review = (
        <h5>Congratulations! You’ve completed the maximum # of reviewed documents for today!</h5>
      );
    }

    let month_total_notification = (
      <div>
        <h5>
          For this month, please review {number_to_review} more documents. Flag documents that have
          issues and provide feedback.
        </h5>
        <h5>Completed this month: {month_total}</h5>
      </div>
    );

    if (month_total >= REQUIRED_REVIEWS_NUM_MONTHLY) {
      month_total_notification = (
        <div>
          <h5>Congratulations! You’ve met your monthly minimum document review requirements.</h5>
        </div>
      );
    }

    return (
      <div className="">
        {month_total_notification}
        {display_start_review}
        {back_to_pro_btn}
      </div>
    );
  }
}

ContributorTasks.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllAnnotationTasks: params => {
      return dispatch(fetchAllAnnotationTasks(params));
    },
    fetchContributorReviewsCount: (task_id, params) => {
      return dispatch(fetchContributorReviewsCount(task_id, params));
    }
  };
};

const mapStateToProps = state => {
  return {
    all_annotation_tasks: state.all_annotation_tasks,
    current_user: state.current_user,
    contributor_reviews: state.contributor_reviews
  };
};

const ReduxContributorTasks = connect(mapStateToProps, mapDispatchToProps)(ContributorTasks);

export default ReduxContributorTasks;
