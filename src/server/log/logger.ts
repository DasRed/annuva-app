import getConfig from '@/server/config/getConfig';

const levels = {debug: 10, error: 40, info: 20, warn: 30} as const;

type Level = keyof typeof levels;

function write(level: Level, message: string, data?: unknown): void {
    if (levels[level] < levels[getConfig().logLevel]) {
        return;
    }
    const line = `${new Date().toISOString()} ${level.toUpperCase()} ${message}`;
    const output = level === 'error' || level === 'warn' ? console.error : console.log;
    if (data === undefined) {
        output(line);
    }
    else {
        output(line, data);
    }
}

const logger = {
    debug: (message: string, data?: unknown) => write('debug', message, data),
    error: (message: string, data?: unknown) => write('error', message, data),
    info:  (message: string, data?: unknown) => write('info', message, data),
    warn:  (message: string, data?: unknown) => write('warn', message, data),
};

export default logger;
