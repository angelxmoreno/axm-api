import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { AppConfigSchema, createConfig } from '@/utils/create-config';

// Env vars are always strings. Schema must coerce / accept strings for every
// field. This file only tests the env-driven path.
const baseEnv: Record<string, string | undefined> = {
    APP_NAME: 'axm-api',
    SENTRY_DSN: '',
    NODE_ENV: 'development',
    LOGGER_USE_PRETTY: 'true',
    LOGGER_LEVEL: 'info',
    LOGGER_LOKI_URL: 'https://logs.example.com',
};

describe('AppConfigSchema', () => {
    describe('shape transformation', () => {
        it('maps flat env keys to a nested { app, sentry, logger } object', () => {
            const result = AppConfigSchema.parse(baseEnv);
            expect(result).toEqual({
                app: {
                    name: 'axm-api',
                    nodeEnv: 'development',
                },
                sentry: {
                    dsn: undefined,
                },
                logger: {
                    usePretty: true,
                    level: 'info',
                    lokiUrl: 'https://logs.example.com',
                },
            });
        });
    });

    describe('APP_NAME', () => {
        it('passes through the value verbatim', () => {
            const result = AppConfigSchema.parse({ ...baseEnv, APP_NAME: 'my-service' });
            expect(result.app.name).toBe('my-service');
        });

        it('rejects when missing (fail-loud: app should not start without a name)', () => {
            const { APP_NAME, ...without } = baseEnv;
            expect(() => AppConfigSchema.parse(without)).toThrow(z.ZodError);
        });
    });

    describe('NODE_ENV validation', () => {
        it.each(['development', 'production', 'test'])('accepts %p', (value) => {
            const result = AppConfigSchema.parse({ ...baseEnv, NODE_ENV: value });
            expect(result.app.nodeEnv).toBe(value);
        });

        it('rejects an unknown env', () => {
            expect(() => AppConfigSchema.parse({ ...baseEnv, NODE_ENV: 'staging' })).toThrow(z.ZodError);
        });

        it('rejects when missing', () => {
            const { NODE_ENV, ...without } = baseEnv;
            expect(() => AppConfigSchema.parse(without)).toThrow(z.ZodError);
        });
    });

    describe('SENTRY_DSN validation', () => {
        it('accepts a valid URL', () => {
            const result = AppConfigSchema.parse({ ...baseEnv, SENTRY_DSN: 'https://abc@sentry.io/123' });
            expect(result.sentry.dsn).toBe('https://abc@sentry.io/123');
        });

        it('accepts the field being absent (undefined)', () => {
            const { SENTRY_DSN, ...without } = baseEnv;
            const result = AppConfigSchema.parse(without);
            expect(result.sentry.dsn).toBeUndefined();
        });

        it('treats an empty string the same as absent (line 8 contract)', () => {
            const result = AppConfigSchema.parse({ ...baseEnv, SENTRY_DSN: '' });
            expect(result.sentry.dsn).toBeUndefined();
        });

        it('rejects a non-URL string', () => {
            expect(() => AppConfigSchema.parse({ ...baseEnv, SENTRY_DSN: 'not-a-url' })).toThrow(z.ZodError);
        });
    });

    describe('LOGGER_USE_PRETTY coercion (env strings via z.stringbool)', () => {
        it.each(['true', '1', 'yes', 'on', 'y', 'enabled', 'TRUE'])('coerces %p to true', (value) => {
            const result = AppConfigSchema.parse({ ...baseEnv, LOGGER_USE_PRETTY: value });
            expect(result.logger.usePretty).toBe(true);
        });

        it.each(['false', '0', 'no', 'off', 'n', 'disabled', 'FALSE'])('coerces %p to false', (value) => {
            const result = AppConfigSchema.parse({ ...baseEnv, LOGGER_USE_PRETTY: value });
            expect(result.logger.usePretty).toBe(false);
        });

        it('rejects a string that is not in the truthy or falsy set', () => {
            expect(() => AppConfigSchema.parse({ ...baseEnv, LOGGER_USE_PRETTY: 'maybe' })).toThrow(z.ZodError);
        });
    });

    describe('LOGGER_LEVEL validation', () => {
        it('accepts each valid log level', () => {
            const levels = ['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
            for (const level of levels) {
                const result = AppConfigSchema.parse({ ...baseEnv, LOGGER_LEVEL: level });
                expect(result.logger.level).toBe(level);
            }
        });

        it('rejects an unknown level', () => {
            expect(() => AppConfigSchema.parse({ ...baseEnv, LOGGER_LEVEL: 'verbose' })).toThrow(z.ZodError);
        });
    });

    describe('LOGGER_LOKI_URL validation', () => {
        it('accepts a valid URL', () => {
            const result = AppConfigSchema.parse({ ...baseEnv, LOGGER_LOKI_URL: 'https://loki.internal:3100' });
            expect(result.logger.lokiUrl).toBe('https://loki.internal:3100');
        });

        it('accepts the field being absent (undefined)', () => {
            const { LOGGER_LOKI_URL, ...without } = baseEnv;
            const result = AppConfigSchema.parse(without);
            expect(result.logger.lokiUrl).toBeUndefined();
        });

        it('treats an empty string the same as absent (line 8 contract)', () => {
            const result = AppConfigSchema.parse({ ...baseEnv, LOGGER_LOKI_URL: '' });
            expect(result.logger.lokiUrl).toBeUndefined();
        });

        it('rejects a non-URL string', () => {
            expect(() => AppConfigSchema.parse({ ...baseEnv, LOGGER_LOKI_URL: 'not-a-url' })).toThrow(z.ZodError);
        });
    });
});

describe('createConfig()', () => {
    it('builds a config from a valid env record', () => {
        const config = createConfig(baseEnv);
        expect(config).toEqual({
            app: { name: 'axm-api', nodeEnv: 'development' },
            sentry: { dsn: undefined },
            logger: { usePretty: true, level: 'info', lokiUrl: 'https://logs.example.com' },
        });
    });

    it('throws an Error with a ZodError cause when env is invalid', () => {
        try {
            createConfig({ ...baseEnv, LOGGER_LEVEL: 'verbose' });
            throw new Error('expected createConfig to throw');
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect((e as Error).message).toBe('AppConfig: Unable to parse schema');
            // cause is the underlying ZodError
            // @ts-expect-error - cause is not in Error's type
            expect(e.cause).toBeInstanceOf(z.ZodError);
        }
    });

    it('throws when a required field is missing entirely', () => {
        expect(() => createConfig({})).toThrow('AppConfig: Unable to parse schema');
    });

    it('skips undefined values when building the record (process.env semantics)', () => {
        const env: Record<string, string | undefined> = {
            APP_NAME: 'axm-api',
            SENTRY_DSN: undefined,
            NODE_ENV: 'production',
            LOGGER_USE_PRETTY: 'true',
            LOGGER_LEVEL: 'info',
            LOGGER_LOKI_URL: undefined, // simulates env var not being set
        };
        const config = createConfig(env);
        expect(config.logger.lokiUrl).toBeUndefined();
        expect(config.sentry.dsn).toBeUndefined();
    });
});
