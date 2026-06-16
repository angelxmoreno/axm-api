import pino, { type LoggerOptions } from 'pino';
import type { LokiOptions } from 'pino-loki';
import { z } from 'zod';
import { safeZodParser } from '@/utils/safe-zod-parser';

export const LogLevelSchema = z.enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace']);

export const CreateLoggerOptionsSchema = z.object({
    labels: z.record(z.string(), z.string()).optional(),
    usePretty: z.boolean().default(true),
    level: LogLevelSchema,
    lokiUrl: z.url().optional(),
});

export type CreateLoggerOptions = z.infer<typeof CreateLoggerOptionsSchema>;

export function createLogger(options: CreateLoggerOptions) {
    const { level, usePretty, lokiUrl, labels } = safeZodParser(options, CreateLoggerOptionsSchema, 'Creating Logger');

    if (level === 'silent') {
        return pino({ enabled: false });
    }

    const targets: pino.TransportTargetOptions[] = [];

    if (usePretty) {
        targets.push({
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'HH:MM:ss.l',
            },
        });
    }

    if (lokiUrl) {
        targets.push({
            target: 'pino-loki',
            options: {
                host: lokiUrl,
                labels,
            } satisfies LokiOptions,
        });
    }

    const pinoOptions: LoggerOptions = {
        level,
        base: undefined,
    };

    if (targets.length > 0) {
        pinoOptions.transport = { targets };
    }

    return pino(pinoOptions);
}
