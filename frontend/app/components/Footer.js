import React from 'react';
import { Link } from 'react-router';

const Footer = props => {
  return (
    <div className='compliance_ai_footer'>
      <ul>
        <li>
          <Link to={'/login'}>Login</Link>
        </li>
        <li>
          <Link to={'/nonAuthSupport'}>Support</Link>
        </li>
        <li>
          <a href="https://www.compliance.ai">Website</a>
        </li>
        <li>
          <Link to={'/privacy'}>Privacy</Link>
        </li>
        <li>
          <Link to={'/terms'}>Terms of Service</Link>
        </li>
      </ul>
      <div className="copyright">© Compliance.ai No claim to original U.S. Government works.</div>
    </div>
  );
};

export default Footer;
