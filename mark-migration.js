const pool = require('./src/db.js');
pool.query('SELECT version FROM schema_migrations ORDER BY version').then(res => {
  console.log(res.rows);
  process.exit(0);
}).catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});