export const options = [{
  key: 'open',
  label: 'Offen'
}, {
  key: 'restricted',
  label: 'Eingeschränkt'
}, {
  key: 'closed',
  label: 'Geschlossen'
}];

export const getLabel = key => options.find(option => option.key === key).label;
