import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { fetchAgencies } from '../../shared/actions';
import _ from 'lodash';

class Agencies extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.fetchAgencies();
  }

  render() {
    if (!this.props.agencies.isReady) {
      return null;
    }

    const agencies = _.sortBy(this.props.agencies.items, 'name');

    return (
      <div className="row">
        <div className="col-md-9">
          <h1>Agencies</h1>
          <ul>
            {agencies.map(agency => {
              return (
                <li key={agency.id}>
                  <Link to={`/agencies/${agency.id}`}>
                    {agency.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    agencies: state.agencies,
    errors: state.errors
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAgencies: () => {
      dispatch(fetchAgencies());
    }
  };
};

const ReduxAgencies = connect(mapStateToProps, mapDispatchToProps)(Agencies);

export default ReduxAgencies;
