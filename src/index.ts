import { appConfig } from '@/config/app.config';
import { initSentry } from '@/utils/sentry-utils';

if (appConfig.app.nodeEnv === 'production') {
    initSentry(appConfig);
}
