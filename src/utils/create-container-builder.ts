import { type Builder, Container } from '@novadi/core';
import type { Logger } from 'pino';
import type { AppConfig } from '@/utils/create-config';
import { createLogger } from '@/utils/create-logger';

export const createContainerBuilder = (config: AppConfig): Builder => {
    const builder = new Container().builder();

    const logger = createLogger({
        level: config.logger.level,
        usePretty: config.logger.usePretty,
        lokiUrl: config.logger.lokiUrl,
    });

    builder.registerInstance(logger).as<Logger>('Logger').singleInstance();
    return builder;
};
