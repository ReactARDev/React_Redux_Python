import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { Button, Modal } from 'react-bootstrap';
import { fetchMarketingCampaigns, createCampaign, updateCampaign } from '../../shared/actions';

class marketingCampaigns extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_campaign_id: null,
      selected_from_date: null,
      selected_to_date: null,
      inputEntered: false,
      displayEmptyFields: false,
      displayEditFields: false,
      displayCampaignDetails: false,
      token_confirm_open: false
    };
  }

  componentWillMount() {
    this.props.fetchMarketingCampaigns();
  }

  addCampaign() {
    this.props
      .createCampaign({
        name: this.refs.campaign_name.value,
        start_date: this.state.selected_from_date,
        end_date: this.state.selected_to_date,
        notes: this.refs.campaign_notes.value
      })
      .then(() => {
        this.props.fetchMarketingCampaigns();
        this.setState({ displayEmptyFields: false });
      });
  }

  updateCampaign(id) {
    let name = '';
    let start_date = null;
    let end_date = null;
    let notes = '';

    const campaign_id = id.toString();

    for (const data of this.refs[campaign_id].children) {
      if (!_.isEmpty(data.children) && data.children[0].className === 'update_name') {
        name = data.children[0].value;
      } else if (!_.isEmpty(data.children) && data.children[0].className === 'update_notes') {
        notes = data.children[0].value;
      }
    }

    start_date = this.state.selected_from_date;
    end_date = this.state.selected_to_date;

    this.props
      .updateCampaign(id, {
        name,
        start_date,
        end_date,
        notes
      })
      .then(() => {
        this.props.fetchMarketingCampaigns();
        //close edit fields
        for (const data of this.refs[campaign_id].children) {
          if (data.className === 'campaign-field hide') {
            data.classList.remove('hide');
          } else if (data.className === 'campaign-update-field display') {
            data.classList.remove('display');
          }
        }
      });
  }

  displayEditFields(campaign) {
    this.setState({
      selected_from_date: moment(campaign.start_date),
      selected_to_date: moment(campaign.end_date)
    });

    const campaign_id = campaign.id.toString();

    for (const data of this.refs[campaign_id].children) {
      if (data.className === 'campaign-field') {
        data.classList.add('hide');
      } else if (data.className === 'campaign-update-field') {
        data.classList.add('display');
      }
    }
  }

  hideEditFields(campaign) {
    this.setState({
      selected_from_date: null,
      selected_to_date: null
    });

    const campaign_id = campaign.id.toString();

    for (const data of this.refs[campaign_id].children) {
      if (data.className === 'campaign-field hide') {
        data.classList.remove('hide');
      } else if (data.className === 'campaign-update-field display') {
        data.classList.remove('display');
      }
    }
  }

  displayCampaignDetails(id) {
    this.props.fetchCampaignDetails(id);
    this.setState({ displayCampaignDetails: true });
  }

  render() {
    let newCampaign = null;

    const component_change_listener = (selected_date_raw, to_or_from) => {
      if (to_or_from === 'from') {
        this.setState({ selected_from_date: selected_date_raw });
      } else {
        this.setState({ selected_to_date: selected_date_raw });
      }
    };

    //Necessary blur method to auto format date input as
    //DatePicker library onChange method does not detect input value until user selects date
    const handleFromBlur = e => {
      const manually_entered_date = moment(e.target.value);
      if (!manually_entered_date.isValid()) {
        return;
      }
      component_change_listener(manually_entered_date, 'from');
    };
    //Necessary blur method to auto format date input as
    //DatePicker library onChange method does not detect input value until user selects date
    const handleToBlur = e => {
      const manually_entered_date = moment(e.target.value);
      if (!manually_entered_date.isValid()) {
        return;
      }
      component_change_listener(manually_entered_date, 'to');
    };

    const component_change_before = selected_date => {
      this.setState({ inputEntered: true });
      component_change_listener(selected_date, 'to');
    };

    const component_change_after = selected_date => {
      this.setState({ inputEntered: true });
      component_change_listener(selected_date, 'from');
    };

    if (this.state.displayEmptyFields) {
      newCampaign = (
        <tr>
          <td>
            <input
              onChange={() => this.setState({ inputEntered: true })}
              ref="campaign_name"
              placeholder="Campaign Name"
            />
          </td>
          <td>
            <div className="campaign-date-range">
              <DatePicker
                title="From"
                selected={this.state.selected_from_date}
                placeholderText="From"
                onChange={component_change_after}
                onBlur={e => handleFromBlur(e)}
                isClearable
              />
            </div>
          </td>
          <td>
            <div className="campaign-date-range">
              <DatePicker
                title="To"
                placeholderText="To"
                selected={this.state.selected_to_date}
                onChange={component_change_before}
                onBlur={e => handleToBlur(e)}
                isClearable
              />
            </div>
          </td>
          <td />
          <td />
          <td />
          <td>
            <textarea
              onChange={() => this.setState({ inputEntered: true })}
              ref="campaign_notes"
              placeholder="This campaign is gonna rock!"
            />
          </td>
          <td>
            <Button
              bsStyle="success"
              onClick={() => this.addCampaign()}
              disabled={!this.state.inputEntered}
            >
              Save Campaign
            </Button>
          </td>
        </tr>
      );
    }
    const campaigns = [];

    const open_modal = event => {
      this.setState({
        token_confirm_open: true,
        selected_campaign_id: event.target.dataset.id
      });
    };

    const close_and_update = event => {
      this.props.updateCampaign(this.state.selected_campaign_id, { token: true }).then(() => {
        this.props.fetchMarketingCampaigns();
        this.setState({ token_confirm_open: false });
      });
    };

    let modalMenu = null;

    if (this.state.token_confirm_open) {
      const selected_campaign_id = parseInt(this.state.selected_campaign_id, 10);
      const selected_campaign = _.filter(
        this.props.marketing.campaigns,
        _.matches({ id: selected_campaign_id })
      );

      modalMenu = (
        <Modal
          show={this.state.token_confirm_open}
          backdrop
          onHide={() => this.setState({ token_confirm_open: false })}
        >
          <Modal.Body>
            <div id="token-update-menu">
              <h4 className="token-update-header">
                Are you sure you would like to create a new token for
              </h4>
              <h3 className="token-update-campaign">
                {selected_campaign[0].name}?
              </h3>
              <p>Existing users of the campaign will lose access</p>
              <div className="token-update-buttons">
                <button onClick={close_and_update}>Confirm</button>
                <button onClick={() => this.setState({ token_confirm_open: false })}>Cancel</button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      );
    }

    if (!_.isEmpty(this.props.marketing.campaigns)) {
      const sorted_campaigns = _.sortBy(this.props.marketing.campaigns, 'name');
      for (const campaign of sorted_campaigns) {
        const start_date = moment(campaign.start_date).format('MM/DD/YYYY');
        const end_date = moment(campaign.end_date).format('MM/DD/YYYY');

        const token =
          process.env.APPLICATION_URL +
          '/activate?invite=1&token=' +
          encodeURIComponent(campaign.token);

        campaigns.push(
          <tr ref={campaign.id} key={campaign.id}>
            <td className="campaign-field">
              <Link to={'/users?marketing_campaign_id=' + campaign.id}>
                {campaign.name}
              </Link>
            </td>
            <td className="campaign-update-field">
              <input className="update_name" defaultValue={campaign.name} />
            </td>
            <td className="campaign-field">
              {start_date}
            </td>
            <td className="campaign-update-field">
              <DatePicker
                title="From"
                className="update_start"
                selected={this.state.selected_from_date}
                placeholderText="From"
                onChange={component_change_after}
                onBlur={e => handleFromBlur(e)}
                isClearable
              />
            </td>
            <td className="campaign-field">
              {end_date}
            </td>
            <td className="campaign-update-field">
              <DatePicker
                title="To"
                className="update_end"
                placeholderText="To"
                selected={this.state.selected_to_date}
                onChange={component_change_before}
                onBlur={e => handleToBlur(e)}
                isClearable
              />
            </td>
            <td className="campaign-creator-field">
              {campaign.created_by}
            </td>
            <td className="campaign-user-count">
              {campaign.num_users}
            </td>
            <td className="campaign-link-field">
              {token}
            </td>
            <td className="campaign-field">
              {campaign.notes}
            </td>
            <td className="campaign-update-field">
              <textarea className="update_notes" defaultValue={campaign.notes} />
            </td>
            <td className="campaign-field">
              <Button bsStyle="warning" onClick={() => this.displayEditFields(campaign)}>
                Edit
              </Button>
              <Button data-id={campaign.id} bsStyle="danger" onClick={open_modal}>
                New Token
              </Button>
            </td>
            <td className="campaign-update-field">
              <Button bsStyle="success" onClick={() => this.updateCampaign(campaign.id)}>
                Update Campaign
              </Button>
              <Button bsStyle="danger" onClick={() => this.hideEditFields(campaign)}>
                Cancel
              </Button>
            </td>
          </tr>
        );
      }
    }

    return (
      <div className="marketing-table">
        {modalMenu}
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Marketing Campaign</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Created by</th>
              <th>Number of Users</th>
              <th>Campaign User Activation Link</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {campaigns}
            {newCampaign}
          </tbody>
        </table>
        <Button
          bsStyle="primary"
          onClick={() =>
            this.setState({
              displayEmptyFields: !this.state.displayEmptyFields,
              selected_from_date: null,
              selected_to_date: null,
              inputEntered: false
            })}
        >
          Add Campaign
        </Button>
      </div>
    );
  }
}

marketingCampaigns.contextTypes = {
  router: PropTypes.object
};
const mapDispatchToProps = dispatch => {
  return {
    fetchMarketingCampaigns: () => {
      dispatch(fetchMarketingCampaigns());
    },
    createCampaign: params => {
      return dispatch(createCampaign(params));
    },
    updateCampaign: (id, params) => {
      return dispatch(updateCampaign(id, params));
    }
  };
};

const mapStateToProps = state => {
  return {
    marketing: state.marketing
  };
};

const ReduxMarketingCampaigns = connect(mapStateToProps, mapDispatchToProps)(marketingCampaigns);

export default ReduxMarketingCampaigns;
