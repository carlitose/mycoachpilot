import log from 'loglevel';

// Configure log level based on environment
if (process.env.NODE_ENV === 'production') {
  log.setLevel('warn'); // In production, only show warnings and errors
} else {
  log.setLevel('debug'); // In development, show everything
}

// Export a consistent interface
const logger = {
  info: (message: string, meta?: any) => {
    log.info(message, meta);
  },
  error: (message: string, meta?: any) => {
    log.error(message, meta);
  },
  warn: (message: string, meta?: any) => {
    log.warn(message, meta);
  },
  debug: (message: string, meta?: any) => {
    log.debug(message, meta);
  },
  log: (message: string, meta?: any) => {
    log.info(message, meta);
  },
};

export { logger as log };
