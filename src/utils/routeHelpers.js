// Shared helpers for routes that call stored procedures

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// p_error_code from a write proc -> HTTP status
const ERROR_STATUS = { NOT_FOUND: 404, FORBIDDEN: 403, INVALID: 400 };

const isUuid = (value) => typeof value === 'string' && UUID_RE.test(value);

// Business-rule failure from a write proc -> HTTP response
function sendProcError(res, result) {
  const status = ERROR_STATUS[result.p_error_code] || 400;
  return res.status(status).json({ error: result.p_message, code: result.p_error_code });
}

module.exports = { isUuid, sendProcError };