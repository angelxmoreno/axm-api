import type { MiddlewareHandler } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

const OverridableHeaderSchema = z.union([z.boolean(), z.string()]).optional();

export const SecureHeadersOptionsSchema = z.object({
    crossOriginEmbedderPolicy: OverridableHeaderSchema.default(false),
    crossOriginResourcePolicy: OverridableHeaderSchema.default(true),
    crossOriginOpenerPolicy: OverridableHeaderSchema.default(true),
    originAgentCluster: OverridableHeaderSchema.default(true),
    referrerPolicy: OverridableHeaderSchema.default(true),
    strictTransportSecurity: OverridableHeaderSchema.default(true),
    xContentTypeOptions: OverridableHeaderSchema.default(true),
    xDnsPrefetchControl: OverridableHeaderSchema.default(true),
    xDownloadOptions: OverridableHeaderSchema.default(true),
    xFrameOptions: OverridableHeaderSchema.default(true),
    xPermittedCrossDomainPolicies: OverridableHeaderSchema.default(true),
    xXssProtection: OverridableHeaderSchema.default(true),
    removePoweredBy: z.boolean().optional().default(true),
});

export type SecureHeadersOptions = z.input<typeof SecureHeadersOptionsSchema>;

export const createSecureHeadersMiddleware = (options?: SecureHeadersOptions): MiddlewareHandler =>
    secureHeaders(options);
