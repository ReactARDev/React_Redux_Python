import React from 'react';
import _ from 'lodash';
import { Row, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import activatePersonalizeSelectionBox from './ActivatePersonalizeSelectionBox';
import {
  defaultFederalAgencies,
  defaultStateAgencies,
  defaultTopics
} from '../../shared/utils/defaultSources';
import { safe_analytics } from '../../shared/utils/analytics';

class ActivatePersonalize extends React.Component {
  static allAgencies() {
    return defaultFederalAgencies;
  }

  static stateAgencies() {
    return defaultStateAgencies;
  }

  static getDefaults() {
    const _get = items => {
      const defaults = items.filter(x => !!x.onboard_default).map(x => x.id);
      const defaultsObj = {};
      for (const d of defaults) {
        defaultsObj[d] = true;
      }
      return defaultsObj;
    };
    return {
      agencies: _get(ActivatePersonalize.allAgencies()),
      topics: _get(defaultTopics),
      stateAgencies: {} // no states are selected by default
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      errors: {},
      showModal: false,
      modalText: '', // separate state so cancel works
      step: 'federal',
      submitting: false
    };
  }

  handleBoxClick(event) {
    event.preventDefault();
    const mode = event.currentTarget.dataset.mode;
    const name = event.currentTarget.dataset.name;

    if (mode === 'agencies') {
      safe_analytics('Registration – Federal Selection', 'Registration', 'Federal Selection', name);
    } else if (mode === 'stateAgencies') {
      safe_analytics('Registration – State Selection', 'Registration', 'State Selection', name);
    } else if (mode === 'topics') {
      safe_analytics('Registration – Topic Selection', 'Registration', 'Topic Selection', name);
    }

    if (name === 'other') {
      if (mode === 'agencies') {
        this.setState({
          modalText: this.props.data.otherAgencies
        });
      } else if (mode === 'stateAgencies') {
        this.setState({
          modalText: this.props.data.otherStateAgencies
        });
      } else {
        this.setState({
          modalText: this.props.data.otherTopics
        });
      }
      this.setState({ showModal: mode });
      return;
    }

    const curState = this.props.data[mode];

    if (curState[name]) {
      delete curState[name];
    } else {
      curState[name] = true;
    }

    this.props.handleChange({
      [mode]: {
        ...curState
      }
    });
  }

  handleModalChange(event) {
    event.preventDefault();
    const value = event.target.value;

    this.setState({
      modalText: value
    });
  }

  closeModal(clear) {
    const mode = this.state.showModal;

    if (!clear) {
      if (mode === 'agencies') {
        this.props.handleChange({ otherAgencies: this.state.modalText });
      } else if (mode === 'stateAgencies') {
        this.props.handleChange({ otherStateAgencies: this.state.modalText });
      } else {
        this.props.handleChange({ otherTopics: this.state.modalText });
      }
    }

    this.setState({
      modalText: '',
      showModal: false
    });
  }


  doSubmit() {
    if (this.state.step === 'federal') {
      this.setState({
        step: 'state'
      });
      window.scrollTo(0, 0);
      this.props.advanceStep();
    } else {
      this.setState({
        submitting: true
      });
      this.props.doSubmit();
    }
  }

  renderModal() {
    if (!this.state.showModal) {
      return null;
    }

    const value = this.state.modalText;
    let placeholder;

    if (this.state.showModal === 'agencies') {
      placeholder = 'Name of requested data source.';
    } else if (this.state.showModal === 'topics') {
      placeholder = 'Name of requested topic.';
    }

    return (
      <Modal show onHide={() => this.closeModal(true)} className="personalize-modal">
        <Modal.Header closeButton>
          <Modal.Title>What are we missing?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please let us know what you would like to see here. Thanks for taking the time!</p>
          <textarea
            onChange={ev => this.handleModalChange(ev)}
            placeholder={placeholder}
            value={value}
          />
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-info" onClick={() => this.closeModal()}>
            Save
          </button>
          <button type="button" className="btn btn-default" onClick={() => this.closeModal(true)}>
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    const agencySel = [];
    const topicSel = [];
    const stateSel = [];

    let myAgencies = ActivatePersonalize.allAgencies();
    let myStateAgencies = ActivatePersonalize.stateAgencies();
    const handleClick = ev => this.handleBoxClick(ev);

    myAgencies = _.sortBy(myAgencies, a => (a.display_name || a.short_name).toLowerCase());
    myStateAgencies = _.sortBy(myStateAgencies, a => (a.display_name || a.name).toLowerCase());

    let submitDisabled = true;

    if (Object.keys(this.props.data.agencies).length > 0) {
      submitDisabled = false;
    }

    const getChecked = (mode, name) => {
      if (!mode) {
        return false;
      }

      const curState = this.props.data[mode];

      return !!curState[name];
    };

    for (const agency of myAgencies) {
      agencySel.push(
        activatePersonalizeSelectionBox(
          'agencies',
          agency.display_name || agency.short_name,
          agency.id,
          getChecked('agencies', agency.id),
          handleClick,
          agency.name
        )
      );
    }

    agencySel.push(
      activatePersonalizeSelectionBox(
        'agencies',
        "I don't see what I'm looking for",
        'other',
        false,
        handleClick,
        null,
        'other'
      )
    );

    const popover = text =>
      <Popover id="sourceButtonPopover">
        {text}
      </Popover>;
    _.sortBy(defaultTopics, topic => topic.name).forEach((topic, i) => {
      const topicButton = activatePersonalizeSelectionBox(
        'topics',
        topic.name,
        topic.id,
        getChecked('topics', topic.id),
        handleClick,
        null,
        null
      );
      if (!_.isNil(topic.description)) {
        topicSel.push(
          <OverlayTrigger
            trigger={['focus', 'hover']}
            placement="bottom"
            overlay={popover(topic.description)}
            key={topic.name}
          >
            {topicButton}
          </OverlayTrigger>
        );
      } else {
        topicSel.push(topicButton);
      }
    });

    topicSel.push(
      activatePersonalizeSelectionBox(
        'topics',
        "I don't see what I'm looking for",
        'other',
        false,
        handleClick,
        null,
        'other'
      )
    );

    for (const agency of myStateAgencies) {
      const state_name = agency.id || agency.short_name;
      stateSel.push(
        activatePersonalizeSelectionBox(
          'stateAgencies',
          agency.display_name || agency.name,
          state_name,
          getChecked('stateAgencies', state_name),
          handleClick,
          null,
          null,
          true
        )
      );
    }

    stateSel.push(
      activatePersonalizeSelectionBox(
        'stateAgencies',
        "I don't see what I'm looking for",
        'other',
        false,
        handleClick,
        null,
        'other'
      )
    );

    let errorContents = null;

    if (this.props.error) {
      errorContents = (
        <Row>
          <p className="bg-danger">
            {this.props.error}
          </p>
        </Row>
      );
    }

    let dataSourceError = null;

    if (submitDisabled) {
      dataSourceError = (
        <Row>
          <p className="bg-danger">Please select at least one federal data source to continue</p>
        </Row>
      );
    }

    const customizeBlurb = (
      <div>
        <Row>
          <h2>Customize your data</h2>
        </Row>
        <Row>
          <p>
            Compliance.ai is tailored to show what's relevant to you. To kick off this process,
            please select at least one of the document sources.
          </p>
          <p>
            Only what you select will appear on your dashboard. But don't worry! You can always
            change your choices.
          </p>
        </Row>
        {dataSourceError}
      </div>
    );

    const all = sourceType => {
      return (
        <span className="all">
          <span onClick={() => this.props.selectAll(sourceType)} className="click">
            Select All
          </span>
          {'   '}
          |
          {'   '}
          <span onClick={() => this.props.clearAll(sourceType)} className="click">
            Clear All
          </span>
        </span>
      );
    };
    return (
      <div className="personalize-container">
        <Row className="logo-row">
          <div className="logo" />
        </Row>
        {this.renderModal()}
        <div className="panel">
          {this.props.stepContainer}
          {errorContents}
          <div className={this.state.step === 'federal' ? '' : 'hidden'}>
            {customizeBlurb}
            <Row>
              <h3>Federal data sources:</h3>
              {all('agencies')}
            </Row>
            <Row>
              <div className="selection-container">
                {agencySel}
              </div>
            </Row>
            <Row>
              <h2>Follow topics for important updates.</h2>
            </Row>
            <Row>
              <p>
                Select relevant topics to receive a personalized weekly email update. Your
                selections will also inform topic features coming soon to the app.
              </p>
            </Row>
            <Row>
              <h3>Financial Services topics:</h3>
              {all('topics')}
            </Row>
            <Row>
              <div className="selection-container">
                {topicSel}
              </div>
            </Row>
            <Row>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => this.doSubmit()}
                disabled={submitDisabled}
              >
                Next Section: State Sources
                <i className="material-icons next-section-arrow">keyboard_arrow_right</i>
              </button>
            </Row>
          </div>
          <div className={this.state.step === 'state' ? '' : 'hidden'}>
            {customizeBlurb}
            <Row>
              <h3>State data sources</h3>
              {all('stateAgencies')}
            </Row>
            <Row>
              <div className="selection-container">
                {stateSel}
              </div>
            </Row>

            <Row>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => this.doSubmit()}
                disabled={submitDisabled || this.state.submitting}
              >
                Continue to my dashboard
              </button>
            </Row>
          </div>
        </div>
      </div>
    );
  }
}

export default ActivatePersonalize;
