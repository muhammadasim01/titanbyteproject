import axios from "axios";
import { Request, Response } from "express";
import { Branch } from "../models/Branch";
import { Lo } from "../models/Lo";

const addNewLo = async (req: Request, res: Response) => {
  const { website_url, branch_url, lo_name, lo_email } = req.body;

  Branch.where("website_url", "=", branch_url)
    .get()
    .then(async (result) => {
      console.log(result);

      const branch_id = result[0].branch_id;
      try {
        await Lo.insert(
          ["branch_id", "website_url", "lo_email", "lo_name"],
          [branch_id, `https://${website_url}`, lo_email, lo_name]
        );
        await axios
          .post(
            `https://${branch_url}/?rest_route=/connectexpress/v1/createnewlosite`,
            {
              site_url: "/",
              site_title: lo_name,
              domain: website_url,
            }
          )
          .then((response) => {
            return res.json({
              success: true,
              message: "New Lo Added Successfully",
              data: response.data,
            });
          })
          .catch((error) => {
            console.log(error);
            return res.json({
              success: false,
              message: error.message,
            });
          });
      } catch (error) {
        console.log(error);
        return res.json({
          success: false,
          message: error.message,
        });
      }
    })
    .catch((error) => {
      console.log(error);
      return res.json({
        success: false,
        message: error.message,
      });
    });
};

module.exports = { addNewLo };
