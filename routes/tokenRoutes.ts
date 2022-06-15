import express from "express";

const router = express.Router();

const socialTokenController = require("../controllers/SocialTokenController");

router.post("/storetoken", socialTokenController.storeToken);
router.post("/checktoken", socialTokenController.checkToken);
router.get("/gettoken", socialTokenController.getToken);
router.post(
  "/settokenforcurrentsite",
  socialTokenController.setCurrentSiteForToken
);
router.post(
  "/getcurrentselectedsiteurl",
  socialTokenController.getCurrentSelectedSiteUrl
);

router.post("/storetemporarytoken", socialTokenController.storeTemporaryToken);
router.post("/gettemporarytoken", socialTokenController.getTemporaryToken);
router.post("/deletetoken",socialTokenController.deleteSocialIntegrationToken);

module.exports = router;
