import { z } from 'zod';
import { type RateLimiterConfig, RateLimiterConfigSchema } from '@/middlewares/rate-limiter.middleware';
import { type SecureHeadersOptions, SecureHeadersOptionsSchema } from '@/middlewares/secure-headers.middleware';
import { LogLevelSchema } from '@/utils/create-logger';
import { safeZodParser } from '@/utils/safe-zod-parser';
import {
    CommaListSchema,
    OptionalBooleanSchema,
    OptionalNumberSchema,
    OverridableHeaderSchema,
    UrlOrUndefinedSchema,
} from '@/utils/string-schema-helpers';

const NodeEnvSchema = z.enum(['development', 'production', 'test']);

const buildAppConfig = (v: z.infer<typeof RawAppConfigSchema>) => ({
    app: {
        name: v.APP_NAME,
        nodeEnv: v.NODE_ENV,
        hostname: v.HTTP_HOSTNAME,
        port: v.HTTP_PORT,
    },
    cors: buildCorsConfig(v),
    secureHeaders: buildSecureHeadersConfig(v),
    rateLimiter: buildRateLimiterConfig(v),
    sentry: {
        dsn: v.SENTRY_DSN,
    },
    logger: {
        usePretty: v.LOGGER_USE_PRETTY,
        level: v.LOGGER_LEVEL,
        lokiUrl: v.LOGGER_LOKI_URL,
    },
});

const buildCorsConfig = (v: z.infer<typeof RawAppConfigSchema>) => ({
    origin: v.CORS_ORIGIN ?? '*',
    allowMethods: v.CORS_ALLOWED_METHODS ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: v.CORS_ALLOWED_HEADERS ?? ['content-type', 'authorization'],
    maxAge: v.CORS_MAX_AGE ?? 86_400,
    credentials: v.CORS_CREDENTIALS ?? false,
    exposeHeaders: v.CORS_EXPOSE_HEADERS ?? [],
});

const buildRateLimiterConfig = (v: z.infer<typeof RawAppConfigSchema>): RateLimiterConfig => {
    return RateLimiterConfigSchema.parse({
        windowMs: v.RATE_LIMITER_WINDOW_MS,
        limit: v.RATE_LIMITER_LIMIT,
    });
};

const buildSecureHeadersConfig = (v: z.infer<typeof RawAppConfigSchema>): SecureHeadersOptions => {
    return SecureHeadersOptionsSchema.parse({
        crossOriginEmbedderPolicy: v.SECURE_HEADERS_CROSS_ORIGIN_EMBEDDER_POLICY,
        crossOriginResourcePolicy: v.SECURE_HEADERS_CROSS_ORIGIN_RESOURCE_POLICY,
        crossOriginOpenerPolicy: v.SECURE_HEADERS_CROSS_ORIGIN_OPENER_POLICY,
        originAgentCluster: v.SECURE_HEADERS_ORIGIN_AGENT_CLUSTER,
        referrerPolicy: v.SECURE_HEADERS_REFERRER_POLICY,
        strictTransportSecurity: v.SECURE_HEADERS_STRICT_TRANSPORT_SECURITY,
        xContentTypeOptions: v.SECURE_HEADERS_X_CONTENT_TYPE_OPTIONS,
        xDnsPrefetchControl: v.SECURE_HEADERS_X_DNS_PREFETCH_CONTROL,
        xDownloadOptions: v.SECURE_HEADERS_X_DOWNLOAD_OPTIONS,
        xFrameOptions: v.SECURE_HEADERS_X_FRAME_OPTIONS,
        xPermittedCrossDomainPolicies: v.SECURE_HEADERS_X_PERMITTED_CROSS_DOMAIN_POLICIES,
        xXssProtection: v.SECURE_HEADERS_X_XSS_PROTECTION,
        removePoweredBy: v.SECURE_HEADERS_REMOVE_POWERED_BY,
    });
};

const RawAppConfigSchema = z.object({
    HTTP_HOSTNAME: z.string().default('localhost'),
    HTTP_PORT: z.coerce.number().int().min(0).max(65535).default(3001),
    APP_NAME: z.string(),
    SENTRY_DSN: UrlOrUndefinedSchema,
    NODE_ENV: NodeEnvSchema,
    LOGGER_USE_PRETTY: z.stringbool(),
    LOGGER_LEVEL: LogLevelSchema,
    LOGGER_LOKI_URL: UrlOrUndefinedSchema,
    CORS_ORIGIN: z.string().optional(),
    CORS_ALLOWED_METHODS: CommaListSchema,
    CORS_ALLOWED_HEADERS: CommaListSchema,
    CORS_MAX_AGE: OptionalNumberSchema,
    CORS_CREDENTIALS: OptionalBooleanSchema,
    CORS_EXPOSE_HEADERS: CommaListSchema,
    RATE_LIMITER_WINDOW_MS: OptionalNumberSchema,
    RATE_LIMITER_LIMIT: OptionalNumberSchema,
    SECURE_HEADERS_CROSS_ORIGIN_EMBEDDER_POLICY: OverridableHeaderSchema,
    SECURE_HEADERS_CROSS_ORIGIN_RESOURCE_POLICY: OverridableHeaderSchema,
    SECURE_HEADERS_CROSS_ORIGIN_OPENER_POLICY: OverridableHeaderSchema,
    SECURE_HEADERS_ORIGIN_AGENT_CLUSTER: OverridableHeaderSchema,
    SECURE_HEADERS_REFERRER_POLICY: OverridableHeaderSchema,
    SECURE_HEADERS_STRICT_TRANSPORT_SECURITY: OverridableHeaderSchema,
    SECURE_HEADERS_X_CONTENT_TYPE_OPTIONS: OverridableHeaderSchema,
    SECURE_HEADERS_X_DNS_PREFETCH_CONTROL: OverridableHeaderSchema,
    SECURE_HEADERS_X_DOWNLOAD_OPTIONS: OverridableHeaderSchema,
    SECURE_HEADERS_X_FRAME_OPTIONS: OverridableHeaderSchema,
    SECURE_HEADERS_X_PERMITTED_CROSS_DOMAIN_POLICIES: OverridableHeaderSchema,
    SECURE_HEADERS_X_XSS_PROTECTION: OverridableHeaderSchema,
    SECURE_HEADERS_REMOVE_POWERED_BY: OptionalBooleanSchema,
});

export const AppConfigSchema = RawAppConfigSchema.transform(buildAppConfig);

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const createConfig = (env: Record<string, string | undefined>): AppConfig => {
    return safeZodParser(env, AppConfigSchema, 'AppConfig');
};
