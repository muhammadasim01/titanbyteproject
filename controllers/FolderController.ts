import { Request, Response } from "express";
import { QueryResult } from "pg";
import { pool } from "../db/db_config";
import { Design } from "../models/Design";
import { Folder } from "../models/Folder";
import { InterfaceRequestFolder } from "../types/requestTypes";

const getAllFolders = async (req: Request, res: Response) => {
  try {
    const allFoldersQuery = `
    SELECT folder_id,
    folder_name,
    created_at
    FROM folder_structure
    WHERE parent_id IS NULL 
    ORDER BY created_at DESC
    `;
    const allDesignsQuery = `
    SELECT design_url
    FROM canva_designs
    WHERE folder_id IS NULL
    `;
    const allFolders: QueryResult<InterfaceRequestFolder[]> = await pool.query(
      allFoldersQuery
    );
    const allDesigns = await pool.query(allDesignsQuery);
    if (allFolders.rows.length === 0) {
      return res.json({
        success: false,
        message: "No Record Found in database",
      });
    }
    return res.json({
      success: true,
      allFolders: allFolders.rows,
      allDesigns: allDesigns.rows,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something Went Wrong please try again later!",
    });
  }
};

const createNewFolder = async (req: Request, res: Response) => {
  const { folder_name, parent_id }: InterfaceRequestFolder = req.body;

  if (parent_id) {
    try {
      await Folder.insert(
        ["folder_name", "parent_id"],
        [folder_name, parent_id]
      );
      return res.json({
        success: true,
        message: "New Folder Created",
      });
    } catch (error) {
      console.log(error);
      return res.json({
        success: false,
        message: "Something Went Wrong please try again later!",
      });
    }
  }
  try {
    await Folder.insert(["folder_name"], [folder_name]);
    return res.json({
      success: true,
      message: "New Folder Created",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something Went Wrong please try again later!",
    });
  }
};

const getChildFolders = async (req: Request, res: Response) => {
  const { parent_id } = req.params;
  if (!parent_id) {
    return res.json({
      success: false,
      message: "No parent_id provided",
    });
  }
  try {
    const subFoldersQuery = `SELECT folder_id,folder_name,parent_id,created_at FROM folder_structure WHERE parent_id=$1::int`;

    const allChildFolders: QueryResult<[]> = await pool.query(subFoldersQuery, [
      parent_id,
    ]);
    if (allChildFolders.rowCount === 0) {
      return res.json({
        success: true,
        message: "No sub folders",
        isNull: true,
      });
    }
    return res.json({
      success: true,
      message: "Sub Folders Retrieved successfully",
      childFolders: allChildFolders.rows,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong please try again later",
    });
  }
};

const setCurrentFolder = async (req: Request, res: Response) => {
  const { folder_id, parent_id } = req.body;
  if (parent_id) {
    try {
      await pool.query(
        "INSERT INTO selected_folder_for_canva(folder_id,parent_id) VALUES ($1::int,$2::int)",
        [folder_id, parent_id]
      );
      return res.json({
        success: true,
        message: "Folder selected",
      });
    } catch (error) {
      console.log(error);
      return res.json({
        success: false,
        message: "Something went wrong please try again later",
      });
    }
  }
  try {
    await pool.query(
      "INSERT INTO selected_folder_for_canva(folder_id) VALUES ($1::int)",
      [folder_id]
    );
    return res.json({
      success: true,
      message: "Folder selected",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong please try again later",
    });
  }
};

// Function for getting folders and designs for the sub folder page instead of getting for hierarchy
const getSubFolders = async (req: Request, res: Response) => {
  const { folderId } = req.body;
  try {
    const allFolders = await Folder.select([
      "folder_id",
      "folder_name",
      "created_at",
    ])
      .where("parent_id", "=", folderId)
      .get();
    const allDesigns = await Design.select(["design_url"])
      .where("folder_id", "=", folderId)
      .get();
    return res.json({
      success: true,
      allFolders,
      allDesigns,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong please try again later",
    });
  }
};

const getDesignsByFolder = async (req: Request, res: Response) => {
  const { folderName } = req.body;
  try {
    const [{ folder_id }] = await Folder.select(["folder_id"])
      .where("folder_name", "=", folderName)
      .get();
    if (!folder_id) {
      return res.json({
        success: false,
        message: "No folder exist with the provided name",
      });
    }
    const allDesigns = await Design.select(["design_url"])
      .where("folder_id", "=", folder_id)
      .get();
    return res.json({
      success: true,
      allDesigns: allDesigns,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong please try again later!",
    });
  }
};

module.exports = {
  getAllFolders,
  createNewFolder,
  getChildFolders,
  setCurrentFolder,
  getSubFolders,
  getDesignsByFolder,
};
