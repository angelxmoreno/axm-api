import { describe, expect, it } from 'bun:test';
import type { Logger } from 'pino';
import { type AppConfig, createConfig } from '@/utils/create-config';
import { createContainerBuilder } from '@/utils/create-container-builder';

// Smoke tests for the wiring factory. The contract: build() returns a
// container that resolves a `Logger` whose level matches the config.

const baseEnv: Record<string, string | undefined> = {
    APP_NAME: 'axm-api',
    SENTRY_DSN: '',
    NODE_ENV: 'development',
    LOGGER_USE_PRETTY: 'true',
    LOGGER_LEVEL: 'info',
    LOGGER_LOKI_URL: '',
};

const buildBuilder = (overrides: Partial<AppConfig['logger']> = {}): ReturnType<typeof createContainerBuilder> => {
    const config = createConfig(baseEnv);
    return createContainerBuilder({
        ...config,
        logger: { ...config.logger, ...overrides },
    });
};

describe('createContainerBuilder()', () => {
    it('returns a Builder from @novadi/core', () => {
        const builder = buildBuilder();
        // Builders expose build() — proves we got a real builder back, not a Container.
        expect(typeof builder.build).toBe('function');
    });

    describe('logger registration', () => {
        it('builds a container that resolves a pino Logger', () => {
            const container = buildBuilder().build();
            const logger = container.resolveType<Logger>('Logger');
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
        });

        it('registers the logger as a single instance (singleton lifetime)', () => {
            const container = buildBuilder().build();
            const a = container.resolveType<Logger>('Logger');
            const b = container.resolveType<Logger>('Logger');
            expect(a).toBe(b);
        });

        it('forwards the configured level to the registered logger', () => {
            const container = buildBuilder({ level: 'debug' }).build();
            const logger = container.resolveType<Logger>('Logger');
            expect(logger.level).toBe('debug');
        });

        it('respects silent level (returns a disabled pino logger)', () => {
            const container = buildBuilder({ level: 'silent' }).build();
            const logger = container.resolveType<Logger>('Logger');
            expect(logger.level).toBe('silent');
        });
    });
});
