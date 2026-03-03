import React from 'react';
import {connect} from 'react-redux';
import {changeNewItem} from '../modules/ui/settings/aircrafts';
import {loadAircraftSettings, addAircraft, removeAircraft} from '../modules/settings/aircrafts';
import ItemList from '../components/ItemList';
import {RootState} from '../modules';

interface OwnProps {
  type: string;
}

class AircraftsItemListContainer extends React.Component<OwnProps & {
  items: string[];
  newItem: string;
  loadAircraftSettings: () => void;
  changeNewItem: (item: string) => void;
  addItem: (item: string) => void;
  removeItem: (item: string) => void;
}> {
  componentWillMount() {
    this.props.loadAircraftSettings();
  }

  render() {
    return (
      <ItemList
        items={this.props.items}
        newItem={this.props.newItem}
        changeNewItem={this.props.changeNewItem}
        addItem={this.props.addItem}
        removeItem={this.props.removeItem}
      />
    );
  }
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => ({
  items: Object.keys((state.settings.aircrafts as any)[ownProps.type] || {}),
  newItem: (state.ui.settings.aircrafts as any).newItem[ownProps.type] || '',
});

const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => ({
  loadAircraftSettings: () => dispatch(loadAircraftSettings()),
  changeNewItem: (item: string) => dispatch(changeNewItem(ownProps.type, item)),
  addItem: (item: string) => dispatch(addAircraft(ownProps.type, item)),
  removeItem: (item: string) => dispatch(removeAircraft(ownProps.type, item)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AircraftsItemListContainer);
