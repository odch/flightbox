import {connect} from 'react-redux';
import {
  addCustomsSelfDeclarant,
  removeCustomsSelfDeclarant,
  addCustomsSelfDeclarantAircraft,
  removeCustomsSelfDeclarantAircraft,
} from '../modules/settings/customsSelfDeclaration';
import CustomsSelfDeclarationEmailList from '../components/CustomsSelfDeclarationEmailList';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  selfDeclarants: state.settings.customsSelfDeclaration.selfDeclarants,
  loaded: state.settings.customsSelfDeclaration.loaded,
  saveFailed: state.settings.customsSelfDeclaration.saveFailed,
});

const mapActionCreators = {
  addSelfDeclarant: addCustomsSelfDeclarant,
  removeSelfDeclarant: removeCustomsSelfDeclarant,
  addAircraft: addCustomsSelfDeclarantAircraft,
  removeAircraft: removeCustomsSelfDeclarantAircraft,
};

export default connect(mapStateToProps, mapActionCreators)(CustomsSelfDeclarationEmailList);
