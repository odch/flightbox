export function expectDoneWithoutReturn(generator, arg) {
  const next = generator.next(arg);
  expect(next.value).toEqual(undefined);
  expect(next.done).toEqual(true);
}
