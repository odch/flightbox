import {connect} from 'react-redux';
import LoginPage from '../components/LoginPage';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  privacyPolicyUrl: state.settings.privacyPolicyUrl.url,
});

export default connect(mapStateToProps)(LoginPage);
