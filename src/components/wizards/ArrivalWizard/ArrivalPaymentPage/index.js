import React, {Component} from 'react'
import Finish from '../../../../containers/ArrivalFinishContainer'
import Centered from '../../../Centered'
import MaterialIcon from '../../../MaterialIcon'
import VerticalHeaderLayout from '../../../VerticalHeaderLayout'

class ArrivalPaymentPage extends Component {

  componentWillMount() {
    this.props.loadLockDate();
    this.props.loadAircraftSettings();
    if (typeof this.props.initMovement === 'function') {
      this.props.initMovement();
    } else if (this.props.match.params.key) {
      this.props.editMovement('arrival', this.props.match.params.key);
    } else {
      this.props.initNewMovement();
    }
  }

  render() {
    if (this.props.wizard.initialized !== true || this.props.lockDateLoading === true) {
      return <Centered><MaterialIcon icon="sync" rotate="left"/> Bitte warten ...</Centered>;
    }

    return (
      <VerticalHeaderLayout>
        <Finish finish={this.props.finish}/>
      </VerticalHeaderLayout>
    )
  }
}

export default ArrivalPaymentPage
