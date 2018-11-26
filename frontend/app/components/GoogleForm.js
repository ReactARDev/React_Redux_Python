import React from 'react';
import { Modal } from 'react-bootstrap';

// // TODO: this Component will probably be used for contributors going to google form.
export default class GoogleForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillReceiveProps(nextProps) {}

  render() {
    return (
      <div>
        <Modal show>
          sdfsdf
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSd32VtF_gg5lEgwoRkPjZaJ7a9JCPvnniuw-uISc5mE8cJVWw/viewform?embedded=true"
            width="760"
            height="900"
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
          />
        </Modal>
      </div>
    );
  }
}
