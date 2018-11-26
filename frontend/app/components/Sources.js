import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Popover, OverlayTrigger, Modal } from 'react-bootstrap';
import { defaultFederalAgencies, defaultStateAgencies, defaultTopics } from '../../shared/utils/defaultSources';
import TopicFeedback from './TopicFeedback';
import Feedback from './Feedback';
import {
  followAgencies,
  followEntities,
  fetchAgencies,
  fetchFollowedEntities,
  addContributorPoints,
  fetchTopics,
  followTopics,
  fetchDocuments
} from '../../shared/actions';
import ABImg from '../images/News-AB-Logo.jpg';
import ECImg from '../images/News-Economist-Logo.jpg';
import NHImg from '../images/News-Hill-Logo.jpg';
import { safe_analytics } from '../../shared/utils/analytics';
import PropTypes from 'prop-types';

class Sources extends React.Component {
  constructor(props) {
    super(props);

    let source = 'federal';
    if (props.location.query.view === 'topics') {
      source = 'topics';
    }
    if (props.location.query.view === 'state') {
      source = 'state';
    }
    if (props.location.query.view === 'mainstream_news') {
      source = 'mainstream_news';
    }

    this.state = {
      source,
      selections: { federal: {}, state: {}, topics: {}, mainstream_news: {} },
      agenciesReady: false,
      showFederalWarning: false,
      requestNewsSourceModal: false
    };
  }

  componentWillMount() {
    this.props.fetchTopics().then(() => {
      const selections = { ...this.state.selections };
      const topics = {};
      this.props.topics.followed_topics.forEach(topic => {
        topics[topic.topic_id] = topic.following;
      });
      selections.topics = topics;
      this.setState({ selections });
    });
    Promise.all([this.props.fetchAgencies(true), this.props.fetchFollowedEntities()]).then(res => {
      this.updateSelectionsFromProps(this.props);
    });
    this.props.addContributorPoints('updatefollowed'); //points for opening the sources link
  }

  componentWillReceiveProps(nextProps) {
    const source = nextProps.location.query.view;
    if (this.props.location.query.view !== nextProps.location.query.view) {
      const newState = { source };
      if (source !== 'federal') {
        newState.showFederalWarning = false;
      }
      this.setState(newState);
    }
  }

  getNewsImg = newsSource => {
    let src = '';
    if (newsSource.name === 'American Banker') {
      src = ABImg;
    }
    if (newsSource.name === 'The Economist: Finance and Economics') {
      src = ECImg;
    }
    if (
      newsSource.name === 'The Hill: Finance Regulation' ||
      newsSource.name === 'The Hill: Finance Policy'
    ) {
      src = NHImg;
    }
    if (newsSource.name === 'The Hill: Finance Regulation') {
      src = NHImg;
    }
    return <img src={src} alt={newsSource.name} />;
  };

  updateSelectionsFromProps(props) {
    const selections = { ...this.state.selections };
    const followedMainstreamNewsSources = props.entities.followed_entities.filter(
      entity => entity.entity_type === 'news_sources'
    );
    for (const newsSource of followedMainstreamNewsSources) {
      selections.mainstream_news[newsSource.entity_id] = true;
    }

    const followedStates = props.entities.followed_entities.filter(
      entity => entity.entity_type === 'jurisdictions'
    );
    for (const state of followedStates) {
      selections.state[state.entity_id] = true;
    }

    const followedAgencies = props.agencies.followed_agencies;
    for (const agency of followedAgencies) {
      if (agency.type === 'state') {
        selections.state[agency.id] = true;
      } else {
        selections.federal[agency.id] = true;
      }
    }

    if (!_.isEqual(selections, this.state.selections)) {
      this.setState({ selections });
    }
    if (props.agencies.isReady) {
      this.setState({ agenciesReady: true });
    }
  }

