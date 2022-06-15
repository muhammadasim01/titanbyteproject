import express from "express";
import postDesignToAffiliatedWebsites from "../middlewares/canvaPublish";

const router = express.Router();

const canvaController = require("../controllers/CanvaController");

router.post("/resources/upload", canvaController.publishDesign);
router.use("/resources/upload", postDesignToAffiliatedWebsites);
router.post("/resources/find", canvaController.resourceFind);
router.post("/resources/get", canvaController.resourceGet);

module.exports = router;
