export default function <S, A extends { type: string }>(
  initialState: S,
  actionHandlers: Record<string, (state: S, action: A) => S>
) {
  return (state: S = initialState, action: A): S => {
    const handler = actionHandlers[action.type];
    if (handler) {
      return handler(state, action);
    }
    return state;
  };
}
