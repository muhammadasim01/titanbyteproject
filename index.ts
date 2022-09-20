import express = require("express");
import  { Request, Response } from "express";
import { pool } from "./db/db_config";
import path from "path";
import process from "process";

const corporateRoutes = require("./routes/corporateRoutes");
const userRoutes = require("./routes/userRoutes");
const branchRoutes = require("./routes/branchRoutes");
const emailRoutes = require("./routes/emailRoutes");
const loRoutes = require("./routes/loRoutes");
const folderRoutes = require("./routes/folderRoutes");
const canvaRoutes = require("./routes/canvaRoutes");
const socialTokensRoutes = require("./routes/tokenRoutes");
const bodyParser=require('body-parser')

require("dotenv").config();

const cors = require("cors");
const app = express();
app.use(cors({origin: "*",}));
app.use(express.json({ limit: "50MB" }));
app.use(express.urlencoded({ limit: "50MB" }));
app.use(bodyParser.json())

app.use("/user", userRoutes);
app.use("/corporate", corporateRoutes);
app.use("/branch", branchRoutes);
app.use("/lo", loRoutes);
app.use("/emails", emailRoutes);
app.use("/folders", folderRoutes);
app.use("/publish/", canvaRoutes);
app.use("/tokens", socialTokensRoutes);

app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT ? process.env.PORT : 3001;

app.get("/", (req, res) => {
  res.send("Hello its working");
});
app.listen(PORT, () => {
  console.log(`listing on port ${PORT}`);
});