  handleSelectFederalSource = source => {
    const id = source.id;
    const newSelections = { ...this.state.selections };
    if (this.state.selections.federal[id]) {
      if (Object.keys(this.state.selections.federal).length <= 1) {
        this.setState({ showFederalWarning: true });
        return;
      }
      safe_analytics('default', 'Following', 'Deselect federal source', source.short_name);
      this.props.followAgencies({ agencies: [{ id, following: false }] }).then(response => {
        this.props.fetchAgencies(true);
      });
      delete newSelections.federal[id];
    } else {
      safe_analytics('default', 'Following', 'Select federal source', source.short_name);
      this.props.followAgencies({ agencies: [{ id, following: true }] }).then(response => {
        this.props.fetchAgencies(true);
      });
      newSelections.federal[id] = true;
      this.setState({ showFederalWarning: false });
    }
    this.setState({ selections: newSelections });
  };
  handleSelectStateSource(source) {
    const newSelections = { ...this.state.selections };
    if (source.id === null) {
      // in this case, state has no data so should be put in entities table
      const entity_id = source.jurisdiction_id;
      if (this.state.selections.state[entity_id]) {
        safe_analytics('default', 'Following', 'Deselect state source', source.short_name);
        this.props
          .followEntities({
            entities: [{ entity_id, entity_type: 'jurisdictions', following: false }]
          })
          .then(response => {
            this.props.fetchFollowedEntities({ entity_type: 'jurisdictions' });
          });
        delete newSelections.state[entity_id];
      } else {
        safe_analytics('default', 'Following', 'Select state source', source.short_name);
        this.props
          .followEntities({
            entities: [{ entity_id, entity_type: 'jurisdictions', following: true }]
          })
          .then(response => {
            this.props.fetchFollowedEntities({ entity_type: 'jurisdictions' });
          });
        newSelections.state[entity_id] = true;
      }
    } else {
      // in the case where states have an id, they have data and should be posted to agencies table
      const id = source.id;
      if (this.state.selections.state[id]) {
        safe_analytics('default', 'Following', 'Deselect state source', source.short_name);
        this.props
          .followAgencies({ agencies: [{ id, following: false }] })
          .then(() => this.props.fetchAgencies(true));
        delete newSelections.state[id];
      } else {
        safe_analytics('default', 'Following', 'Select state source', source.short_name);
        this.props
          .followAgencies({ agencies: [{ id, following: true }] })
          .then(() => this.props.fetchAgencies(true));
        newSelections.state[id] = true;
      }
    }
    this.setState({ selections: newSelections });
  }

  handleSelectTopic = source => {
    const id = source.id;
    const newSelections = { ...this.state.selections };
    if (this.state.selections.topics[id]) {
      safe_analytics('default', 'Following', 'Deselect topic', source.label);
      this.props.followTopics({ topics: [{ id, following: false }] }).then(response => {
        this.props.fetchTopics();
      });
      delete newSelections.topics[id];
    } else {
      safe_analytics('default', 'Following', 'Select topic', source.label);
      this.props.followTopics({ topics: [{ id, following: true }] }).then(response => {
        this.props.fetchTopics();
      });
      newSelections.topics[id] = true;
    }
    this.setState({ selections: newSelections });
  };

