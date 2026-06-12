import { appConfig } from '@/config/app-config';
import { createContainerBuilder } from '@/utils/create-container-builder';

const builder = createContainerBuilder(appConfig);
export const appContainer = builder.build();
