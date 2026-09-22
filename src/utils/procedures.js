const pool = require('../db');

const SAFE_NAME = /^[a-z_][a-z0-9_]*$/i;

function buildCall(procName, paramCount, outCount) {
  if (!SAFE_NAME.test(procName)) throw new Error(`Invalid procedure name: ${procName}`);
  const args = [];
  for (let i = 1; i <= paramCount; i++) args.push(`$${i}`);
  for (let i = 0; i < outCount; i++) args.push('NULL');
  return `CALL ${procName}(${args.join(', ')})`;
}

// Read procs (OUT result REFCURSOR): open connection, BEGIN, CALL, FETCH, COMMIT, release
async function callReadProc(procName, params = []) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const call = await client.query(buildCall(procName, params.length, 1), params);
    const cursorName = call.rows[0].result.replace(/"/g, '""');
    const rows = await client.query(`FETCH ALL FROM "${cursorName}"`);
    await client.query('COMMIT');
    return rows.rows;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Write procs (OUT p_success, OUT p_message): open connection, CALL, release
async function callWriteProc(procName, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(buildCall(procName, params.length, 2), params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

module.exports = { callReadProc, callWriteProc };