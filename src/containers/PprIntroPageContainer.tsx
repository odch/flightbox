import { connect } from 'react-redux';
import PprIntroPage from '../components/PprIntroPage';
import { RootState } from '../modules';
import { httpsUrl } from '../util/httpsUrl';

const mapStateToProps = (state: RootState) => ({
  privacyPolicyUrl: httpsUrl(state.settings.privacyPolicyUrl.url),
});

export default connect(mapStateToProps)(PprIntroPage);
