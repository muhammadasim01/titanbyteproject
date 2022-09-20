"use strict";
exports.__esModule = true;
var express = require("express");
// import path from "path";
// import process from "process";
require("dotenv").config();
var cors = require("cors");
var app = express();
app.post("/register", function (req, res) {
    console.log('register data');
    res.send(req.body);
});
app.use(express.json({ limit: "50MB" }));
app.use(express.urlencoded({ limit: "50MB" }));
// app.use(express.static(path.join(__dirname, "public")));
//setup cors
app.use(cors({
    origin: "*"
}));
var PORT = process.env.PORT ? process.env.PORT : 3001;
app.get("/", function (req, res) {
    res.send("Hello it's not working");
});
// IMPORT ALL THE ROUTES
var corporateRoutes = require("./routes/corporateRoutes");
var userRoutes = require("./routes/userRoutes");
var branchRoutes = require("./routes/branchRoutes");
var emailRoutes = require("./routes/emailRoutes");
var loRoutes = require("./routes/loRoutes");
var folderRoutes = require("./routes/folderRoutes");
var canvaRoutes = require("./routes/canvaRoutes");
var socialTokensRoutes = require("./routes/tokenRoutes");
// CONFIGURE OUR APP TO USE THE ABOVE IMPORTED ROUTES
app.use("/corporate", corporateRoutes);
app.use("/user", userRoutes);
app.use("/branch", branchRoutes);
app.use("/lo", loRoutes);
app.use("/emails", emailRoutes);
app.use("/folders", folderRoutes);
app.use("/publish/", canvaRoutes);
app.use("/tokens", socialTokensRoutes);
app.listen(PORT, function () {
    console.log("listing on port ".concat(PORT));
});
