import PropTypes from 'prop-types';
import React, {Component} from 'react';
import Content from './Content';
import MovementList from '../../containers/MovementListContainer';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';

class MovementsPage extends Component {

  componentWillMount() {
    this.props.loadLockDate();

    if (this.props.auth.data.guest === true || this.props.auth.data.kiosk === true) {
      this.props.history.push('/');
    }
  }

  render() {
    return (
      <VerticalHeaderLayout>
        <Content>
          <JumpNavigation/>
          <MovementList/>
        </Content>
      </VerticalHeaderLayout>
    );
  }
}

MovementsPage.propTypes = {
  loadLockDate: PropTypes.func.isRequired,
};

export default MovementsPage;
