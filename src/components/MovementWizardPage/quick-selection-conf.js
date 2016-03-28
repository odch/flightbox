import AircraftList from '../AircraftList';
import UserList from '../UserList';
import AerodromeList from '../AerodromeList';
import update from 'react-addons-update';

const lists = {
  aircraft: {
    component: AircraftList,
    clickHandler: (data, item) => {
      return update(data, {
        immatriculation: { $set: item.key },
        aircraftType: { $set: item.value.type },
        mtow: { $set: item.value.mtow },
      });
    },
    step: 0,
    fields: [{
      field: 'immatriculation',
      filterProp: 'immatriculation',
      label: 'Immatrikulation',
      emptyMessage: 'Tippen Sie die ersten Buchstaben der Immatrikulation und wählen ' +
      'Sie das gewünschte Flugzeug anschliessend aus der Liste hier aus.',
    }, {
      field: 'aircraftType',
      filterProp: 'aircraftType',
      label: 'Flugzeugtyp',
      emptyMessage: 'Tippen Sie die ersten Buchstaben des Typs und wählen ' +
      'Sie das gewünschte Flugzeug anschliessend aus der Liste hier aus.',
    }],
  },
  user: {
    component: UserList,
    clickHandler: (data, item) => {
      return update(data, {
        memberNr: { $set: item.value.memberNr },
        lastname: { $set: item.value.lastname },
        firstname: { $set: item.value.firstname },
        phone: { $set: item.value.phone },
      });
    },
    step: 1,
    fields: [{
      field: 'memberNr',
      filterProp: 'memberNr',
      label: 'Mitgliedernummer',
    }],
  },
  aerodrome: {
    component: AerodromeList,
    clickHandler: (data, item) => {
      return update(data, {
        location: { $set: item.key },
      });
    },
    step: 3,
    fields: [{
      field: 'location',
      filterProp: 'aerodrome',
      label: 'Flugplatz',
    }],
  },
};

function fieldPredicate(field) {
  return (f) => {
    if (f.field === field) {
      return true;
    }
  };
}

function getVisibleListByStep(step) {
  for (const list in lists) {
    if (lists.hasOwnProperty(list) && lists[list].step === step) {
      return lists[list];
    }
  }
  return null;
}

function getVisibleListByField(field) {
  for (const list in lists) {
    if (lists.hasOwnProperty(list)) {
      const listConf = lists[list];
      const matchedField = listConf.fields.find(fieldPredicate(field));
      if (matchedField) {
        const fieldName = matchedField.field;
        const filterProp = matchedField.filterProp;
        const fieldLabel = matchedField.label;
        const emptyMessage = matchedField.emptyMessage;

        return update(listConf, {
          fieldName: { $set: fieldName },
          filterProp: { $set: filterProp },
          fieldLabel: { $set: fieldLabel },
          emptyMessage: { $set: emptyMessage },
        });
      }
    }
  }
  return null;
}

export { getVisibleListByStep, getVisibleListByField };
