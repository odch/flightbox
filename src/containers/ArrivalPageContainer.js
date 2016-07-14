import { connect } from 'react-redux';

import ArrivalPage from '../components/ArrivalPage';

const mapStateToProps = (state, ownProps) => {
  return {
    auth: state.auth,
    route: ownProps.route,
  };
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalPage);
