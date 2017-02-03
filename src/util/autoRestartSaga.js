import { call } from 'redux-saga/effects'
import { error } from './log';

export default function autoRestart(generator) {
  return function* autoRestarting(...args) {
    while (true) {
      try {
        yield call(generator, ...args);
      } catch (e) {
        error(`Unhandled error in '${generator.name}'`, e);
      }
    }
  }
}
