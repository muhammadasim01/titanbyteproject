//Controller responsible handling logic for requests from canva

import { NextFunction, Request, Response } from "express";
import { CurrentFolder } from "../models/CurrentFolder";
import jimp from "jimp";
import { region, s3Client } from "../utils/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Design } from "../models/Design";
import { pool } from "../db/db_config";
import { Folder } from "../models/Folder";
require("dotenv").config();

const publishDesign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const s3Bucket = process.env.S3_BUCKET;
  // Get the first asset from the "assets" array
  const [asset] = req.body.assets;

  // get parent folder id if folder was selected when uploading from canva app
  const { parent } = req.body;
  console.log(parent);

  // Download the asset
  try {
    // check if a folder was selected from dashboard
    const selectedFolder = await CurrentFolder.all();
    console.log(selectedFolder);
    console.log("length of selected folder",selectedFolder.length);
    
    const isFolderSelected = selectedFolder.length === 0 ? false : true;
    console.log("folder selected", isFolderSelected);

    // url for affiliated header
    const affiliatedHeader = jimp.read(
      "https://affiliatedsd.com/wp-content/uploads/2022/06/1200x50-H.jpg"
    );
    const affiliatedFooter = jimp.read(
      "https://affiliatedsd.com/wp-content/uploads/2022/06/1200x50-F.jpg"
    );
    const image = await jimp.read(asset.url);
    // original image height
    const imageHeight = image.getHeight();
    // original image width
    // const imageWidth = image.getWidth();
    // // resize the affiliated header to the
    // (await affiliatedHeader).resize(1200, 100).quality(90);
    // (await affiliatedFooter).resize(1200, 100).quality(90);
    image.composite(await affiliatedHeader, 0, 0);
    image.composite(await affiliatedFooter, 0, imageHeight - 50);
    // get image mime type for getting the buffer
    const imageMimeType = asset.type == "JPG" ? jimp.MIME_JPEG : jimp.MIME_PNG;
    // get the image buffer from the image read from the asset url
    const imageBuffer = await image.getBufferAsync(imageMimeType);
    // set s3 params for uploading the image
    const assetName = `${Date.now()}${asset.name.replace(/ /g, "_")}`;
    console.log(assetName);

    const s3ObjectParams = {
      Bucket: s3Bucket,
      Key: assetName,
      Body: imageBuffer,
    };
    try {
      // upload the image to s3 bucket
      await s3Client.send(new PutObjectCommand(s3ObjectParams));
      // if the folder is selected from the dashboard insert the design into the db with folder_id
      if (isFolderSelected) {
        try {
          await Design.insert(
            ["design_url", "folder_id", "design_name"],
            [
              `https://${s3Bucket}.s3.${region}.amazonaws.com/${assetName}`,
              selectedFolder[0].folder_id,
              assetName,
            ]
          );
          // empty the selected folder because after uploading to the selected folder we want to reset for new selections
          await pool.query("TRUNCATE ONLY selected_folder_for_canva");
        } catch (error) {
          console.log(error);
        }
      } else if (parent) {
        // this else if will run if folder was selected from canva app when uploading design
        try {
          await Design.insert(
            ["design_url", "folder_id", "design_name"],
            [
              `https://${s3Bucket}.s3.${region}.amazonaws.com/${assetName}`,
              parent,
              assetName,
            ]
          );
        } catch (error) {
          console.log(error);
        }
      }
      // otherwise insert without folder_id i.e. design is in the root directory
      else {
        try {
          await Design.insert(
            ["design_url", "design_name"],
            [
              `https://${s3Bucket}.s3.${region}.amazonaws.com/${assetName}`,
              assetName,
            ]
          );
        } catch (error) {
          console.log(error);
        }
      }
      // uploadFile// Respond with the URL of the published design (required for canva)
      res.send({
        type: "SUCCESS",
        url: `https://${s3Bucket}.s3.${region}.amazonaws.com/${assetName}`,
      });
      res.locals.s3Url = `https://${s3Bucket}.s3.${region}.amazonaws.com/${assetName}`;
      res.locals.imageName = assetName;
      return next();
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 *
 * @description Method for handling canva required resources find end point for folder
 * @param req Optional containerId variable when we want to access hai nested folder
 * @param res {Array} -Array of folders from our database
 */
const resourceFind = async (req: Request, res: Response) => {
  const containerId = req.body.containerId || null;
  const { query } = req.body;
  console.log(query);

  // if theres a containerId in the request that means we are accessing a nested folder inside canva app
  if (containerId) {
    const getNestedFoldersQuery = `SELECT folder_id,
    folder_name,
    created_at
    FROM folder_structure
    WHERE parent_id=$1 
    ORDER BY created_at DESC`;
    const nestedFolders = await pool.query(getNestedFoldersQuery, [
      containerId,
    ]);
    if (nestedFolders.rows.length === 0) {
      return res.send({ type: "ERROR", errorCode: "NOT_FOUND" });
    }
    // construct response object array in the format in which canva accepts
    const responseObjectArray = nestedFolders.rows.map((folder) => {
      return {
        type: "CONTAINER",
        id: folder.folder_id,
        name: folder.folder_name,
        isOwner: true,
        readOnly: false,
      };
    });
    return res.send({
      type: "SUCCESS",
      resources: responseObjectArray,
    });
  }

  // The user has performed a search from the canva app menu for searching folder
  if (query) {
    const getQueriedFolderQuery = `SELECT folder_id,
    folder_name,
    created_at
    FROM folder_structure
    WHERE folder_document @@ to_tsquery($1) 
    ORDER BY created_at DESC`;
    const searchedFolders = await pool.query(getQueriedFolderQuery, [
      `${query}:*`,
    ]);

    if (searchedFolders.rows.length === 0) {
      return res.send({ type: "ERROR", errorCode: "NOT_FOUND" });
    }
    // construct response object array in the format in which canva accepts
    const responseFoldersArray = searchedFolders.rows.map((folder) => {
      return {
        type: "CONTAINER",
        id: folder.folder_id,
        name: folder.folder_name,
        isOwner: true,
        readOnly: false,
      };
    });
    return res.send({
      type: "SUCCESS",
      resources: responseFoldersArray,
    });
  }

  const getRootFoldersQuery = `SELECT folder_id,
  folder_name,
  created_at
  FROM folder_structure
  WHERE parent_id IS NULL 
  ORDER BY created_at DESC`;
  const rootFolders = await pool.query(getRootFoldersQuery);
  if (rootFolders.rows.length === 0) {
    return res.send({ type: "ERROR", errorCode: "NOT_FOUND" });
  }
  // construct response object array in the format in which canva accepts
  const responseObjectArray = rootFolders.rows.map((folder) => {
    return {
      type: "CONTAINER",
      id: folder.folder_id,
      name: folder.folder_name,
      isOwner: true,
      readOnly: false,
    };
  });

  return res.send({
    type: "SUCCESS",
    resources: responseObjectArray,
  });
};

/**
 * @description Method for handling canva required resources get end point for verifying folder
 * @param req {Number} id of the folder which user selected from canva app
 * @param res Response object with folder details in the required canva response format
 */
const resourceGet = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.send({
      type: "ERROR",
      errorCode: "NOT_FOUND",
    });
  }
  const singleFolderQuery = `SELECT folder_id,
  folder_name,
  created_at
  FROM folder_structure
  WHERE folder_id=$1 
  ORDER BY created_at DESC`;

  const singleFolder = await pool.query(singleFolderQuery, [id]);
  if (singleFolder.rows.length == 0) {
    return res.send({
      type: "ERROR",
      errorCode: "NOT_FOUND",
    });
  }

  return res.send({
    type: "SUCCESS",
    resource: {
      type: "CONTAINER",
      id: singleFolder.rows[0].folder_id,
      name: singleFolder.rows[0].folder_name,
      isOwner: true,
      readOnly: false,
    },
  });
};

module.exports = {
  publishDesign,
  resourceFind,
  resourceGet,
};
