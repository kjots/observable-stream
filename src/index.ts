import { Readable } from 'readable-stream';
import { Observable } from 'rxjs';

import ReadableStream = NodeJS.ReadableStream;

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

function onceify(fn: (this: any, ...args: Array<any>) => any): (this: any, ...args: Array<any>) => any {
  let invoked = false;

  return function(this: any, ...args: Array<any>): any {
    if (!invoked) {
      invoked = true;

      return fn.call(this, ...args);
    }
  };
}
