import React, { PropTypes, Component } from 'react';
import Firebase from 'firebase';
import MovementList from '../MovementList';
import './MovementsPage.scss';
import VerticalHeaderPage from '../VerticalHeaderPage';

class MovementsPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      movements: [],
    };
    this.firebaseRef = new Firebase('https://mfgt-flights.firebaseio.com/departures/');
    this.firebaseRef.orderByKey().on('child_added', function(dataSnapshot) {
      const movement = dataSnapshot.val();
      movement.key = dataSnapshot.key();
      this.setState({movements: this.state.movements.concat([movement])});
    }.bind(this));
  }

  render() {
    const movementList = <MovementList items={this.state.movements} onClick={this.listClick.bind(this)}/>;
    return (
      <VerticalHeaderPage className="MovementsPage" component={movementList}/>
    );
  }

  listClick(item) {
    window.location.hash = '/departure/' + item.key;
  }
}

export default MovementsPage;
