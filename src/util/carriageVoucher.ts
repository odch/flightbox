export const ITEMS = [
  {
    label: 'Ja',
    value: 'yes',
  }, {
    label: 'Nein',
    value: 'no',
  },
];

const findByValue = (array, value) => {
  const obj = array.find(item => item.value === value);
  if (!obj) {
    throw new Error('Item "' + value + '" not found');
  }
  return obj;
};

export const getItemLabel = value => findByValue(ITEMS, value).label;
