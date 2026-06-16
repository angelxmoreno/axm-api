import { hostname } from 'node:os';
import * as Sentry from '@sentry/bun';
import type { AppConfig } from '@/utils/create-config';
import { pkg } from '@/utils/pkg';

/**
 * Initialize Sentry for the current process. Idempotent.
 *
 * Skipped when:
 *   - SENTRY_DSN is empty
 *   - NODE_ENV is not "production"
 *   - Sentry already has a client (covers HMR and double-mount)
 *
 * Configured for production: 10% trace sample rate, stacktrace attach,
 * release from package.json, server name from hostname.
 */
export const initSentry = (config: AppConfig): void => {
    if (!config.sentry.dsn || config.app.nodeEnv !== 'production' || Sentry.getClient()) return;

    Sentry.init({
        dsn: config.sentry.dsn,
        environment: config.app.nodeEnv,
        tracesSampleRate: 0.1,
        attachStacktrace: true,
        release: pkg.version,
        serverName: hostname(),
        initialScope: {
            tags: {
                app: config.app.name,
                runtime: 'bun',
                'bun.version': Bun.version,
            },
        },
    });
};

type MaybePromise<T = unknown> = T | Promise<T>;
type TryBlock<T = unknown> = () => MaybePromise<T>;
type CatchBlock<T = unknown> = (e: unknown) => MaybePromise<T | Error>;

/**
 * Run a tryBlock and capture any thrown error to Sentry.
 *
 * Contract on error:
 *   - No catchBlock: capture the error, return undefined.
 *   - catchBlock returns an Error: capture that Error, return undefined.
 *   - catchBlock returns anything else (a fallback value): return it
 *     silently — no Sentry capture. Use this path for known-recoverable
 *     failures where paging on-call is not desired.
 *
 * Works for sync and async tryBlocks. Non-Error throws are wrapped in
 * `new Error(String(e))` before capture.
 */
export const tryCapture = <T = unknown>(
    tryBlock: TryBlock<T>,
    catchBlock?: CatchBlock<T>
): MaybePromise<T | undefined> => {
    const handleError = async (e: unknown): Promise<T | undefined> => {
        const error = e instanceof Error ? e : new Error(String(e));

        if (catchBlock) {
            try {
                const result = await catchBlock(e);
                if (result instanceof Error) {
                    Sentry.captureException(result);
                    return undefined;
                }
                return result;
            } catch (catchError) {
                const thrownError = catchError instanceof Error ? catchError : new Error(String(catchError));
                Sentry.captureException(thrownError);
                throw thrownError;
            }
        }

        Sentry.captureException(error);
        return undefined;
    };
    try {
        const result = tryBlock();
        if (result instanceof Promise) {
            return result.catch(handleError);
        }
        return result;
    } catch (e) {
        return handleError(e);
    }
};
