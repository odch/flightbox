import {connect} from 'react-redux';
import {
  addCustomsSelfDeclarationEmail,
  removeCustomsSelfDeclarationEmail,
} from '../modules/settings/customsSelfDeclaration';
import CustomsSelfDeclarationEmailList from '../components/CustomsSelfDeclarationEmailList';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  emails: state.settings.customsSelfDeclaration.emails,
  loaded: state.settings.customsSelfDeclaration.loaded,
  saveFailed: state.settings.customsSelfDeclaration.saveFailed,
});

const mapActionCreators = {
  addEmail: addCustomsSelfDeclarationEmail,
  removeEmail: removeCustomsSelfDeclarationEmail,
};

export default connect(mapStateToProps, mapActionCreators)(CustomsSelfDeclarationEmailList);
