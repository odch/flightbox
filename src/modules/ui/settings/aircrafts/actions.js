export const CHANGE_NEW_ITEM = 'CHANGE_NEW_ITEM';

export function changeNewItem(type, item) {
  return {
    type: CHANGE_NEW_ITEM,
    payload: {
      type,
      item,
    },
  };
}
