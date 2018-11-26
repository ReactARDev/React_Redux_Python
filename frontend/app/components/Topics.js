import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TopicsGuide from './TopicsGuide';

class Topics extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      topics_feedback_display_open: false
    };
  }

  render() {
    return (
      <div className='topics-container'>
        <TopicsGuide
          location={this.props.location}
          router={this.context.router}
          topics_feedback_display_open={this.state.topics_feedback_display_open}
          modalClose={() => this.setState({ topics_feedback_display_open: false })}
          modalOpen={() => this.setState({ topics_feedback_display_open: true })}
        />
      </div>
    );
  }
}

// classname to apply to top level container
Topics.className = 'topics-menu';

Topics.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({}) => {
  return {};
};

export default connect(mapStateToProps, {})(Topics);
