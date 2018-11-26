import React from 'react';
import loading from '../images/loading.gif';

export default () => {
  return (
    <div className="loadingContainer">
      <div className="imageContainer">
        <img src={loading} alt="loading" />
        <div>Loading graph...</div>
      </div>
    </div>
  );
};
