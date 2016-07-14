import { connect } from 'react-redux';

import DeparturePage from '../components/DeparturePage';

const mapStateToProps = (state, ownProps) => {
  return {
    auth: state.auth,
    route: ownProps.route,
  };
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(DeparturePage);
