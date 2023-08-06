import {connect} from 'react-redux';
import AssociatedMovement from '../components/MovementList/AssociatedMovement'
import {loadMovement} from '../modules/movements'

const mapStateToProps = (state, ownProps) => {
  return {
    associatedMovementData:
      !ownProps.associatedMovement
        ? undefined // still loading
        : ['departure', 'arrival'].includes(ownProps.associatedMovement.type)
            ? state.movements.byKey[ownProps.associatedMovement.key]
            : null // not found
  }
}

const mapActionCreators = {
  loadMovement
}

export default connect(mapStateToProps, mapActionCreators)(AssociatedMovement)
