import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import {
    type CreateLoggerOptions,
    CreateLoggerOptionsSchema,
    createLogger,
    LogLevelSchema,
} from '@/utils/create-logger';

describe('createLogger()', () => {
    it('returns a pino logger with the requested level', () => {
        const logger = createLogger({
            usePretty: true,
            lokiUrl: 'https://example.com',
            level: 'debug',
        });

        expect(logger.level).toBe('debug');
    });

    describe('silent level', () => {
        it('disables pino when level is silent', () => {
            const logger = createLogger({
                usePretty: false,
                lokiUrl: 'https://example.com',
                level: 'silent',
            });

            expect(logger.level).toBe('silent');
            // pino sets `silent` on the logger level string but the underlying
            // stream is muted. `silent` shows up as the level value here.
        });
    });

    describe('schema validation (defense-in-depth parse at the boundary)', () => {
        it('rejects an invalid level', () => {
            try {
                createLogger({
                    usePretty: true,
                    lokiUrl: 'https://example.com',
                    // @ts-expect-error - intentionally bad input
                    level: 'verbose',
                });
                throw new Error('expected createLogger to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('Creating Logger: Unable to parse schema');
                // @ts-expect-error - cause is not in Error's type
                expect(e.cause).toBeInstanceOf(z.ZodError);
            }
        });

        it('rejects a non-URL lokiUrl', () => {
            try {
                createLogger({
                    usePretty: true,
                    lokiUrl: 'not-a-url',
                    level: 'info',
                });
                throw new Error('expected createLogger to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('Creating Logger: Unable to parse schema');
                // @ts-expect-error - cause is not in Error's type
                expect(e.cause).toBeInstanceOf(z.ZodError);
            }
        });

        it('accepts a valid CreateLoggerOptions object end-to-end', () => {
            const options: CreateLoggerOptions = {
                usePretty: false,
                lokiUrl: 'https://logs.example.com',
                level: 'warn',
            };
            const logger = createLogger(options);
            expect(logger.level).toBe('warn');
        });
    });

    describe('schema defaults', () => {
        it('LogLevelSchema is a strict enum of pino levels', () => {
            expect(LogLevelSchema.options).toEqual(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']);
        });

        it('CreateLoggerOptionsSchema applies usePretty default of true', () => {
            const parsed = CreateLoggerOptionsSchema.parse({
                lokiUrl: 'https://example.com',
                level: 'info',
            });
            expect(parsed.usePretty).toBe(true);
        });
    });
});