  selectAll(sourceType) {
    const selections = { ...this.state.selections };
    if (sourceType === 'topics') {
      const topics = this.props.sources.sources.defaultTopics.map(topic => {
        selections.topics[topic.id] = true;
        return { id: topic.id, following: true };
      });
      safe_analytics('default', 'Following', 'Select topics', 'Select all');
      this.props.followTopics({ topics }).then(() => this.props.fetchTopics());
    }
    if (sourceType === 'federal') {
      const agencies = defaultFederalAgencies.map(agency => {
        selections.federal[agency.id] = true;
        return { id: agency.id, following: true };
      });
      safe_analytics('default', 'Following', 'Select federal source', 'Select all');
      this.props.followAgencies({ agencies }).then(() => this.props.fetchAgencies(true));
      this.setState({ showFederalWarning: false });
    }
    if (sourceType === 'state') {
      const entities = defaultStateAgencies.filter(agency => agency.id === null).map(agency => {
        selections.state[agency.jurisdiction_id] = true;
        return {
          entity_id: agency.jurisdiction_id,
          entity_type: 'jurisdictions',
          following: true
        };
      });
      safe_analytics('default', 'Following', 'Select state source', 'Select all');
      this.props
        .followEntities({ entities })
        .then(() => this.props.fetchFollowedEntities({ entity_type: 'jurisdictions' }));

      const agencies = defaultStateAgencies.filter(agency => agency.id !== null).map(agency => {
        selections.state[agency.id] = true;
        return {
          id: agency.id,
          following: true
        };
      });
      this.props.followAgencies({ agencies }).then(() => this.props.fetchAgencies(true));
    }
    if (sourceType === 'mainstream_news') {
      const entities = this.props.sources.sources.defaultMainstreamNewsSources.map(source => {
        selections.mainstream_news[source.id] = true;
        return {
          entity_id: source.id,
          entity_type: 'news_sources',
          following: true
        };
      });
      safe_analytics('default', 'Following', 'Select mainstream news source', 'Select all');
      this.props
        .followEntities({ entities })
        .then(() => this.props.fetchFollowedEntities({ entity_type: 'news_sources' }));
    }
    this.setState({ selections });
  }
  clearAll(sourceType) {
    const selections = { ...this.state.selections };
    if (sourceType === 'topics') {
      const topics = this.props.sources.sources.defaultTopics.map(topic => {
        selections.topics[topic.id] = false;
        return { id: topic.id, following: false };
      });
      safe_analytics('default', 'Following', 'Deselect topics', 'Deselect all');
      this.props.followTopics({ topics }).then(() => this.props.fetchTopics());
    }

    if (sourceType === 'state') {
      const entities = defaultStateAgencies.filter(agency => agency.id === null).map(agency => {
        selections.state[agency.jurisdiction_id] = false;
        return {
          entity_id: agency.jurisdiction_id,
          entity_type: 'jurisdictions',
          following: false
        };
      });

      const agencies = defaultStateAgencies.filter(agency => agency.id !== null).map(agency => {
        selections.state[agency.id] = false;
        return {
          id: agency.id,
          following: false
        };
      });
      this.setState({ selections });

      safe_analytics('default', 'Following', 'Deselect state source', 'Deselect all');

      this.props.followEntities({ entities }).then(() => {
        this.props.fetchFollowedEntities({ entity_type: 'jurisdictions' });
      });
      this.props.followAgencies({ agencies }).then(() => {
        this.props.fetchAgencies(true);
      });
    }

    if (sourceType === 'mainstream_news') {
      const entities = this.props.sources.sources.defaultMainstreamNewsSources.map(source => {
        selections.mainstream_news[source.id] = false;
        return {
          entity_id: source.id,
          entity_type: 'news_sources',
          following: false
        };
      });
      safe_analytics('default', 'Following', 'Deselect mainstream news source', 'Deselect all');
      this.props
        .followEntities({ entities })
        .then(() => this.props.fetchFollowedEntities({ entity_type: 'news_sources' }));
    }
  }
  handleRequestNewsSource = () => {
    this.setState({ requestNewsSourceModal: true });
  };
  handleSelectNewsSource = source => {
    const newSelections = { ...this.state.selections };
    const entity_id = source.id;
    if (this.state.selections.mainstream_news[entity_id]) {
      safe_analytics('default', 'Following', 'Deselect mainstream news source', source.name);
      this.props
        .followEntities({
          entities: [{ entity_id, entity_type: 'news_sources', following: false }]
        })
        .then(response => {
          this.props.fetchFollowedEntities({ entity_type: 'news_sources' });
        });
      delete newSelections.mainstream_news[entity_id];
    } else {
      safe_analytics('default', 'Following', 'Select mainstream news source', source.name);
      this.props
        .followEntities({
          entities: [{ entity_id, entity_type: 'news_sources', following: true }]
        })
        .then(response => {
          this.props.fetchFollowedEntities({ entity_type: 'news_sources' });
        });
      newSelections.mainstream_news[entity_id] = true;
    }
  };

