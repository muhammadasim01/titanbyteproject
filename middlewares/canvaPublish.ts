/* MiddleWare responsible for uploading the designs to all the affiliated websites in data base
 This middleware will run after the design has been successfully uploaded to S3 and a response has been sent to canva
 This is to work the extensive operation of getting all the sites and sending all of them the designs in the background
 */

import axios from "axios";
import { Request, Response } from "express";
import { pool } from "../db/db_config";

export default async function postDesignToAffiliatedWebsites(
  req: Request,
  res: Response
) {
  const { s3Url, imageName } = res.locals;
  const client = await pool.connect();
  try {
    /**
     * @TODO change the query to only branch or corporate sites
     * if its enough to implement the designs only on branches
     * As Los can automatically access them
     */
    const queryForGettingAllAffiliatedWebSites = `
    SELECT website_url
    FROM
    corporate
    UNION ALL
    SELECT website_url
    FROM
    branch
    WHERE
    branch_email<>''
    UNION ALL
    SELECT website_url
    FROM 
    lo
    `;
    const allAffiliatedSites = await client.query(
      queryForGettingAllAffiliatedWebSites
    );
    /**
     * @TODO update epochlending plugin code
     */
    console.log(allAffiliatedSites.rows);

    for await (const url of allAffiliatedSites.rows) {
      const { website_url } = url;
      try {
        // const wordPressEndPoint = website_url.includes("http")
        //   ? `${website_url}/?rest_route=/connectexpress/v1/savedesign`
        //   : `https://${website_url}/?rest_route=/connectexpress/v1/savedesign`;
        await axios.post(
          `${website_url}/?rest_route=/connectexpress/v1/savedesign`,
          { url: s3Url, imageName }
        );
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
    return;
  }
}
