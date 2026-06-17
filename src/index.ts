import type { Logger } from 'pino';
import { appConfig } from '@/config/app.config';
import { appContainer } from '@/config/app.container';
import { initSentry } from '@/utils/sentry-utils';

if (appConfig.app.nodeEnv === 'production') {
    initSentry(appConfig);
}
const logger = appContainer.resolveType<Logger>('Logger');
logger.info('Starting app container');
