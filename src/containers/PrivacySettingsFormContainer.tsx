import {connect} from 'react-redux';
import {setPrivacyPolicyUrl} from '../modules/settings/privacyPolicyUrl';
import {setMovementRetentionDays} from '../modules/settings/movementRetentionDays';
import {setMessageRetentionDays} from '../modules/settings/messageRetentionDays';
import PrivacySettingsForm from '../components/PrivacySettingsForm';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  privacyPolicyUrl: state.settings.privacyPolicyUrl,
  movementRetentionDays: state.settings.movementRetentionDays,
  messageRetentionDays: state.settings.messageRetentionDays,
});

const mapActionCreators = {
  setPrivacyPolicyUrl,
  setMovementRetentionDays,
  setMessageRetentionDays,
};

export default connect(mapStateToProps, mapActionCreators)(PrivacySettingsForm);
