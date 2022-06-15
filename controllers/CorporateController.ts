import { Request, Response } from "express";
import { Branch } from "../models/Branch";
import { Corporate } from "../models/Corporate";
import { Lo } from "../models/Lo";
import {
  corporateDbColsEnum,
  corporateObjectInterface,
} from "../types/dbObjectsTypes";

// for showing all Corporate
const showAllCorporates = async (req: Request, res: Response) => {
  try {
    const data = await Corporate.all();
    for await (let element of data) {
      element.children = [];
      const branches = await Branch.select()
        .where("branch.corporate_id", "=", element.corporate_id)
        .get();
      element.children.push(branches);
      for await (let branch of branches) {
        branch.children = [];
        const los = await Lo.select()
          .where("lo.branch_id", "=", branch.branch_id)
          .get();
        branch.children.push(los);
      }
    }
    return res.send(data);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

// for handling the creation of a new Corporate
const createNewCorporate = (req: Request, res: Response) => {
  const {
    corporate_email,
    corporate_name,
    corporate_type,
    website_url,
    location,
  }: corporateObjectInterface = req.body;
  Corporate.insert<corporateDbColsEnum, string | number | undefined>(
    [
      "corporate_email",
      "corporate_name",
      "corporate_type",
      "website_url",
      "location",
    ],
    [corporate_email, corporate_name, corporate_type, website_url, location]
  )
    .then((data) => {
      // get all affiliated sites
      return res.send(data);
    })
    .catch((err) => {
      return res.send(err);
    });
};

const getCorporateId = async (req: Request, res: Response) => {
  const { websiteUrl } = req.body;
  console.log(req.body);

  try {
    const corporate_id = await Corporate.select(["corporate_id"])
      .where("website_url", "=", websiteUrl)
      .get();
    if (corporate_id) {
      return res.json({
        success: true,
        corporate_id: corporate_id[0].corporate_id,
      });
    }
    return res.json({
      success: false,
    });
  } catch (error) {
    console.log(error);
    throw new Error(error as unknown as any);
  }
};
module.exports = {
  showAllCorporates,
  createNewCorporate,
  getCorporateId,
};
