import 'mocha';

import { of, throwError } from 'rxjs';

import { expect } from 'chai';

import { observableStream } from '.';

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
});
