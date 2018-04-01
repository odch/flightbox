import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { changeNewItem } from '../modules/ui/settings/aircrafts';
import { loadAircraftSettings, addAircraft, removeAircraft } from '../modules/settings/aircrafts';
import ItemList from '../components/ItemList';

class AircraftsItemListContainer extends React.Component {

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

AircraftsItemListContainer.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  newItem: PropTypes.string.isRequired,
  loadAircraftSettings: PropTypes.func.isRequired,
  changeNewItem: PropTypes.func.isRequired,
  addItem: PropTypes.func.isRequired,
  removeItem: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  return {
    items: Object.keys(state.settings.aircrafts[ownProps.type] || {}),
    newItem: state.ui.settings.aircrafts.newItem[ownProps.type] || '',
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    loadAircraftSettings: () => dispatch(loadAircraftSettings()),
    changeNewItem: item => dispatch(changeNewItem(ownProps.type, item)),
    addItem: item => dispatch(addAircraft(ownProps.type, item)),
    removeItem: item => dispatch(removeAircraft(ownProps.type, item)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AircraftsItemListContainer);
