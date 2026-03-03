import {connect} from 'react-redux';
import AssociatedMovement from '../components/MovementList/AssociatedMovement';
import {loadMovement} from '../modules/movements';
import {RootState} from '../modules';

interface OwnProps {
  associatedMovement?: { type: string; key: string } | null;
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => ({
  associatedMovementData:
    !ownProps.associatedMovement
      ? undefined
      : ['departure', 'arrival'].includes(ownProps.associatedMovement.type)
          ? state.movements.byKey[ownProps.associatedMovement.key]
          : null,
});

const mapActionCreators = {
  loadMovement,
};

export default connect(mapStateToProps, mapActionCreators)(AssociatedMovement);
