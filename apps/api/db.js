const { Pool } = require("pg");

const pool = new Pool({
  user: "serenellaangelilli",
  host: "localhost",
  database: "marketplace",
  port: 5432,
});

module.exports = pool;