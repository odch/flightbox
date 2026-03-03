import {call, put} from 'redux-saga/effects';
import createChannel, {monitor} from './createChannel';

describe('util', () => {
  describe('createChannel', () => {
    describe('put and take', () => {
      it('delivers message immediately when resolver is waiting', async () => {
        const channel = createChannel();
        const takePromise = channel.take();
        channel.put({type: 'TEST'});
        const msg = await takePromise;
        expect(msg).toEqual({type: 'TEST'});
      });

      it('queues message when no resolver is waiting and delivers on take', async () => {
        const channel = createChannel();
        channel.put({type: 'QUEUED'});
        const msg = await channel.take();
        expect(msg).toEqual({type: 'QUEUED'});
      });

      it('returns a Promise from take when no messages queued', () => {
        const channel = createChannel();
        const result = channel.take();
        expect(result).toBeInstanceOf(Promise);
      });

      it('delivers messages in FIFO order', async () => {
        const channel = createChannel();
        channel.put({type: 'FIRST'});
        channel.put({type: 'SECOND'});
        const first = await channel.take();
        const second = await channel.take();
        expect(first).toEqual({type: 'FIRST'});
        expect(second).toEqual({type: 'SECOND'});
      });

      it('delivers to oldest waiting resolver first', async () => {
        const channel = createChannel();
        const results: any[] = [];
        const p1 = channel.take().then(msg => results.push(msg));
        const p2 = channel.take().then(msg => results.push(msg));
        channel.put({type: 'A'} as any);
        channel.put({type: 'B'} as any);
        await Promise.all([p1, p2]);
        expect(results[0]).toEqual({type: 'A'});
        expect(results[1]).toEqual({type: 'B'});
      });
    });

    describe('monitor generator', () => {
      it('yields call to channel.take and then put', () => {
        const channel = createChannel();
        const gen = monitor(channel);

        const callEffect = gen.next().value;
        expect(callEffect).toEqual(call(channel.take));

        const putEffect = gen.next({type: 'ACTION'}).value;
        expect(putEffect).toEqual(put({type: 'ACTION'}));
      });
    });
  });
});
