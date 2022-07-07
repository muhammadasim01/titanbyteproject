import { Request, Response } from "express";

import {
  SEND_GRID_ACTIVITY_APPROVAL_TEMPLATE_ID,
  SEND_GRID_AFFILIATED_BLOG_DYNAMIC_TEMPLATE_ID,
  SEND_GRID_APPROVED_BLOG_POST_TEMPLATE_ID,
  SEND_GRID_EPOCH_BLOG_DYNAMIC_TEMPLATE_ID,
} from "../utils/constants";

const sgMail = require("@sendgrid/mail");
require("dotenv").config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = (
  id: number,
  toEmail: string,
  website_url: string,
  post_title: string,
  post_url: string,
  author_name: string,
  publish_date: string
) => {
  return new Promise<any>((resolve, reject) => {
    // replace spaces with dashes so its easier to pass as query param
    const dashedTitle = post_title.replace(/\s+/g, "-");
    // prepare msg
    const msg = {
      to: toEmail,
      //cc:"nauman12002@gmail.com",
      from: {
        email: "waqasshahh13@gmail.com",
        name: "Affiliated Mortgage",
      },
      templateId: SEND_GRID_APPROVED_BLOG_POST_TEMPLATE_ID,
      dynamic_template_data: {
        postTitle: post_title,
        postLink: post_url,
        authorName: author_name,
        publishDate: publish_date,
        // approeLink: isBranch
        //   ? `https://${website_url}/wp-json/connectexpress/v1/postblog?title=${dashedTitle}`
        //   : `https://affiliatedsd.com/wp-json/connectexpress/v1/postblog?title=${dashedTitle}`,
        approveLink: `https://${website_url}/wp-json/connectexpress/v1/postblog?title=${dashedTitle}`,
      },
    };
    sgMail
      .send(msg)
      .then(() => {
        return resolve("Email sent");
      })
      .catch((error: Error) => {
        return reject(error);
      });
  });
};
export const sendEmailToSelectedAuthor = (
  author_email: string,
  post_title: string,
  post_url: string,
  website_url: string,
  author_name: string,
  publish_date: string
) => {
  return new Promise<any>((resolve, reject) => {
    // replace spaces with dashes so its easier to pass as query param
    const dashedTitle = post_title.replace(/\s+/g, "-");
    // prepare msg
    const msg = {
      to: author_email,
      subject: 'New Blog Approval',
      cc: ['jb@blairallenagency.com', 'mubashar.workmail@gmail.com', 'waqas@blairallenagency.com'],
      from: {
        email: "waqasshahh13@gmail.com",
        name: "Affiliated Mortgage",
      },
      templateId: SEND_GRID_AFFILIATED_BLOG_DYNAMIC_TEMPLATE_ID,
      dynamic_template_data: {
        publishDate: publish_date,
        authorName: author_name,
        postTitle: post_title,
        postLink: post_url,
        postFbLink: "",
        approveLink: `https://affiliatedsd.com/wp-json/connectexpress/v1/scheduleblogpost/?post_title=${dashedTitle}`,
        disApproveLink: `https://affiliatedsd.com/decline-comment/?declined-post-title=${dashedTitle}`,
      },
    };
    sgMail
      .send(msg)
      .then(() => {
        return resolve("Email sent");
      })
      .catch((error: Error) => {
        return reject(error);
      });
  });
};

export const sendEmailForActivityApprovalToAuthor = (
  author_email: string,
  post_title: string,
  post_id: number,
  post_url: string,
  activity_description: string,
  activity_image: string,
  activity_type: string,
  publish_date:string
) => {
  return new Promise<any>((resolve, reject) => {
    // replace spaces with dashes so its easier to pass as query param
    const dashedTitle = post_title.replace(/\s+/g, "-");
    // prepare msg
    const msg = {
      to: author_email,
      cc: ['jb@blairallenagency.com', 'mubashar.workmail@gmail.com', 'waqas@blairallenagency.com'],
      subject: 'New Activity Approval',
      from: {
        email: "waqasshahh13@gmail.com",
        name: "Affiliated Mortgage",
      },
      templateId: SEND_GRID_ACTIVITY_APPROVAL_TEMPLATE_ID,
      dynamic_template_data: {
        postTitle: post_title,
        postLink: post_url,
        authorEmail: author_email,
        activityImage: activity_image,
        activityType: activity_type,
        activityDesc: activity_description,
        publishDate:publish_date,
        approveLink: `https://affiliatedsd.com/wp-json/connectexpress/v1/approveActivity?post_id=${post_id}`,
        declinePostLink: `https://affiliatedsd.com/decline-comment/?declined-post-title=${dashedTitle}`,
      },
    };
    sgMail
      .send(msg)
      .then(() => {
        return resolve("Email sent");
      })
      .catch((error: Error) => {
        return reject(error);
      });
  });
};


export const emailOnNewActivity = (
  affiliateType : string,
  websiteUrl : string,
  postID : string,
  activityType : string,
  activityName : string,
  activityDesc : string,
  authorName : string,
  imgSrc : string
)=> {
  return new Promise<any>((resolve, reject) => {

  if (affiliateType === "LO") {
    const loEmail = Lo.select(["lo_email"])
      .where("website_url", "=", websiteUrl)
      .get();
    if (loEmail !== null) {
      let templateId = SEND_GRID_POST_ACTIVITY_TO_SOCIAL_TEMPLATE_ID;

      // prepare msg
      const msg = {
        to: 'waqas@blairallenagency.com',
        from: {
          email: "waqasshahh13@gmail.com",
          name: "Affiliated Mortgage",
        },
        templateId,
        dynamic_template_data: {
          activityType,
          activityName,
          activityDesc,
          authorEmail: authorName,
          approveLink: `${websiteUrl}/wp-json/connectexpress/v1/shareonsocials?post_id=${postID}`,
          imgSrc,
        },
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent");
          return resolve({
            success: true,
            message: "Email sent",
          });
        })
        .catch((err: any) => {
          console.log(err.errors);
          console.log(err);
          return resolve({
            success: false,
            message: "Something went wrong please try again later",
          });
        });
    }

    return resolve({
      success: false,
      message: "No Lo with the given url found on our records",
    });
  }
  return resolve({
    success: false,
    message: "Invalid affiliate Type",
  });
});
};