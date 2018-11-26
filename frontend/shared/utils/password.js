import _ from 'lodash';

export function safe_zxcvbn(...args) {
  if (!zxcvbn) {
    return {};
  }

  const indicator = zxcvbn(...args);

  return indicator;
}

// checks password strength at sign-up and settings page
export function getPasswordClasses(pswd) {
  const passwordIndicatorClasses = {
    'pwd-indicator': _.isEmpty(pswd),
    'weak-pwd-indicator': pswd.score < 1,
    'normal-pwd-indicator': pswd.score === 1,
    'strong-pwd-indicator': pswd.score >= 2
  };

  return passwordIndicatorClasses;
}

// checks password approval at login and sign-up
export function passwordApproved(password) {
  const pswd = safe_zxcvbn(password);
  return pswd.score <= 1;
}
