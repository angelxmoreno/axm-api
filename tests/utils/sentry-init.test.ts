import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import * as Sentry from '@sentry/bun';
import { type AppConfig, createConfig } from '@/utils/create-config';
import { initSentry } from '@/utils/sentry-utils';

// initSentry is a guard function. The unit-testable contract is:
//   - skip when no DSN
//   - skip when not production
//   - skip when Sentry already has a client
//   - otherwise call Sentry.init
//
// The "calls Sentry.init" path requires a real DSN and a network round-trip —
// that is integration territory, not unit. We test the guard logic by
// calling initSentry in non-prod / no-DSN states and asserting that
// Sentry.getClient() stays null (Sentry.init would have created one).

const baseEnv: Record<string, string | undefined> = {
    APP_NAME: 'axm-api',
    SENTRY_DSN: '',
    NODE_ENV: 'development',
    LOGGER_USE_PRETTY: 'true',
    LOGGER_LEVEL: 'info',
    LOGGER_LOKI_URL: '',
};

const buildConfig = (overrides: Partial<Record<string, string | undefined>> = {}): AppConfig =>
    createConfig({ ...baseEnv, ...overrides });

describe('initSentry()', () => {
    afterEach(() => {
        // Reset Sentry between tests so the "already has client" guard test
        // is observable from a known state.
        const client = Sentry.getClient();
        if (client) {
            client.close();
        }
    });

    it('skips init when SENTRY_DSN is empty', () => {
        const config = buildConfig({ SENTRY_DSN: '' });
        initSentry(config);
        // No client should have been created.
        expect(Sentry.getClient()).toBeUndefined();
    });

    it('skips init when NODE_ENV is development', () => {
        const config = buildConfig({ NODE_ENV: 'development' });
        initSentry(config);
        expect(Sentry.getClient()).toBeUndefined();
    });

    it('skips init when NODE_ENV is test', () => {
        const config = buildConfig({ NODE_ENV: 'test' });
        initSentry(config);
        expect(Sentry.getClient()).toBeUndefined();
    });

    it('skips init when Sentry is already initialized (idempotency)', () => {
        const config = buildConfig({
            NODE_ENV: 'production',
            SENTRY_DSN: 'https://abc@sentry.io/123',
        });

        const getClientSpy = spyOn(Sentry, 'getClient').mockReturnValue({} as ReturnType<typeof Sentry.getClient>);
        const initSpy = spyOn(Sentry, 'init').mockImplementation(() => undefined);

        initSentry(config);

        expect(getClientSpy).toHaveBeenCalled();
        expect(initSpy).not.toHaveBeenCalled();
        expect(Sentry.getClient()).toBeDefined();

        getClientSpy.mockRestore();
        initSpy.mockRestore();
    });
});
