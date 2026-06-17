import type { MiddlewareHandler } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

const SecureHeadersOverridableSchema = z.union([z.boolean(), z.string()]).optional();

export const SecureHeadersOptionsSchema = z.object({
    crossOriginEmbedderPolicy: SecureHeadersOverridableSchema.default(false),
    crossOriginResourcePolicy: SecureHeadersOverridableSchema.default(true),
    crossOriginOpenerPolicy: SecureHeadersOverridableSchema.default(true),
    originAgentCluster: SecureHeadersOverridableSchema.default(true),
    referrerPolicy: SecureHeadersOverridableSchema.default(true),
    strictTransportSecurity: SecureHeadersOverridableSchema.default(true),
    xContentTypeOptions: SecureHeadersOverridableSchema.default(true),
    xDnsPrefetchControl: SecureHeadersOverridableSchema.default(true),
    xDownloadOptions: SecureHeadersOverridableSchema.default(true),
    xFrameOptions: SecureHeadersOverridableSchema.default(true),
    xPermittedCrossDomainPolicies: SecureHeadersOverridableSchema.default(true),
    xXssProtection: SecureHeadersOverridableSchema.default(true),
    removePoweredBy: z.boolean().optional().default(true),
});

export type SecureHeadersOptions = z.input<typeof SecureHeadersOptionsSchema>;

export const createSecureHeadersMiddleware = (options?: SecureHeadersOptions): MiddlewareHandler => {
    const parsed = SecureHeadersOptionsSchema.parse(options ?? {});
    return secureHeaders(parsed);
};
