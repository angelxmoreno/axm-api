import { z } from 'zod';
import { LogLevelSchema } from '@/utils/create-logger';
import { safeZodParser } from '@/utils/safe-zod-parser';
import {
    CommaListSchema,
    OptionalBooleanSchema,
    OptionalNumberSchema,
    UrlOrUndefinedSchema,
} from '@/utils/string-schema-helpers';

const NodeEnvSchema = z.enum(['development', 'production', 'test']);

export const AppConfigSchema = z
    .object({
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
    })
    .transform((v) => ({
        app: {
            name: v.APP_NAME,
            nodeEnv: v.NODE_ENV,
            hostname: v.HTTP_HOSTNAME,
            port: v.HTTP_PORT,
        },
        cors: {
            origin: v.CORS_ORIGIN ?? '*',
            allowMethods: v.CORS_ALLOWED_METHODS ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowHeaders: v.CORS_ALLOWED_HEADERS ?? ['content-type', 'authorization'],
            maxAge: v.CORS_MAX_AGE ?? 86_400,
            credentials: v.CORS_CREDENTIALS ?? false,
            exposeHeaders: v.CORS_EXPOSE_HEADERS ?? [],
        },
        sentry: {
            dsn: v.SENTRY_DSN,
        },
        logger: {
            usePretty: v.LOGGER_USE_PRETTY,
            level: v.LOGGER_LEVEL,
            lokiUrl: v.LOGGER_LOKI_URL,
        },
    }));

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const createConfig = (env: Record<string, string | undefined>): AppConfig => {
    return safeZodParser(env, AppConfigSchema, 'AppConfig');
};
