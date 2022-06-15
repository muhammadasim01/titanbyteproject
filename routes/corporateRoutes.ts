import express from "express";
const Router = express.Router();

const CorporateController = require("../controllers/CorporateController");

Router.get("/", CorporateController.showAllCorporates);
Router.post("/create", CorporateController.createNewCorporate);
Router.post("/getcorporateid", CorporateController.getCorporateId);

module.exports = Router;
