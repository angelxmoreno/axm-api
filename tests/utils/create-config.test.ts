import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { AppConfigSchema, createConfig } from '@/utils/create-config';

// Env vars are always strings. Schema must coerce / accept strings for every
// field. This file only tests the env-driven path — there is no overrides
// argument any more.
const baseEnv: Record<string, string | undefined> = {
    LOGGER_USE_PRETTY: 'true',
    LOGGER_LEVEL: 'info',
    LOGGER_LOKI_URL: 'https://logs.example.com',
};

describe('AppConfigSchema', () => {
    describe('shape transformation', () => {
        it('maps flat LOGGER_* env keys to a nested logger object', () => {
            const result = AppConfigSchema.parse(baseEnv);
            expect(result).toEqual({
                logger: {
                    usePretty: true,
                    level: 'info',
                    lokiUrl: 'https://logs.example.com',
                },
            });
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
            const env: Record<string, string | undefined> = {
                LOGGER_USE_PRETTY: 'true',
                LOGGER_LEVEL: 'info',
            };
            const result = AppConfigSchema.parse(env);
            expect(result.logger.lokiUrl).toBeUndefined();
        });

        it('treats an empty string the same as absent (line 8 contract)', () => {
            const env: Record<string, string | undefined> = {
                LOGGER_USE_PRETTY: 'true',
                LOGGER_LEVEL: 'info',
                LOGGER_LOKI_URL: '',
            };
            const result = AppConfigSchema.parse(env);
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
            logger: {
                usePretty: true,
                level: 'info',
                lokiUrl: 'https://logs.example.com',
            },
        });
    });

    it('throws an Error with a ZodError cause when env is invalid', () => {
        try {
            createConfig({ LOGGER_LEVEL: 'verbose' });
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
            LOGGER_USE_PRETTY: 'true',
            LOGGER_LEVEL: 'info',
            LOGGER_LOKI_URL: undefined, // simulates env var not being set
        };
        const config = createConfig(env);
        expect(config.logger.lokiUrl).toBeUndefined();
    });
});
