import React from 'react';
import PropTypes from 'prop-types';
import auth from '../../shared/utils/auth.js';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = { errorMessage: null };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();

    const email = this.refs.email.value;
    const pass = this.refs.pass.value;

    auth.login(email, pass, true, (loggedIn, errorMessage) => {
      if (!loggedIn) {
        this.setState({ errorMessage });
        return;
      }
      const { location } = this.props;

      if (location.state && location.state.nextPathname) {
        this.context.router.replace(location.state.nextPathname);
      } else {
        this.context.router.replace('/');
      }
    });
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-4 col-md-offset-4 col-sm-6 col-sm-offset-3">
            <div className="login-container panel panel-default">
              <div className="panel-body">
                <div className="logo" />
                <form className="form-login" onSubmit={this.handleSubmit}>
                  {this.state.errorMessage &&
                    <div className="error">
                      {this.state.errorMessage}
                    </div>}
                  <div className="form-group">
                    <input
                      ref="email"
                      type="email"
                      className="form-control input-lg"
                      placeholder="Email address"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <input
                      ref="pass"
                      type="password"
                      className="form-control input-lg"
                      placeholder="Password"
                      required
                    />
                  </div>
                  <button className="btn btn-lg btn-primary btn-block" type="submit">
                    Login
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Login.contextTypes = {
  router: PropTypes.object
};

export default Login;
