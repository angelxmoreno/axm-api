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
        const invalidCases: { name: string; input: CreateLoggerOptions }[] = [
            {
                name: 'an invalid level',
                input: {
                    usePretty: true,
                    lokiUrl: 'https://example.com',
                    // @ts-expect-error - intentionally bad input
                    level: 'verbose',
                },
            },
            {
                name: 'a non-URL lokiUrl',
                input: {
                    usePretty: true,
                    lokiUrl: 'not-a-url',
                    level: 'info',
                },
            },
        ];

        it.each(invalidCases)('rejects $name and wraps the ZodError as cause', (testCase) => {
            try {
                createLogger(testCase.input);
                throw new Error('expected createLogger to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('Creating Logger: Unable to parse schema');
                expect((e as Error).cause).toBeInstanceOf(z.ZodError);
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
