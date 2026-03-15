import firebase from '../../../util/firebase';
import {push, update as fbUpdate} from 'firebase/database';

export async function create(cardPayment: unknown) {
  return push(firebase('/card-payments'), cardPayment as any);
}

export async function update(id: string, cardPayment: unknown) {
  await fbUpdate(firebase('/card-payments/' + id), cardPayment as any);
}
