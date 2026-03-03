export const CHANGE_NEW_ITEM = 'CHANGE_NEW_ITEM' as const;

export type UiSettingsAircraftsAction =
  | { type: typeof CHANGE_NEW_ITEM; payload: { type: string; item: string } };

export function changeNewItem(type: string, item: string) {
  return {
    type: CHANGE_NEW_ITEM,
    payload: {
      type,
      item,
    },
  };
}
