/* eslint-disable react/jsx-closing-bracket-location max-len react/jsx-closing-tag-location */
// ^ disable some things for the converted html
import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { defaultFederalAgencies, defaultStateAgencies } from '../../shared/utils/defaultSources';

class Support extends React.Component {
  constructor(props) {
    super(props);
  }

  // attach a listener to each question to show the nearby answer text
  setupHandlers(elem) {
    if (!elem) {
      return;
    }

    const headers = elem.querySelectorAll('.support-question');

    for (const header of headers) {
      header.addEventListener('click', e => {
        e.target.nextElementSibling.classList.toggle('show');
      });
    }
  }

  renderSources() {
    const renderSource = source => {
      let name = source.name;

      if (source.short_name) {
        name = `${source.name} (${source.short_name})`;
      }

      return (
        <li>
          {name}
        </li>
      );
    };
    const federal_sources = _.sortBy(defaultFederalAgencies, 'name').map(renderSource);
    const state_sources = _.sortBy(defaultStateAgencies, 'name').map(renderSource);
    return (
      <div>
        <p>Federal Sources</p>
        <ul>
          {federal_sources}
        </ul>
        <br />
        <p>State Sources</p>
        <ul>
          {state_sources}
        </ul>
      </div>
    );
  }

  render() {
    return (
      <div className="support-container">
        <div className="support-page-container" ref={this.setupHandlers}>
          <h1 className="support-top-header">Support</h1>
          <h4 className="support-header">Using the Product</h4>

          <ul className="support-question-contianer">
            <li className="support-question">
              <p>Who do I talk to if something isn't working?</p>

              <ul className="support-answer">
                <li>
                  <p>
                    We want to ensure you're having a great experience with Compliance.ai! There are
                    several ways you can contact us if something isn't working:
                  </p>

                  <ul>
                    <li>
                      <p>
                        Send an email to{' '}
                        <a href="mailto:support@compliance.ai">support@compliance.ai</a>
                        . We'll get back to you in less than 4 hours from 8am to 8pm, Monday through
                        Friday.
                      </p>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li className="support-question">
              <p>How do I invite a co-worker?</p>

              <ul className="support-answer">
                <li>
                  <p>
                    Send us their email through the suggestion box above, or email it directly at
                    &nbsp;
                    <a href="mailto:support@compliance.ai">support@compliance.ai</a> be sure to note
                    in your message that the co-worker would like to be invited and we will email
                    them an invitation to use Compliance.ai
                  </p>
                </li>

                <li>
                  <p>
                    In an upcoming release, you'll be able to submit their email directly through
                    Compliance.ai online, and it will send them an invitation email automatically.
                  </p>
                </li>
              </ul>
            </li>

            <li className="support-question">
              <p>How do I submit a bug?</p>

              <ul className="support-answer">
                <li>
                  We love feedback, and are eager to quickly resolve any problems you are having.
                  Send us an email through the suggestion box above or email us any bugs directly
                  with information on the problem to{' '}
                  <a href="mailto:support@compliance.ai">support@compliance.ai</a>. We'll review the
                  information, and incorporate any fixes required into our product roadmap for a
                  future release.
                </li>
              </ul>
            </li>
          </ul>

          <h4 className="support-header">Subscriptions</h4>

          <ul className="support-question-contianer">
            <li className="support-question">
              <p>How do I manage my subscription?</p>
              <ul className="support-answer">
                <li>
                  <p>
                    You can buy a monthly or annual subscription through the Account menu. At
                    checkout, you will see options to pay with a credit card via Stripe or to
                    request an invoice. If you request an invoice, we will contact you via your
                    login email address to create and send your invoice.
                  </p>
                </li>

                <li>
                  <p>
                    If you would like to cancel your Compliance.ai subscription, please contact us
                    at <a href="mailto:billing@compliance.ai">billing@compliance.ai</a>.
                  </p>
                </li>
              </ul>
            </li>

            <li className="support-question">
              <p>How do I request a refund?</p>
              <ul className="support-answer">
                <li>
                  <p>
                    If you would like to request a refund for your cancelled subscription, please
                    contact us at <a href="mailto:billing@compliance.ai">billing@compliance.ai</a>.
                  </p>
                </li>
                <li>
                  <p>
                    We will provide a full refund for cancellation requests received within 24 hours
                    of subscription purchase.
                  </p>
                </li>
                <li>
                  <p>
                    The minimum charge for subscriptions cancelled after 24 hours of subscription
                    purchase is one month of service.
                  </p>
                </li>
                <li>
                  <p>
                    For monthly subscriptions, we will cancel all future recurring monthly charges
                    with no refund.
                  </p>
                </li>
                <li>
                  <p>
                    For annual subscriptions, we will pro-rate your refund based on the number of
                    unused full months left in your subscription. For example, if you cancel during
                    your seventh month, we will refund you five months of service at the annual
                    monthly rate.
                  </p>
                </li>
              </ul>
            </li>
          </ul>

          <h4 className="support-header">Sources</h4>

          <ul className="support-question-contianer">
            <li className="support-question">
              <p>How do I know Compliance.ai sources are up-to-date?</p>

              <ul className="support-answer">
                <li>
                  <p>
                    Compliance.ai updates source data daily - we add thousands of documents every
                    weekday.
                  </p>
                </li>

                <li>
                  <p>
                    For all our documents, there are links to the document's agency website, which
                    you can use to verify accuracy and date information at any time.
                  </p>

                  <ul>
                    <li>
                      <p>
                        To access that information, select the document you're interested in, by
                        either clicking on its row, or selecting its checkbox.
                      </p>
                    </li>

                    <li>
                      <p>
                        On the right side of your screen, you will see its document summary panel.
                      </p>
                    </li>

                    <li>
                      <p>
                        Below the document title, there is a button which says "View PDF;" if you
                        click the arrow to the right of that button, you will have the option to
                        view that PDF on the agency website instead (or as well).
                      </p>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li className="support-question">
              <p>How do I know which sources I can find on Compliance.ai?</p>
              <ul className="support-answer">
                {this.renderSources()}

                <li>
                  <p>
                    The latest updated source/agency list can be viewed - and updated with your
                    latest preferences - in the Sources Menu.
                  </p>
                </li>
              </ul>
            </li>

            <li className="support-question">
              <p>How can I request new sources?</p>

              <ul className="support-answer">
                <li>
                  <p>We'd love your input on sources you'd like to see added to Compliance.ai.</p>
                </li>

                <li>
                  <p>
                    Please select the suggestion box icon above, or send a suggestion email to{' '}
                    <a href="mailto:support@compliance.ai">support@compliance.ai</a> .
                  </p>
                </li>
              </ul>
            </li>

            <li className="support-question">
              <p>Legal</p>

              <ul className="support-answer">
                <li>
                  <p>Federal Register Content</p>

                  <ul>
                    <li>
                      <p>
                        The content posted on this site, taken from the Federal Register (
                        <a href="http://federalregister.gov/">Federalregister.gov</a>
                        ), is not an official, legal edition of the daily Federal Register; it does
                        not replace the official print or electronic versions of the daily Federal
                        Register. Each document posted on the site includes a link to the
                        corresponding official Federal Register PDF file on &nbsp;
                        <a href="http://fdsys.gov/">
                          FDsys.gov
                        </a>
                      </p>
                    </li>

                    <li>
                      <p>
                        While every effort has been made to ensure that the material on
                        Compliance.ai is accurately displayed, consistent with the official PDF
                        version on FDsys.gov, those relying on it for legal research should verify
                        their results against an official edition of the Federal Register.
                      </p>
                    </li>
                  </ul>
                </li>

                <li>
                  <p>Agency Website Content</p>

                  <ul>
                    <li>
                      <p>
                        The content posted on this site, taken from U.S. Government agency websites,
                        is not an official, legal edition of the content on that site; it does not
                        replace the official print or electronic versions of the content on a U.S.
                        Government agency website. Each document posted on the site includes a link
                        to the corresponding official web page and/or PDF file of the agency.
                      </p>
                    </li>

                    <li>
                      <p>
                        While every effort has been made to ensure that the material on
                        Compliance.ai is accurately displayed, consistent with the official agency
                        web page and/or PDF version, those relying on it for legal research should
                        verify their results against an official agency publication.
                      </p>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>

          <h4 className="support-header">Troubleshooting</h4>

          <ul className="support-question-contianer">
            <li className="support-question">
              <p>What if my Compliance.ai data isn't loading?</p>

              <ul className="support-answer">
                <li>
                  <p>
                    There are a couple approaches that could solve this problem, depending on your
                    network situation.
                  </p>

                  <ul>
                    <li>
                      <p>
                        If the data on your dashboard or search results page isn't loading, manually
                        refreshing the Compliance.ai web page should be your first approach, to see
                        if that resolves the issue. Use your browser's refresh button, or hit
                        CTRL-F5.
                      </p>
                    </li>

                    <li>
                      <p>
                        If those views aren't loading after refresh, verify you have network access
                        (checking cables, verifying that access to another website is working,
                        etc.). You may have a local IT issue to resolve with your network.
                      </p>
                    </li>

                    <li>
                      <p>
                        If your network access is fine, but Compliance.ai won't load the dashboard,
                        please send an email to{' '}
                        <a href="mailto:support@compliance.ai">support@compliance.ai</a> to let us
                        know of the issue. We will get back to you within an hour Monday through
                        Friday, 8am to 8pm Pacific Time.
                      </p>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li className="support-question">
              <p>What are the requirements for Compliance.ai to run on my machine?</p>

              <ul className="support-answer">
                <li>
                  <p>
                    We aim to ensure Compliance.ai works on a whole host of Operating Systems and
                    Browsers.
                  </p>
                </li>

                <li>
                  <p>The minimum machine requirements at this time are:</p>

                  <ul>
                    <li>
                      <p>Operating Systems:</p>

                      <ul>
                        <li>
                          <p>Windows 7+</p>
                        </li>

                        <li>
                          <p>Mac OS X</p>
                        </li>
                      </ul>
                    </li>

                    <li>
                      <p>Browsers:</p>

                      <ul>
                        <li>
                          <p>Internet Explorer 11</p>
                        </li>

                        <li>
                          <p>Safari iOS 9</p>
                        </li>

                        <li>
                          <p>Chrome iOS 9.0+</p>
                        </li>

                        <li>
                          <p>Chrome on Android 4.4+</p>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

// classname to apply to top level container
Support.className = 'support';

Support.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_view: state.current_view
  };
};

const ReduxSupport = connect(mapStateToProps)(Support);

export default ReduxSupport;
