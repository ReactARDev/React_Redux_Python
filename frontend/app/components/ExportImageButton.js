import React from 'react';
import { connect } from 'react-redux';
import { addError } from '../../shared/actions';
import { convert_node_to_image } from '../utils/export';

const ExportImageButton = props => {
  const doExport = () => {
    const elem = props.getElem();

    if (!elem) {
      return;
    }

    convert_node_to_image(elem, props.filename).catch(err => {
      props.addError(err, 'insights');
    });
  };

  return (
    <i
      className="material-icons export-invisible export-button"
      onClick={doExport}
      title="Download as PNG"
    >
      file_download
    </i>
  );
};

const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {
    addError: (error, component) => {
      dispatch(addError(error, component));
    }
  };
};

const ReduxExportImageButton = connect(mapStateToProps, mapDispatchToProps)(ExportImageButton);

export default ReduxExportImageButton;
