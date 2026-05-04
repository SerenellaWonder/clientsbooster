const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction
          ? {
              rejectUnauthorized: false,
            }
          : false,
      }
    : {
        user: "serenellaangelilli",
        host: "localhost",
        database: "marketplace",
        port: 5432,
      }
);

module.exports = pool;