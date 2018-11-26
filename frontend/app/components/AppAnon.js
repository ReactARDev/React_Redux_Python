import React from 'react';
import classNames from 'classnames';
import Footer from './Footer';
import auth from '../../shared/utils/auth.js';

// container for unauthenticated users
const AppAnon = props => {
  const container_classes = ['non-auth'];

  React.Children.forEach(props.children, component => {
    // check for classname defined as a static property
    if (component.type && component.type.className) {
      container_classes.push(component.type.className);
    }
  });

  let link_dest = '/login';

  if (auth.loggedIn()) {
    link_dest = '/dashboard';
  }
  const header = (
    <div className="compliance_ai_header">
      <a href={link_dest} />
    </div>
  );
  /*
    On route change (ie. new props) make sure to scroll to top of viewport
  */
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0; // for IE

  return (
    <div className={classNames(container_classes)} id="top">
      {header}
      <div className="main-container">{props.children}</div>
      <Footer />
    </div>
  );
};

export default AppAnon;
