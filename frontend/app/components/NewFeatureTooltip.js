import React from 'react';
import { connect } from 'react-redux';
import { Popover, Overlay, Button } from 'react-bootstrap';
import _ from 'lodash';
import { readNewFeatureTip } from '../../shared/actions';
import classnames from 'classnames';

// this component takes as props text for the new feature display, a readyToDisplay boolean,
// and the id of the element to which the popover should be attached.
class NewFeatureTooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      target: null
    };
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.target = document.querySelector(`#${this.props.targetId}`);
  }

  handleClick() {
    this.setState({ show: false });
    if (this.props.handleClick) {
      this.props.handleClick();
    }
    this.props.readNewFeatureTip(
      this.props.current_user.user.email,
      this.props.featureId,
      this.props.current_user
    );
  }

  render() {
    const property = `user.properties.read_new_feature_tip.${this.props.featureId}`;
    let showPopover = true;
    if (_.has(this.props.current_user, property) && !this.props.folderPopUp) {
      if (
        this.props.current_user.user.properties.read_new_feature_tip[this.props.featureId] === true
      ) {
        showPopover = false;
      }
    }

    const contact_mail_to = this.props.folderPopUp ? (
      <a href="mailto:support@compliance.ai?subject=Sign%20me%20up%20for%20Team%20Edition!">
        support@compliance.ai
      </a>
    ) : null;

    const tooltip = (
      <Popover
        id="new-feature-tooltip"
        className={classnames({ folder_action_pop_over: this.props.folderPopUp })}
      >
        <div className={classnames({ folder_action_content: this.props.folderPopUp })}>
          {this.props.content} {contact_mail_to}{' '}
        </div>
        <Button onClick={this.handleClick} className="center-block btn-primary new-feature-button">
          Got it
        </Button>
      </Popover>
    );
    const readyToDisplay = !_.isNil(this.props.readyToDisplay) ? this.props.readyToDisplay : true;
    return (
      <div>
        {!this.props.current_user.isFetching ? (
          <Overlay
            show={showPopover && readyToDisplay}
            placement="bottom"
            target={() => this.target}
          >
            {tooltip}
          </Overlay>
        ) : null}
      </div>
    );
  }
}

const mapStateToProps = state => {
  // possibly refactor
  return { current_user: state.current_user };
};

export default connect(mapStateToProps, { readNewFeatureTip })(NewFeatureTooltip);
