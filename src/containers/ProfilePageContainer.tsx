import {connect} from 'react-redux';
import {loadProfile, saveProfile, addAircraft, updateAircraft, removeAircraft} from '../modules/profile';
import ProfilePage from '../components/ProfilePage';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  profile: state.profile.profile,
  saving: state.profile.saving,
});

const mapActionCreators = {
  loadProfile,
  saveProfile,
  addAircraft,
  updateAircraft,
  removeAircraft,
};

export default connect(mapStateToProps, mapActionCreators)(ProfilePage);
