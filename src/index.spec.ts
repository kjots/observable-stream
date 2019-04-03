import 'mocha';

import through2 from 'through2';
import util from 'util';

import { EMPTY, of, throwError } from 'rxjs';

import { expect } from 'chai';

import { observableStream, through } from '.';

const timeout = util.promisify(setTimeout);

context('@kjots/observable-stream', () => {
  describe('observableStream()', () => {
    context('when the provided observable emits a value', () => {
      it('should cause the returned stream to emit the value', async () => {
        // Given
        const testObservable = of('Test Value');

        // When
        let result; observableStream(testObservable).on('data', value => result = value);

        await timeout(0);

        // Then
        expect(result).to.equal('Test Value');
      });
    });

    context('when the provided observable emits an error', () => {
      it('should cause the returned stream to emit the error', async () => {
        // Given
        const testError = new Error('Test Error');
        const testObservable = throwError(testError);

        // When
        let result; observableStream(testObservable).on('error', value => result = value).resume();

        await timeout(0);

        // Then
        expect(result).to.equal(testError);
      });
    });

    context('when the provided observable completes', () => {
      it('should cause the returned stream to end', async () => {
        // Given
        const testObservable = EMPTY;

        // When
        let ended = false; observableStream(testObservable).on('end', () => ended = true).resume();

        await timeout(0);

        // Then
        expect(ended).to.equal(true);
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
