import { z } from 'zod';

export const UrlOrUndefinedSchema = z
    .union([z.url(), z.literal('').transform(() => undefined)])
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const CommaListSchema = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined || v === '') return undefined;
        return v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    });

export const OptionalBooleanSchema = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined || v === '') return undefined;
        const truthy = ['true', '1', 'yes', 'on', 'y', 'enabled'];
        const falsy = ['false', '0', 'no', 'off', 'n', 'disabled'];
        const normalized = v.toLowerCase();
        if (truthy.includes(normalized)) return true;
        if (falsy.includes(normalized)) return false;
        throw new Error(`Unable to parse boolean: ${v}`);
    });

export const OptionalNumberSchema = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined || v === '') return undefined;
        return z.coerce.number().int().nonnegative().parse(v);
    });
