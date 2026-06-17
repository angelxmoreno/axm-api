import { z } from 'zod';

const TRUTHY_STRING_BOOLEANS = ['true', '1', 'yes', 'on', 'y', 'enabled'];
const FALSY_STRING_BOOLEANS = ['false', '0', 'no', 'off', 'n', 'disabled'];

export const parseStringBoolean = (value: string): boolean => {
    const normalized = value.toLowerCase();
    if (TRUTHY_STRING_BOOLEANS.includes(normalized)) return true;
    if (FALSY_STRING_BOOLEANS.includes(normalized)) return false;
    throw new Error(`Unable to parse boolean: ${value}`);
};

export const UrlOrUndefinedSchema = z.union([z.url(), z.literal('').transform(() => undefined)]).optional();

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
        return parseStringBoolean(v);
    });

export const OptionalNumberSchema = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined || v === '') return undefined;
        return z.coerce.number().int().nonnegative().parse(v);
    });

export const OverridableHeaderSchema = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined || v === '') return undefined;
        try {
            return parseStringBoolean(v);
        } catch {
            return v;
        }
    });
