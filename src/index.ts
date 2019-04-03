import { streamObservable } from '@kjots/stream-observable';

import { Readable } from 'readable-stream';
import { merge, Observable, Subject } from 'rxjs';

import ReadableStream = NodeJS.ReadableStream;
import ReadWriteStream = NodeJS.ReadWriteStream;

export function observableStream<T>(observable: Observable<T>): ReadableStream {
  const stream = Readable({ objectMode: true });

  stream._read = onceify(() =>
    observable.subscribe(
      data => stream.push(data),
      error => stream.emit('error', error),
      () => stream.push(null)
    )
  );

  return stream;
}

export function through<T, R = T>(...transforms: Array<ReadWriteStream>): (observable: Observable<T>) => Observable<R> {
  return (observable: Observable<T>) => {
    const errorSubject = new Subject<any>();

    return merge(errorSubject, streamObservable(
      transforms.reduce((stream, transform) => stream.on('error', error => errorSubject.error(error)).pipe(transform), observableStream(observable))
    ));
  };
}

function onceify(fn: (this: any, ...args: Array<any>) => any): (this: any, ...args: Array<any>) => any {
  let invoked = false;

  return function (this: any, ...args: Array<any>): any {
    if (!invoked) {
      invoked = true;

      return fn.call(this, ...args);
    }
  };
}
