import pino, { type Logger } from 'pino';

export type CapturedLog = Record<string, unknown>;

export const createCapturingLogger = (): { logger: Logger; logs: CapturedLog[] } => {
    const logs: CapturedLog[] = [];
    const stream = {
        write: (line: string) => {
            const parsed = JSON.parse(line) as CapturedLog;
            logs.push(parsed);
        },
    };
    const logger = pino({ level: 'info' }, stream as unknown as pino.DestinationStream);
    return { logger, logs };
};
