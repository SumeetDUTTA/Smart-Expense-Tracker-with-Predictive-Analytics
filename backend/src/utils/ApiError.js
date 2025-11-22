class ApiError extends Error {
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = statusCode;           // used by error handler
    this.statusCode = statusCode;       // sometimes used elsewhere
    this.extra = extra;             // optional payload
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;