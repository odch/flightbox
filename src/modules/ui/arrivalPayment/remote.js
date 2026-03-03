import firebase from '../../../util/firebase';
import {push, update as fbUpdate} from 'firebase/database';

export async function create(cardPayment) {
  return push(firebase('/card-payments'), cardPayment);
}

export async function update(id, cardPayment) {
  await fbUpdate(firebase('/card-payments/' + id), cardPayment);
}
