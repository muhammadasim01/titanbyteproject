import express from "express";

const router = express.Router();

const folderController = require("../controllers/FolderController");

router.get("/", folderController.getAllFolders);
router.post("/newfolder", folderController.createNewFolder);
router.get("/getchildfolders/:parent_id", folderController.getChildFolders);
// route for selecting the current selected folder for uploading the design to the selected folder
router.post("/setcurrentfolder", folderController.setCurrentFolder);
// Function for getting folders and designs for the sub folder page instead of getting for hierarchy
router.post("/getsubfolders", folderController.getSubFolders);
router.post("/getdesignsbyfolder",folderController.getDesignsByFolder)
module.exports = router;
