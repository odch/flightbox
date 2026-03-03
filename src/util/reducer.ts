export default function <S, A extends { type: string }>(
  initialState: S,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actionHandlers: Record<string, (state: S, action: any) => S>
) {
  return (state: S = initialState, action: A): S => {
    const handler = actionHandlers[action.type];
    if (handler) {
      return handler(state, action);
    }
    return state;
  };
}
