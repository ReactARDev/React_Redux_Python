import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { readNewFeatureTip, addBanner, clearErrors } from '../../shared/actions';
import { dashboard_banners } from '../utils/bannerComponents';
import _ from 'lodash';

class AlertBanner extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillReceiveProps(nextProps) {
    //remove dash banners if dash not in view
    for (const dash_banner of dashboard_banners) {
      if (
        nextProps.current_view.banner.type === dash_banner.type &&
        nextProps.location.pathname !== '/dashboard' &&
        _.isEmpty(nextProps.errors)
      ) {
        nextProps.addBanner(dash_banner.type, false);
      }
    }

    //update user props when select 'Learn More' button
    if (nextProps.location.state && nextProps.location.state.fromTopicsBanner) {
      this.updateUserProps();
    }
  }

  handleClick = e => {
    e.preventDefault();
    e.stopPropagation();
    //update user props when select 'x' on dash banner
    this.updateUserProps();
    if (!_.isEmpty(this.props.errors)) {
      this.props.clearErrors(null);
    }
    //close banner
    this.props.addBanner(this.props.current_view.banner.type, false);
  };

  handleBannerClick = () => {
    if (this.props.current_view.banner.type === 'topics_feature_success') {
      //update user props when dash banner selected
      this.updateUserProps();
      this.context.router.push({
        pathname: '/sources',
        query: {
          view: 'topics'
        }
      });
    }

    return null;
  };

  updateUserProps = () => {
    //update servers about dashboard banner view status
    for (const dash_banner of dashboard_banners) {
      if (this.props.current_view.banner.type === dash_banner.type) {
        this.props.readNewFeatureTip(
          this.props.current_user.user.email,
          dash_banner.id,
          this.props.current_user
        );
      }
    }
  };
  render() {
    const bannerClasses = {
      'banner-container': true,
      success: _.includes(this.props.current_view.banner.type, 'success'),
      fail: this.props.current_view.banner.type === 'error'
    };
    return (
      <div className={classnames(bannerClasses)} onClick={() => this.handleBannerClick()}>
        {this.props.current_view.banner.content}
        {this.props.current_view.banner.suppressCloseButton ? null : (
          <i className="material-icons" onClick={e => this.handleClick(e)}>
            close
          </i>
        )}
      </div>
    );
  }
}

AlertBanner.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ current_user, current_view, errors }) => {
  return {
    current_user,
    current_view,
    errors
  };
};

export default connect(mapStateToProps, {
  readNewFeatureTip,
  addBanner,
  clearErrors
})(AlertBanner);
