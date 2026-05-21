import { connect } from 'react-redux';
import { loadPasskeys, registerPasskey } from '../modules/auth';
import PostLoginPasskeyPrompt from '../components/PostLoginPasskeyPrompt';
import { RootState } from '../modules';

const mapStateToProps = (state: RootState) => {
  const auth = state.auth;
  const data: any = auth && auth.data;
  const authenticated = !!(auth && auth.authenticated);
  const isRealUser = authenticated && data && data.uid && !data.guest && !data.kiosk;
  const passkeys = (auth && auth.passkeys) || [];
  const show = __CONF__.passkeysEnabled === true && isRealUser && passkeys.length === 0;

  return {
    show,
    submitting: (auth && auth.passkeyRegistration && auth.passkeyRegistration.submitting) || false,
    failure: (auth && auth.passkeyRegistration && auth.passkeyRegistration.failure) || false,
  };
};

const mapActionCreators = {
  loadPasskeys,
  registerPasskey,
};

export default connect(mapStateToProps, mapActionCreators)(PostLoginPasskeyPrompt);
