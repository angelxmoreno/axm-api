import type { Context, MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

type OriginResolver = (origin: string, c: Context) => string | undefined | null | Promise<string | undefined | null>;

const OriginFunctionSchema = z.custom<OriginResolver>((value) => typeof value === 'function', {
    message: 'origin must be a string, string array, or function',
});

type AllowMethodsResolver = (origin: string, c: Context) => string[] | Promise<string[]>;

const AllowMethodsFunctionSchema = z.custom<AllowMethodsResolver>((value) => typeof value === 'function', {
    message: 'allowMethods must be a string array or function',
});

export const CorsOptionsSchema = z.object({
    origin: z.union([z.string().min(1), z.array(z.string().min(1)), OriginFunctionSchema]).default('*'),
    allowMethods: z
        .union([z.array(z.string()), AllowMethodsFunctionSchema])
        .default(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
    allowHeaders: z.array(z.string()).default(['content-type', 'authorization']),
    maxAge: z.number().default(86_400),
    credentials: z.boolean().default(false),
    exposeHeaders: z.array(z.string()).default([]),
});

export type CorsOptions = z.input<typeof CorsOptionsSchema>;

export const createCorsMiddleware = (options?: CorsOptions): MiddlewareHandler => {
    const parsed = CorsOptionsSchema.parse(options ?? {});
    return cors(parsed);
};
