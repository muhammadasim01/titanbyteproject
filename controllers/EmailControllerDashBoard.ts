import { Request, Response } from "express";
import { pool } from "../db/db_config";
import { BlogPost } from "../models/BlogPost";
import { Branch } from "../models/Branch";
import { Corporate } from "../models/Corporate";
import { Lo } from "../models/Lo";
import {
  SEND_GRID_AFFILIATED_BLOG_Social_Corner_Post_EMAIL_TEMPLATE_ID,
  SEND_GRID_AFFILIATED_Mortgage_Minute_Update_EMAIL_TEMPLATE_ID,
  SEND_GRID_AFFILIATED_NEW_GIVE_AWAY_EMAIL_TEMPLATE_ID,
  SEND_GRID_POST_ACTIVITY_TO_SOCIAL_TEMPLATE_ID,
} from "../utils/constants";
import {
  sendEmail,
  sendEmailForActivityApprovalToAuthor,
} from "./EmailController";

const sgMail = require("@sendgrid/mail");
require("dotenv").config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailFromDashBoard = (req: Request, res: Response) => {
  const { site_name, install_name, environment, corporate } = req.body;
  // prepare msg
  const msg = {
    to: "irtisam.d@gmail.com",
    from: "irtisam.d@gmail.com",
    subject: `A new wordpress installation`,
    text: `A new website is created and wordpress is installed in the new site with the following details:
        ${site_name} 
        ${install_name}
        ${environment}
        ${corporate}`,
    html: `<div style="display:'flex';flex-direction:'column'">
    A new website is created and wordpress is installed in the new site with the following details:
    ${site_name} 
    ${install_name}
    ${environment}
    ${corporate}
    </div>
    `,
  };
  sgMail
    .send(msg)
    .then(async () => {
      // get corporate in which new site was created
      const corporate_id = await Corporate.select(["corporate_id"])
        .where("corporate_name", "=", corporate)
        .get();
      // add newly created branch to our db
      await Branch.insert(
        ["branch_name", "corporate_id"],
        [site_name, corporate_id[0].corporate_id]
      );
      return res.json({
        success: true,
        message: "Email Sent",
      });
    })
    .catch((error: Error) => {
      return res.json({
        success: false,
        message: "Email not sent",
      });
    });
};

const emailOnNewActivity = async (req: Request, res: Response) => {
  const {
    affiliateType,
    websiteUrl,
    postID,
    publishDate,
    activityType,
    activityName,
    activityDesc,
    authorName,
    imgSrc,
  } = req.body;

  if (affiliateType === "LO") {
    const loEmail = await Lo.select(["lo_email"])
      .where("Website_url", "=", websiteUrl)
      .get();
    if (loEmail.length !== 0) {
      let templateId = SEND_GRID_POST_ACTIVITY_TO_SOCIAL_TEMPLATE_ID;

      // prepare msg
      const msg = {
        to: 'waqasshahh13@gmail.com',  //loEmail[0].lo_email,
        from: {
          email: "waqasshahh13@gmail.com",
          name: "Affiliated Mortgage",
        },
        templateId,
        dynamic_template_data: {
          activityType,
          activityName,
          activityDesc,
          publishDate,
          authorName,
          authorEmail: loEmail[0].lo_email,
          approveLink: `${websiteUrl}/wp-json/connectexpress/v1/shareonsocials?post_id=${postID}`,
          imgSrc,
        },
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent");
          return res.json({
            success: true,
            message: "Email sent",
          });
        })
        .catch((err: any) => {
          console.log(err.errors);
          console.log(err);
          return res.json({
            success: false,
            message: "Something went wrong please try again later",
          });
        });
    } else {
      return res.json({
        success: false,
        message: "No Lo with the given url found on our records",
      });
    }
    
  } else {
    return res.json({
      success: false,
      message: "Invalid affiliate Type",
    });
  }
  
};

