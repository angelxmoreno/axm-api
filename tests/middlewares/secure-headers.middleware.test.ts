import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { createSecureHeadersMiddleware, SecureHeadersOptionsSchema } from '@/middlewares/secure-headers.middleware';

describe('SecureHeadersOptionsSchema', () => {
    it('accepts all boolean toggles as true', () => {
        const result = SecureHeadersOptionsSchema.parse({
            crossOriginEmbedderPolicy: true,
            crossOriginResourcePolicy: true,
            crossOriginOpenerPolicy: true,
            originAgentCluster: true,
            referrerPolicy: true,
            strictTransportSecurity: true,
            xContentTypeOptions: true,
            xDnsPrefetchControl: true,
            xDownloadOptions: true,
            xFrameOptions: true,
            xPermittedCrossDomainPolicies: true,
            xXssProtection: true,
            removePoweredBy: true,
        });
        expect(result).toEqual({
            crossOriginEmbedderPolicy: true,
            crossOriginResourcePolicy: true,
            crossOriginOpenerPolicy: true,
            originAgentCluster: true,
            referrerPolicy: true,
            strictTransportSecurity: true,
            xContentTypeOptions: true,
            xDnsPrefetchControl: true,
            xDownloadOptions: true,
            xFrameOptions: true,
            xPermittedCrossDomainPolicies: true,
            xXssProtection: true,
            removePoweredBy: true,
        });
    });

    it('accepts literal header string values', () => {
        const result = SecureHeadersOptionsSchema.parse({
            xFrameOptions: 'DENY',
            referrerPolicy: 'strict-origin-when-cross-origin',
        });
        expect(result.xFrameOptions).toBe('DENY');
        expect(result.referrerPolicy).toBe('strict-origin-when-cross-origin');
    });

    it('rejects an invalid value type', () => {
        expect(() => SecureHeadersOptionsSchema.parse({ xFrameOptions: 123 })).toThrow(z.ZodError);
    });

    it('rejects removePoweredBy as a string', () => {
        expect(() => SecureHeadersOptionsSchema.parse({ removePoweredBy: 'true' })).toThrow(z.ZodError);
    });
});

describe('createSecureHeadersMiddleware()', () => {
    it('returns a Hono middleware', () => {
        const middleware = createSecureHeadersMiddleware({ xFrameOptions: 'DENY' });
        expect(typeof middleware).toBe('function');
    });

    it('returns a middleware when called without options', () => {
        const middleware = createSecureHeadersMiddleware();
        expect(typeof middleware).toBe('function');
    });
});
