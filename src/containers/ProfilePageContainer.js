import {connect} from 'react-redux';
import {loadProfile, saveProfile} from '../modules/profile';
import ProfilePage from '../components/ProfilePage';

const mapStateToProps = state => ({
  profile: state.profile.profile,
  saving: state.profile.saving
});

const mapActionCreators = {
  loadProfile,
  saveProfile
};

export default connect(mapStateToProps, mapActionCreators)(ProfilePage);
