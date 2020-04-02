export function expectDoneWithoutReturn(generator, arg) {
  const next = generator.next(arg);
  expect(next.value).toEqual(undefined);
  expect(next.done).toEqual(true);
}

export function expectDoneWithReturn(generator, arg, expectedReturnValue) {
  const next = generator.next(arg);
  expect(next.value).toEqual(expectedReturnValue);
  expect(next.done).toEqual(true);
}
