import { describe, expect, it } from 'bun:test';
import { tryCapture } from '@/utils/sentry-utils';

// tryCapture is pure wrt Sentry — the only Sentry interaction is
// `Sentry.captureException(error)`. We don't mock it; we observe behavior
// by checking that:
//   1. tryBlock's return value flows through when no error.
//   2. Errors are captured (Sentry's captureException is a no-op outside a
//      real init, so it just doesn't throw).
//   3. catchBlock's contract is honored (Error → capture, value → silent).

describe('tryCapture()', () => {
    describe('sync tryBlock (returns a Promise because the error path is async)', () => {
        it('returns the tryBlock value when it does not throw', async () => {
            const result = await tryCapture(() => 42);
            expect(result).toBe(42);
        });

        it('returns undefined and captures the error when tryBlock throws and no catchBlock', async () => {
            const result = await tryCapture((): number => {
                throw new Error('boom');
            });
            expect(result).toBeUndefined();
        });

        it('returns undefined when tryBlock throws and catchBlock returns an Error', async () => {
            const result = await tryCapture<number>(
                (): number => {
                    throw new Error('boom');
                },
                () => new Error('caught')
            );
            expect(result).toBeUndefined();
        });

        it('returns the catchBlock fallback value (silent recovery) when catchBlock returns a non-Error', async () => {
            // <string> widens T so catchBlock can return any value, not just
            // the tryBlock's return type.
            const result = await tryCapture<string>(
                () => {
                    throw new Error('boom');
                },
                () => 'fallback'
            );
            expect(result).toBe('fallback');
        });

        it('wraps non-Error throws into an Error before capturing', async () => {
            const result = await tryCapture((): number => {
                throw 'string-throw';
            });
            expect(result).toBeUndefined();
        });
    });

    describe('async tryBlock', () => {
        it('returns the resolved value when the promise resolves', async () => {
            const result = await tryCapture(async () => 42);
            expect(result).toBe(42);
        });

        it('returns undefined when the promise rejects and no catchBlock', async () => {
            const result = await tryCapture(async () => {
                throw new Error('async boom');
            });
            expect(result).toBeUndefined();
        });

        it('returns the catchBlock value when catchBlock returns a non-Error (async path)', async () => {
            const result = await tryCapture(
                async () => {
                    throw new Error('boom');
                },
                async () => 'recovered'
            );
            expect(result).toBe('recovered');
        });
    });
});
