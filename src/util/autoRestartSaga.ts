import { call } from 'redux-saga/effects'
import { error } from './log';

export default function autoRestart(generator: (...args: any[]) => any) {
  return function* autoRestarting(...args: any[]) {
    while (true) {
      try {
        yield call(generator, ...args);
      } catch (e) {
        error(`Unhandled error in '${generator.name}'`, e);
      }
    }
  }
}
