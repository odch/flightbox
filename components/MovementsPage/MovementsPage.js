import React, { PropTypes, Component } from 'react';
import Firebase from 'firebase';
import MovementList from '../MovementList';
import './MovementsPage.scss';
import VerticalHeaderPage from '../VerticalHeaderPage';

class MovementsPage extends Component {

  movements = [];

  static propTypes = {
    onEdit: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      movements: [],
    };
    this.firebaseRef = new Firebase('https://mfgt-flights.firebaseio.com/departures/');
    const me = this;
    this.firebaseRef.orderByKey().on('child_added', function(dataSnapshot) {
      const movement = dataSnapshot.val();
      movement.key = dataSnapshot.key();
      me.movements.push(movement);
      me.setState({
        movements: me.movements,
      });
    });
  }

  render() {
    const movementList = <MovementList items={this.state.movements} onClick={this.listClick.bind(this)}/>;
    return (
      <VerticalHeaderPage className="MovementsPage" component={movementList}/>
    );
  }

  listClick(item) {
    this.props.onEdit(item);
  }
}

export default MovementsPage;
