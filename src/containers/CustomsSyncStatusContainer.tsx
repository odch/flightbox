import {connect} from 'react-redux';
import CustomsSyncStatus from '../components/CustomsSyncStatus';
import {CustomsSyncStatusKey} from '../modules/settings/customsSyncStatus';
import {RootState} from '../modules';

interface OwnProps {
  statusKey: CustomsSyncStatusKey;
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => ({
  status: state.settings.customsSyncStatus.statuses[ownProps.statusKey],
});

export default connect(mapStateToProps)(CustomsSyncStatus);
