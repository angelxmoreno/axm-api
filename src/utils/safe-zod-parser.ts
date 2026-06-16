import type { ZodType } from 'zod';

export const safeZodParser = <T>(values: unknown, schema: ZodType<T>, action: string): T => {
    try {
        return schema.parse(values);
    } catch (error) {
        throw new Error(`${action}: Unable to parse schema`, { cause: error });
    }
};
