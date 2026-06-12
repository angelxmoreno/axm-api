import { z } from 'zod';
import { LogLevelSchema } from '@/utils/create-logger';
import { safeZodParser } from '@/utils/safe-zod-parser';

export const AppConfigSchema = z
    .object({
        LOGGER_USE_PRETTY: z.stringbool(),
        LOGGER_LEVEL: LogLevelSchema,
        LOGGER_LOKI_URL: z
            .union([z.url(), z.literal('').transform(() => undefined)])
            .optional()
            .transform((v) => (v === '' ? undefined : v)),
    })
    .transform((v) => ({
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
