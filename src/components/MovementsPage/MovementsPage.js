import React, { Component } from 'react';
import Content from './Content';
import DepartureList from '../../containers/DepartureListContainer';
import ArrivalList from '../../containers/ArrivalListContainer';
import TabPanel from '../TabPanel';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';

class MovementsPage extends Component {

  componentWillMount() {
    this.props.loadLockDate();
  }

  render() {
    const tabs = [{
      label: 'Abflüge',
      component: <DepartureList/>,
    }, {
      label: 'Ankünfte',
      component: <ArrivalList/>,
    }];
    return (
      <VerticalHeaderLayout>
        <Content>
          <JumpNavigation/>
          <TabPanel tabs={tabs}/>
        </Content>
      </VerticalHeaderLayout>
    );
  }
}

MovementsPage.propTypes = {
  loadLockDate: React.PropTypes.func.isRequired,
};

export default MovementsPage;