  render() {
    const federalTabClass = {
      tab: true,
      selectedTab: this.state.source === 'federal'
    };
    const stateTabClass = {
      tab: true,
      selectedTab: this.state.source === 'state'
    };
    const topicsTabClass = {
      tab: true,
      selectedTab: this.state.source === 'topics'
    };
    const mainstream_newsTabClass = {
      tab: true,
      selectedTab: this.state.source === 'mainstream_news'
    };

    const popover = text => <Popover id="sourceButtonPopover">{text}</Popover>;
    const stateSourcesButtons = sources => {
      return _.sortBy(sources, state => state.state).map((source, i) => {
        const classes = {
          btn: true,
          following: this.state.selections.state[source.id || source.jurisdiction_id]
        };
        return (
          <OverlayTrigger
            trigger={['focus', 'hover']}
            placement="bottom"
            overlay={popover(source.name)}
            key={i}
          >
            <button
              onClick={() => this.handleSelectStateSource(source)}
              className={classnames(classes)}
              key={i}
            >
              {source.short_name === 'CA-DBO' ? source.short_name : source.state}
            </button>
          </OverlayTrigger>
        );
      });
    };

    const federalSourcesButtons = sources => {
      return _.sortBy(sources, source => source.short_name).map((source, i) => {
        const classes = {
          btn: true,
          following: this.state.selections.federal[source.id]
        };

        const text = (
          <div>
            <p>{source.name}</p>
            {source.short_name === 'DOJ' ||
            source.short_name === 'DOL' ||
            source.short_name === 'EBSA' ? (
              <div>High document volume; only viewable in Search Results and News.</div>
            ) : null}
          </div>
        );
        return (
          <OverlayTrigger
            trigger={['focus', 'hover']}
            placement="bottom"
            overlay={popover(text)}
            key={i}
          >
            <button
              onClick={() => this.handleSelectFederalSource(source)}
              className={classnames(classes)}
            >
              {source.short_name}
            </button>
          </OverlayTrigger>
        );
      });
    };

    const topicsButtons = () => {
      const topics = this.props.sources.sources.defaultTopics
        .filter(topic => { return topic.id !== 70; }) // XXX: temp hotfix for duplicate topic
        .map((topic) => {
          const match = defaultTopics.find(defaultTopic => {
            return defaultTopic.id === topic.id;
          });
          if (match && 'description' in match) {
            topic.description = match.description;
          }
          return topic;
        });

      const buttons = topics
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((source, i) => {
          const classes = {
            btn: true,
            following: this.state.selections.topics[source.id]
          };

          const topicButton = topicSource => {
            const button = (
              <button
                key={i}
                onClick={() => this.handleSelectTopic(topicSource)}
                className={classnames(classes)}
              >
                {topicSource.label}
              </button>
            );

            // TODO: abbreviated topics should have short descriptions
            // or full name properties coming from elasticsearch
            if (!_.isNil(source.description)) {
              return (
                <OverlayTrigger
                  trigger={['focus', 'hover']}
                  placement="bottom"
                  overlay={popover(source.description)}
                  key={i}
                >
                  {button}
                </OverlayTrigger>
              );
            }
            return button;
          };
          return topicButton(source);
        });
      return buttons;
    };
    const mainstream_newsButtons = () => {
      const buttons = this.props.sources.sources.defaultMainstreamNewsSources
        .sort((a, b) => a.name > b.name)
        .map((source, i) => {
          const classes = {
            btn: true,
            following: this.state.selections.mainstream_news[source.id]
          };

          const mainstream_newsButton = newsSource => {
            const button = (
              <button
                key={i}
                onClick={() => this.handleSelectNewsSource(newsSource)}
                className={classnames(classes)}
              >
                {this.getNewsImg(newsSource)}
                {newsSource.name}
              </button>
            );
            return button;
          };
          return mainstream_newsButton(source);
        });

      buttons.push(
        <button key={buttons.length} onClick={() => this.handleRequestNewsSource()} className="btn">
          Request a news source
        </button>
      );
      return buttons;
    };

    return (
      <div className="sourcesContainer container-fluid">
        <div className="headerContainer">
          <h2 className="header">Sources You Follow</h2>
        </div>
        <h4 className="description">
          {`Compliance.ai is tailored to show what's relevant to you.
            Change what you follow to make more content available to you throughout the app.`}
        </h4>
        <div className="tabs-feedback-btn">
          <div className="tabs">
            <span
              onClick={() =>
                this.context.router.push({ pathname: '/sources', query: { view: 'federal' } })
              }
              className={classnames(federalTabClass)}
            >
              Federal
            </span>
            <span
              onClick={() =>
                this.context.router.push({ pathname: '/sources', query: { view: 'state' } })
              }
              className={classnames(stateTabClass)}
            >
              State
            </span>
            <span
              onClick={() =>
                this.context.router.push({ pathname: '/sources', query: { view: 'topics' } })
              }
              className={classnames(topicsTabClass)}
            >
              Topics (Beta)
            </span>
            <span
              onClick={() =>
                this.context.router.push({
                  pathname: '/sources',
                  query: { view: 'mainstream_news' }
                })
              }
              className={classnames(mainstream_newsTabClass)}
            >
              Mainstream News
            </span>
          </div>
          {this.state.source === 'topics' ? <TopicFeedback /> : null}
        </div>
        {this.state.source === 'topics' ? (
          <h4>
            Topics are a combination of Expert-in-the-Loop and Machine Learning assessments of all
            new financial services content that comes into our system from July 2017 onward. Select
            relevant topics to receive a personalized weekly email update. Your selections will also
            inform topic features coming soon to the app.
          </h4>
        ) : null}
        {this.state.source === 'state' || this.state.source === 'federal' ? (
          <h4>
            Sources produce documents for Timeline, Search Results, and News, except where noted.
          </h4>
        ) : null}
        {this.state.agenciesReady &&
        this.state.source === 'federal' &&
        this.state.showFederalWarning ? (
          <div className="alert alert-danger">
            Please keep at least one federal source selected.
          </div>
        ) : null}
        <div className="all">
          <span onClick={() => this.selectAll(this.state.source)} className="click">
            Select All
          </span>

          {this.state.source === 'state' ||
          this.state.source === 'topics' ||
          this.state.source === 'mainstream_news' ? (
            <span onClick={() => this.clearAll(this.state.source)} className="click">
              {'  '} |{'  '} Clear All
            </span>
          ) : null}
        </div>
        {this.state.source === 'federal' ? federalSourcesButtons(defaultFederalAgencies) : null}
        {this.state.source === 'state' ? stateSourcesButtons(defaultStateAgencies) : null}
        {this.state.source === 'topics' ? topicsButtons() : null}
        {this.state.source === 'mainstream_news' ? mainstream_newsButtons() : null}
        {this.state.requestNewsSourceModal ? (
          <Modal
            show
            onHide={() => this.setState({ requestNewsSourceModal: false })}
            className="suggestion-box-modal"
          >
            <Feedback
              requestNewsSource
              modalClose={() => this.setState({ requestNewsSourceModal: false })}
            />
          </Modal>
        ) : null}
      </div>
    );
  }
}

Sources.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    agencies: state.agencies,
    entities: state.entities,
    topics: state.topics,
    current_view: state.current_view,
    sources: state.sources
  };
};
const ReduxSources = connect(mapStateToProps, {
  fetchAgencies,
  fetchFollowedEntities,
  followAgencies,
  followEntities,
  addContributorPoints,
  fetchTopics,
  followTopics,
  fetchDocuments
})(Sources);

export default ReduxSources;
