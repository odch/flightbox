import React, { PropTypes } from 'react';
import './CommitFailure.scss';
import WizardStep from '../WizardStep';
import ImageButton from '../ImageButton';

class CommitFailure extends WizardStep {

  render() {
    const backImagePath = require('./ic_arrow_back_black_48dp_2x.png');
    return (
      <div className="CommitFailure">
        <div className="msg">Die Daten konnten nicht gespeichert werden.</div>
        <div className="error-msg">{this.props.errorMsg}</div>
        <ImageButton className="back-button" label="Zurück" img={backImagePath} onClick={this.props.back}/>
      </div>
    );
  }
}

CommitFailure.propTypes = {
  back: PropTypes.func.isRequired,
  errorMsg: PropTypes.string.isRequired,
};

export default CommitFailure;
