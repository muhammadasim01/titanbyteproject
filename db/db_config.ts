import { Pool } from "pg";
require("dotenv").config();

const devConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT as unknown as number,
};
const prodcutiondbConfig = {
  connectionString: `${process.env.DATABASE_URL}`,
  ssl: { rejectUnauthorized: false }
};

export const pool = new Pool(
  process.env.NODE_ENV === "production" ? prodcutiondbConfig : devConfig
);
