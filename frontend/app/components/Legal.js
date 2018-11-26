import React from 'react';
import Terms from './TermsOfService';
import Privacy from './PrivacyPolicy';

const Legal = props => {
  return (
    <div className="legal-container">
      <div className="copyright">© Compliance.ai No claim to original U.S. Government works.</div>

      <Terms />
      <Privacy />
    </div>
  );
};

export default Legal;