const sendEmailOnBlogPostApproval = async (req: Request, res: Response) => {
  const { post_title_query, author_name } = req.body;

  // get Corporate for the current branch
  // const corporateQuery = `
  //  SELECT corporate_id,website_url,corporate_email
  //  FROM corporate
  //  WHERE corporate_id=(
  //    SELECT corporate_id
  //    FROM
  //    branch
  //    WHERE branch_id=$1
  //  )
  //  `;
  // const corporateDetails = await pool.query(corporateQuery, [site_id]);
  // if (corporateDetails.rows.length !== 0) {
  //   // await sendEmail(
  //   //   corporateDetails.rows[0].corporate_id,
  //   //   corporateDetails.rows[0].corporate_email,
  //   //   corporateDetails.rows[0].website_url,
  //   //   post_title,
  //   //   guid,
  //   //   true
  //   // )
  //   //   .then((result) => {
  //   //     console.log(result);
  //   //     console.log("Email Sent to Corporate");
  //   //   })
  //   //   .catch((err) => {
  //   //     console.log(err);
  //   //   });
  // }
  // get all the Lo's for the branch from which blog came
  const los = await Lo.select(["*"]).where("branch_id", "=", 8).get();
  if (los) {
    const titleWithoutDashes = (post_title_query as string)?.replace(/-/g, " ");
    const [{ post_title, guid, schedule_post_date }] = await BlogPost.select([
      "post_title",
      "guid",
      "schedule_post_date",
    ])
      .where("post_title", "=", titleWithoutDashes)
      .get();
    if (schedule_post_date) {
      try {
        await pool.query(
          "UPDATE blog_post SET post_status_syndication=$1 WHERE post_title=$2",
          ["3", titleWithoutDashes]
        );
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        await pool.query(
          "UPDATE blog_post SET post_status_syndication=$1 WHERE post_title=$2",
          ["4", titleWithoutDashes]
        );
      } catch (error) {
        console.log(error);
      }
    }
    // async send emails to all the Lo's for blog confirmation
    for await (let singleLo of los) {
      const { lo_id, website_url, lo_email } = singleLo;
      // send email to current iterated lo
      await sendEmail(
        lo_id,
        lo_email,
        website_url,
        titleWithoutDashes,
        guid,
        author_name,
        schedule_post_date
      )
        .then((result) => {
          console.log("Email Sent");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
  return res.end();

  // if (site_type === "corporate") {
  //         let branch_id_single;
  //         // get all branches to send emails to
  //         const branches = await Branch.select(["*"])
  //           .where("corporate_id", "=", site_id)
  //           .get();
  //         // if branches exist loop through them and send emails
  //         if (branches.length !== 0) {
  //           // async for loop through branches
  //           for await (let singleBranch of branches) {
  //             const { branch_id, branch_email, website_url } = singleBranch;
  //             branch_id_single = branch_id;
  //             // async send email to current iteration of branch
  //             // await sendEmail(
  //             //   branch_id,
  //             //   branch_email,
  //             //   website_url,
  //             //   post_title,
  //             //   guid,
  //             //   true,
  //             //   true
  //             // )
  //             //   .then((result) => {
  //             //     console.log("Email sent to branch");
  //             //   })
  //             //   .catch((err) => {
  //             //     console.log(err);
  //             //   });
  //           }
  //         }
  //         // get all the Lo's for the branch from which blog came
  //         const data = await Lo.select(["*"])
  //           .where("branch_id", "=", branch_id_single)
  //           .get();
  //         if (data) {
  //           // async send emails to all the Lo's for blog confirmation
  //           // for await (let singleAffiliate of data as Array<emailDataHolderInterface>) {
  //           //   const { lo_id, website_url, lo_email } = singleAffiliate;
  //           //   // send email to current iterated lo
  //           //   await sendEmail(
  //           //     lo_id,
  //           //     lo_email,
  //           //     website_url,
  //           //     post_title,
  //           //     guid,
  //           //     false,
  //           //     true
  //           //   )
  //           //     .then((result) => {
  //           //       console.log("Email Sent");
  //           //     })
  //           //     .catch((err) => {
  //           //       console.log(err);
  //           //     });
  //           // }
  //         }
  //         return res.end();
  //       } else if (site_type === "branch") {
  //         // get Corporate for the current branch
  //         const corporateQuery = `
  //             SELECT corporate_id,website_url,corporate_email
  //             FROM corporate
  //             WHERE corporate_id=(
  //               SELECT corporate_id
  //               FROM
  //               branch
  //               WHERE branch_id=$1
  //             )
  //             `;
  //         const corporateDetails = await pool.query(corporateQuery, [site_id]);
  //         if (corporateDetails.rows.length !== 0) {
  //           // await sendEmail(
  //           //   corporateDetails.rows[0].corporate_id,
  //           //   corporateDetails.rows[0].corporate_email,
  //           //   corporateDetails.rows[0].website_url,
  //           //   post_title,
  //           //   guid,
  //           //   true
  //           // )
  //           //   .then((result) => {
  //           //     console.log(result);
  //           //     console.log("Email Sent to Corporate");
  //           //   })
  //           //   .catch((err) => {
  //           //     console.log(err);
  //           //   });
  //         }
  //         // get all the Lo's for the branch from which blog came
  //         const los = await Lo.select(["*"])
  //           .where("branch_id", "=", site_id)
  //           .get();
  //         if (los) {
  //           // async send emails to all the Lo's for blog confirmation
  //           for await (let singleLo of los as Array<emailDataHolderInterface>) {
  //             const { lo_id, website_url, lo_email } = singleLo;
  //             // send email to current iterated lo
  //             // await sendEmail(lo_id, lo_email, website_url, post_title, guid)
  //             //   .then((result) => {
  //             //     console.log("Email Sent");
  //             //   })
  //             //   .catch((err) => {
  //             //     console.log(err);
  //             //   });
  //           }
  //         }
  //         return res.end();
  //       } else if (site_type === "lo") {
  //         //get Lo Branch
  //         const loBranchQuery = `
  //             SELECT branch_id,branch_email,website_url
  //             FROM branch
  //             WHERE branch_id=(
  //               SELECT branch_id
  //               FROM
  //               lo
  //               WHERE lo_id=$1
  //               LIMIT 1
  //             )
  //             `;
  //         const branchDetails = await pool.query(loBranchQuery, [site_id]);

  //         if (branchDetails.rows.length !== 0) {
  //           const { branch_id, branch_email, website_url } =
  //             branchDetails.rows[0];
  //           await sendEmail(
  //             branch_id,
  //             branch_email,
  //             website_url,
  //             post_title,
  //             guid,
  //             true
  //           )
  //             .then(async (result) => {
  //               // get branch corporate
  //               const corporateQuery = `
  //                 SELECT corporate_id,website_url,corporate_email
  //                 FROM corporate
  //                 WHERE corporate_id=(
  //                   SELECT corporate_id
  //                   FROM
  //                   branch
  //                   WHERE branch_id=$1
  //                 )
  //                 `;
  //               const corporateDetails = await pool.query(corporateQuery, [
  //                 branch_id,
  //               ]);
  //               if (corporateDetails.rows.length !== 0) {
  //                 const { corporate_id, website_url, corporate_email } =
  //                   corporateDetails.rows[0];
  //                 await sendEmail(
  //                   corporate_id,
  //                   corporate_email,
  //                   website_url,
  //                   post_title,
  //                   guid,
  //                   true
  //                 )
  //                   .then(() => {
  //                     console.log("Email Sent");
  //                   })
  //                   .catch((err) => {
  //                     console.log(err);
  //                   });
  //               }
  //               // get all other los of the branch of the lo from where blog post was uploaded
  //               const otherBranchLosQuery = `
  //                 SELECT lo_id,lo_email,website_url
  //                 FROM
  //                 lo
  //                 WHERE branch_id=$1 AND lo_id <> $2
  //                 `;
  //               const otherBranchLos = await pool.query(otherBranchLosQuery, [
  //                 branch_id,
  //                 site_id,
  //               ]);
  //               if (otherBranchLos.rows.length !== 0) {
  //                 for await (let singleLo of otherBranchLos.rows as Array<emailDataHolderInterface>) {
  //                   const { lo_id, website_url, lo_email } = singleLo;
  //                   // send email to current iterated lo
  //                   await sendEmail(
  //                     lo_id,
  //                     lo_email,
  //                     website_url,
  //                     post_title,
  //                     guid
  //                   )
  //                     .then((result) => {
  //                       console.log("Email Sent");
  //                     })
  //                     .catch((err) => {
  //                       console.log(err);
  //                     });
  //                 }
  //               }
  //               return res.end();
  //             })
  //             .catch((err) => {
  //               console.log(err);
  //             });
  //         }
  //         return res.end();
  //       } else {
  //         return res.json({
  //           success: false,
  //           message: "Something went wrong please try again later!",
  //         });
  //       }
};

const sendEmailForActivityApproval = async (req: Request, res: Response) => {
  try {
    const {
      post_id,
      author_email,
      post_title,
      guid,
      website_url,
      activityDesc,
      activityCover,
      activityType,
      publish_date,
      authorName,
    } = req.body;
    console.log(req.body);

    await sendEmailForActivityApprovalToAuthor(
      author_email,
      post_title,
      post_id as number,
      guid,
      activityDesc,
      activityCover,
      activityType,
      publish_date,
      authorName
    )
      .then((result) => {
        console.log("Email sent to Author");
      })
      .catch((err) => {
        console.log(err);
      });
    return res.json({
      success: true,
      message:
        "Activity Uploaded SUccessfully and the Email has been sent to the concerned Author",
    });
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

module.exports = {
  sendEmailFromDashBoard,
  emailOnNewActivity,
  sendEmailOnBlogPostApproval,
  sendEmailForActivityApproval,
};
