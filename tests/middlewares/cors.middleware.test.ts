import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { CorsOptionsSchema, createCorsMiddleware } from '@/middlewares/cors.middleware';

describe('CorsOptionsSchema', () => {
    it('applies sensible defaults when called with an empty object', () => {
        const result = CorsOptionsSchema.parse({});
        expect(result).toEqual({
            origin: '*',
            allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowHeaders: ['content-type', 'authorization'],
            maxAge: 86_400,
            credentials: false,
            exposeHeaders: [],
        });
    });

    it('accepts a static origin string', () => {
        const result = CorsOptionsSchema.parse({ origin: 'https://example.com' });
        expect(result.origin).toBe('https://example.com');
    });

    it('accepts an array of origins', () => {
        const result = CorsOptionsSchema.parse({ origin: ['https://a.com', 'https://b.com'] });
        expect(result.origin).toEqual(['https://a.com', 'https://b.com']);
    });

    it('accepts an origin function', () => {
        const result = CorsOptionsSchema.parse({ origin: () => 'https://example.com' });
        expect(typeof result.origin).toBe('function');
    });

    it('accepts an async origin function', () => {
        const result = CorsOptionsSchema.parse({ origin: async () => 'https://example.com' });
        expect(typeof result.origin).toBe('function');
    });

    it('accepts allowMethods as an array', () => {
        const result = CorsOptionsSchema.parse({ allowMethods: ['GET', 'POST'] });
        expect(result.allowMethods).toEqual(['GET', 'POST']);
    });

    it('accepts allowMethods as a function', () => {
        const result = CorsOptionsSchema.parse({ allowMethods: () => ['GET', 'POST'] });
        expect(typeof result.allowMethods).toBe('function');
    });

    it('accepts all static options together', () => {
        const result = CorsOptionsSchema.parse({
            origin: ['https://example.com'],
            allowMethods: ['GET', 'POST'],
            allowHeaders: ['content-type', 'authorization'],
            maxAge: 86400,
            credentials: true,
            exposeHeaders: ['x-request-id'],
        });
        expect(result).toEqual({
            origin: ['https://example.com'],
            allowMethods: ['GET', 'POST'],
            allowHeaders: ['content-type', 'authorization'],
            maxAge: 86400,
            credentials: true,
            exposeHeaders: ['x-request-id'],
        });
    });

    it('rejects an invalid maxAge type', () => {
        expect(() => CorsOptionsSchema.parse({ maxAge: 'not-a-number' })).toThrow(z.ZodError);
    });

    it('rejects an invalid allowHeaders type', () => {
        expect(() => CorsOptionsSchema.parse({ allowHeaders: 'content-type' })).toThrow(z.ZodError);
    });

    it('rejects an invalid origin type', () => {
        expect(() => CorsOptionsSchema.parse({ origin: 123 })).toThrow(z.ZodError);
    });
});

describe('createCorsMiddleware()', () => {
    it('returns a Hono middleware', () => {
        const middleware = createCorsMiddleware({ origin: '*' });
        expect(typeof middleware).toBe('function');
    });

    it('returns a middleware when called without options', () => {
        const middleware = createCorsMiddleware();
        expect(typeof middleware).toBe('function');
    });
});
