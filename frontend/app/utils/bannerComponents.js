import React from 'react';
import classnames from 'classnames';

export function bookmark_banner(browser) {
  let banner_txt = '';
  const bkmkClassNames = ['gif'];
  if (browser === 'ie') {
    banner_txt = "Add pro.compliance.ai to your bookmarks 'CTRL-D'";
    bkmkClassNames.push('ie');
  } else {
    banner_txt = "Add pro.compliance.ai to your bookmarks 'CTRL-D'";
    bkmkClassNames.push('chrome');
  }

  return (
    <div className="banner-alert-container">
      <div className="banner-compliance-logo" />
      <h4 className="banner-text">{banner_txt}</h4>
      <div className={classnames(bkmkClassNames)} />
    </div>
  );
}

export const dashboard_banners = [
  //order matters
  { id: 8, type: 'bookmark_compliance_ai_success' }
];
