import type { Context, MiddlewareHandler } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import { z } from 'zod';
import type { AppEnv } from '@/schemas/hono';

export const RateLimiterConfigSchema = z.object({
    windowMs: z
        .number()
        .int()
        .min(1_000)
        .default(15 * 60 * 1000),
    limit: z.number().int().min(1).default(100),
});

export type RateLimiterConfig = z.infer<typeof RateLimiterConfigSchema>;

const extractClientKey = (c: Context): string => {
    const forwardedFor = c.req.header('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
    }

    return c.req.header('x-real-ip') ?? 'unknown';
};

export const createRateLimiterMiddleware = (config: RateLimiterConfig): MiddlewareHandler<AppEnv> => {
    const parsed = RateLimiterConfigSchema.parse(config);

    return rateLimiter({
        windowMs: parsed.windowMs,
        limit: parsed.limit,
        keyGenerator: (c) => extractClientKey(c),
    }) as MiddlewareHandler<AppEnv>;
};
