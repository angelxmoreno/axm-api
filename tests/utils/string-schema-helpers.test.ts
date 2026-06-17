import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import {
    CommaListSchema,
    OptionalBooleanSchema,
    OptionalNumberSchema,
    OverridableHeaderSchema,
    parseStringBoolean,
    UrlOrUndefinedSchema,
} from '@/utils/string-schema-helpers';

describe('parseStringBoolean()', () => {
    it.each(['true', '1', 'yes', 'on', 'y', 'enabled', 'TRUE'])('coerces %p to true', (value) => {
        expect(parseStringBoolean(value)).toBe(true);
    });

    it.each(['false', '0', 'no', 'off', 'n', 'disabled', 'FALSE'])('coerces %p to false', (value) => {
        expect(parseStringBoolean(value)).toBe(false);
    });

    it('throws for an ambiguous boolean string', () => {
        expect(() => parseStringBoolean('maybe')).toThrow('Unable to parse boolean: maybe');
    });
});

describe('UrlOrUndefinedSchema', () => {
    it('accepts a valid URL string', () => {
        const result = UrlOrUndefinedSchema.parse('https://example.com');
        expect(result).toBe('https://example.com');
    });

    it('returns undefined for an empty string', () => {
        const result = UrlOrUndefinedSchema.parse('');
        expect(result).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
        const result = UrlOrUndefinedSchema.parse(undefined);
        expect(result).toBeUndefined();
    });

    it('rejects a non-URL string', () => {
        expect(() => UrlOrUndefinedSchema.parse('not-a-url')).toThrow(z.ZodError);
    });
});

describe('CommaListSchema', () => {
    it('splits a comma-separated string into an array', () => {
        const result = CommaListSchema.parse('GET,POST,PUT');
        expect(result).toEqual(['GET', 'POST', 'PUT']);
    });

    it('trims whitespace around entries', () => {
        const result = CommaListSchema.parse(' GET , POST ');
        expect(result).toEqual(['GET', 'POST']);
    });

    it('filters out empty entries', () => {
        const result = CommaListSchema.parse('GET,,POST');
        expect(result).toEqual(['GET', 'POST']);
    });

    it('returns undefined for an empty string', () => {
        const result = CommaListSchema.parse('');
        expect(result).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
        const result = CommaListSchema.parse(undefined);
        expect(result).toBeUndefined();
    });

    it('rejects a non-string value', () => {
        expect(() => CommaListSchema.parse(123)).toThrow(z.ZodError);
    });
});

describe('OverridableHeaderSchema', () => {
    it('coerces a truthy string to true', () => {
        const result = OverridableHeaderSchema.parse('true');
        expect(result).toBe(true);
    });

    it('coerces a falsy string to false', () => {
        const result = OverridableHeaderSchema.parse('false');
        expect(result).toBe(false);
    });

    it('returns the literal string when not a boolean keyword', () => {
        const result = OverridableHeaderSchema.parse('DENY');
        expect(result).toBe('DENY');
    });

    it('returns undefined for an empty string', () => {
        const result = OverridableHeaderSchema.parse('');
        expect(result).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
        const result = OverridableHeaderSchema.parse(undefined);
        expect(result).toBeUndefined();
    });

    it('rejects a non-string value', () => {
        expect(() => OverridableHeaderSchema.parse(123)).toThrow(z.ZodError);
    });
});

describe('OptionalBooleanSchema', () => {
    it.each(['true', '1', 'yes', 'on', 'y', 'enabled', 'TRUE'])('coerces %p to true', (value) => {
        const result = OptionalBooleanSchema.parse(value);
        expect(result).toBe(true);
    });

    it.each(['false', '0', 'no', 'off', 'n', 'disabled', 'FALSE'])('coerces %p to false', (value) => {
        const result = OptionalBooleanSchema.parse(value);
        expect(result).toBe(false);
    });

    it('returns undefined for an empty string', () => {
        const result = OptionalBooleanSchema.parse('');
        expect(result).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
        const result = OptionalBooleanSchema.parse(undefined);
        expect(result).toBeUndefined();
    });

    it('rejects an ambiguous boolean string', () => {
        expect(() => OptionalBooleanSchema.parse('maybe')).toThrow(Error);
    });
});

describe('OptionalNumberSchema', () => {
    it('coerces a numeric string to a number', () => {
        const result = OptionalNumberSchema.parse('86400');
        expect(result).toBe(86_400);
    });

    it('returns undefined for an empty string', () => {
        const result = OptionalNumberSchema.parse('');
        expect(result).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
        const result = OptionalNumberSchema.parse(undefined);
        expect(result).toBeUndefined();
    });

    it('rejects a non-numeric string', () => {
        expect(() => OptionalNumberSchema.parse('not-a-number')).toThrow(z.ZodError);
    });

    it('rejects a negative number string', () => {
        expect(() => OptionalNumberSchema.parse('-1')).toThrow(z.ZodError);
    });

    it('rejects a decimal number string', () => {
        expect(() => OptionalNumberSchema.parse('10.5')).toThrow(z.ZodError);
    });
});
