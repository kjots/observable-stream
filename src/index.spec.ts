import 'mocha';

import through2 from 'through2';

import { of, throwError } from 'rxjs';

import { expect } from 'chai';

import { observableStream, through } from '.';

context('@kjots/observable-stream', () => {
  describe('observableStream()', () => {
    it('should create a readable object stream from the provided observable', async () => {
      // Given
      const testObservable = of('Test Value 1', 'Test Value 2', 'Test Value 3');

      // When
      const results: Array<string> = [];

      await observableStream(testObservable)
        .on('data', data => results.push(data));

      // Then
      expect(results).to.eql([ 'Test Value 1', 'Test Value 2', 'Test Value 3' ]);
    });

    context('when the provided observable emits an error', () => {
      it('should cause the returned stream to emit an error', async () => {
        // Given
        const testError = new Error('Test Error');
        const testObservable = throwError(testError);

        // When
        let error;

        await observableStream(testObservable)
          .on('error', e => error = e)
          .on('data', () => {});

        // Then
        expect(error).to.equal(testError);
      });
    });
  });

  describe('through()', () => {
    it('should pipe the provided observable through the provided transforms', async () => {
      // Given
      const testObservable = of('Test Value 1', 'Test Value 2', 'Test Value 3');

      const testTransform = (x: string) => through2.obj((value, enc, cb) => cb(null, `${ value }.${ x }`));

      // When
      const results: Array<string> = [];

      await testObservable
        .pipe(
          through<string>(
            testTransform('A'),
            testTransform('B'),
            testTransform('C')
          )
        )
        .subscribe(value => results.push(value));

      // Then
      expect(results).to.eql([ 'Test Value 1.A.B.C', 'Test Value 2.A.B.C', 'Test Value 3.A.B.C' ]);
    });

    context('when the provided observable emits an error', () => {
      it('should cause the returned observable to emit an error', async () => {
        // Given
        const testError = new Error('Test Error');
        const testObservable = throwError(testError);

        const testTransform = (x: string) => through2.obj((value, enc, cb) => cb(null, `${ value }.${ x }`));

        // When
        let error;

        await testObservable
          .pipe(
            through<string>(
              testTransform('A'),
              testTransform('B'),
              testTransform('C')
            )
          )
          .subscribe({ error: e => error = e });

        // Then
        expect(error).to.equal(testError);
      });
    });

    context('when a provided transform emits an error', () => {
      it('should cause the returned observable to emit an error', async () => {
        // Given
        const testError = new Error('Test Error');
        const testObservable = of('Test Value 1', 'Test Value 2', 'Test Value 3');

        const testTransform = (x: string) => through2.obj((value, enc, cb) => x === 'B' ? cb(testError) : cb(null, `${ value }.${ x }`));

        // When
        let error: any;

        await testObservable
          .pipe(
            through<string>(
              testTransform('A'),
              testTransform('B'),
              testTransform('C')
            )
          )
          .subscribe({ error: e => error = e });

        // Then
        expect(error).to.equal(testError);
      });
    });
  });
});
