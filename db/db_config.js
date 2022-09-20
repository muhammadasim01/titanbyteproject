"use strict";
exports.__esModule = true;
exports.pool = void 0;
var pg_1 = require("pg");
require("dotenv").config();
var devConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
};
var prodcutiondbConfig = {
    connectionString: "".concat(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false }
};
exports.pool = new pg_1.Pool(process.env.NODE_ENV === "production" ? prodcutiondbConfig : devConfig);
