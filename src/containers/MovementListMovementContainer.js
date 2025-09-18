import {connect} from 'react-redux';
import {startCustoms} from '../modules/customs'

import Movement from '../components/MovementList/Movement'

const mapStateToProps = state => {
  return {
    customs: state.customs,
    aerodromes: state.aerodromes
  };
};

const mapActionCreators = {
  onStartCustoms: startCustoms,
};

export default connect(mapStateToProps, mapActionCreators)(Movement);
