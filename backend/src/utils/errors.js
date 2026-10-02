export class AppError extends Error {
  /**
   * @param {string} code      machine-readable error code
   * @param {string} message   human-readable message
   * @param {object} [opts]
   * @param {number} [opts.status]     HTTP status (REST)
   * @param {number} [opts.closeCode]  WebSocket close code (4000-4999)
   */
  constructor(code, message, { status = 400, closeCode = 4000 } = {}) {
    super(message);  //super is used to call methods from a parent class basically Error(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.closeCode = closeCode;
  }
}

export const Errors = {
  badRequest: (msg = 'Bad request') => new AppError('BAD_REQUEST', msg, { status: 400, closeCode: 4001 }),
  sessionNotFound: () =>
    new AppError('SESSION_NOT_FOUND', 'Session not found or expired', { status: 404, closeCode: 4004 }),
  sessionFull: () => new AppError('SESSION_FULL', 'Session has reached its device limit', { status: 409, closeCode: 4008 }),
  rateLimited: () => new AppError('RATE_LIMITED', 'Too many messages, slow down', { status: 429 }),
};