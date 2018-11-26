import React from 'react';
import { Button } from 'react-bootstrap';
import TopicFeedback from './TopicFeedback';

const TopicsGuide = props => {
  const displaySourceSelection = () => {
    props.router.push({
      pathname: '/sources',
      state: {
        fromTopicsGuide: true
      }
    });
  };

  return (
    <div className="topics-guide-container">
      <div className="topics-guide-header-fdbck-container">
        <h1 className="topics-guide-header">
          Compliance.ai Topics <span>Beta</span>
        </h1>
        <TopicFeedback />
      </div>
      <p className="topics-guide-text">
        Welcome to our Topics Beta. In July, we started assigning topics to new documents using both
        Expert-in-the-Loop human judgment and Machine Learning techniques. Our list of topics and
        scope of coverage will expand over time. Check out the topics we have so far!
      </p>
      <Button className="topics-guide-following-menu-btn" onClick={displaySourceSelection}>
        Follow Topics
      </Button>

      <h3>There are three ways to experience Topics in the app:</h3>
      <div className="topics-guide-tips-row">
        <div className="topics-guide-tips-col">
          <div>
            <div className="topics-guide-tip">
              <div className="topics-guide-num">
                <span>1</span>
              </div>
              <p className="topics-guide-text">
                In Timeline, scan and filter documents by their topic labels:
              </p>
            </div>
            <div className="topics-guide-img-1" />
          </div>
          <div>
            <div className="topics-guide-tip">
              <div className="topics-guide-num">
                <span>3</span>
              </div>
              <p className="topics-guide-text">
                In the search bar, select topics that appear in the autosuggestion list to see all
                relevant documents:
              </p>
            </div>
            <div className="topics-guide-img-3" />
          </div>
        </div>
        <div>
          <div className="topics-guide-tip">
            <div className="topics-guide-num">
              <span>2</span>
            </div>
            <p className="topics-guide-text">
              In Document Details, view topic label(s) for your document:
            </p>
          </div>
          <div className="topics-guide-img-2" />
        </div>
      </div>
    </div>
  );
};

export default TopicsGuide;
