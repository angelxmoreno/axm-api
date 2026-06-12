import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { safeZodParser } from '@/utils/safe-zod-parser';

describe('safeZodParser()', () => {
    const schema = z.object({ name: z.string(), age: z.number() });

    describe('happy path', () => {
        it('returns the parsed value when input is valid', () => {
            const result = safeZodParser({ name: 'alice', age: 30 }, schema, 'Test');
            expect(result).toEqual({ name: 'alice', age: 30 });
        });

        it('preserves schema transformations (output type may differ from input)', () => {
            const numberString = z.string().transform((s) => Number(s));
            const result = safeZodParser('42', numberString, 'Test');
            expect(result).toBe(42);
        });
    });

    describe('error wrapping', () => {
        it('throws an Error (not a ZodError) when input is invalid', () => {
            try {
                safeZodParser({ name: 123, age: 'not-a-number' }, schema, 'Test');
                throw new Error('expected safeZodParser to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect(e).not.toBeInstanceOf(z.ZodError);
            }
        });

        it('wraps the ZodError as the cause so callers can inspect the original', () => {
            try {
                safeZodParser({ name: 123 }, schema, 'Test');
                throw new Error('expected safeZodParser to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe('Test: Unable to parse schema');
                // @ts-expect-error - cause is not in Error's type
                expect(e.cause).toBeInstanceOf(z.ZodError);
            }
        });

        it('interpolates the action label into the error message', () => {
            expect(() => safeZodParser({}, schema, 'Creating Widget')).toThrow(
                'Creating Widget: Unable to parse schema'
            );
        });

        it('preserves multiple field errors in the ZodError cause', () => {
            try {
                safeZodParser({}, schema, 'Test');
                throw new Error('expected safeZodParser to throw');
            } catch (e) {
                // @ts-expect-error - cause is not in Error's type
                const issues = (e.cause as z.ZodError).issues;
                expect(issues.length).toBe(2);
            }
        });
    });

    describe('type narrowing', () => {
        it('returns the inferred output type (ZodType<T> with T as the output)', () => {
            const numberSchema = z.string().transform((s) => Number(s));
            // The return is typed as string (ZodType<T> in safeZodParser is the output type).
            // We test the runtime: input '5' becomes 5 at runtime via the transform.
            const result = safeZodParser('5', numberSchema, 'Test');
            // After transform, the value is a number, not a string. The .parse returns whatever
            // the schema produces — which is what ZodType<T> represents when T is the output.
            // This is a runtime sanity check, not a type-level claim.
            expect(typeof result).toBe('number');
            expect(result).toBe(5);
        });
    });
});
