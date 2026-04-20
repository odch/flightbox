import React, { useEffect } from 'react';
import {connect} from 'react-redux';
import {changeNewItem} from '../modules/ui/settings/aircrafts';
import {loadAircraftSettings, addAircraft, removeAircraft} from '../modules/settings/aircrafts';
import ItemList from '../components/ItemList';
import {RootState} from '../modules';

interface OwnProps {
  type: string;
}

type Props = OwnProps & {
  items: string[];
  newItem: string;
  loadAircraftSettings: () => void;
  changeNewItem: (item: string) => void;
  addItem: (item: string) => void;
  removeItem: (item: string) => void;
};

const AircraftsItemListContainer = (props: Props) => {
  useEffect(() => {
    props.loadAircraftSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ItemList
      items={props.items}
      newItem={props.newItem}
      changeNewItem={props.changeNewItem}
      addItem={props.addItem}
      removeItem={props.removeItem}
    />
  );
};

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
