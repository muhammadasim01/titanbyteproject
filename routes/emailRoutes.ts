import express from "express";
const Router = express.Router();

const EmailControllerDashBoard = require("../controllers/EmailControllerDashBoard");

Router.post(
  "/emailfromdashboard",
  EmailControllerDashBoard.sendEmailFromDashBoard
);
Router.post("/emailonnewactivity", EmailControllerDashBoard.emailOnNewActivity);

Router.post(
  "/sendemailonblogpostapproval",
  EmailControllerDashBoard.sendEmailOnBlogPostApproval
);

Router.post(
  "/sendemailforactivityapproval",
  EmailControllerDashBoard.sendEmailForActivityApproval
);

module.exports = Router;
