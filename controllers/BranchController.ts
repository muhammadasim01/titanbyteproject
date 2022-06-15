import axios, { AxiosResponse } from "axios";
import { Request, Response } from "express";
import { pool } from "../db/db_config";
import { BlogPost } from "../models/BlogPost";
import { Branch } from "../models/Branch";
import { Corporate } from "../models/Corporate";
import { Lo } from "../models/Lo";
import { PostMeta } from "../models/PostMeta";
import {
  branchObjectInterface,
  loDbColsEnum,
  loObjectInterface,
} from "../types/dbObjectsTypes";
import {
  affiliatesListInterface,
  emailDataHolderInterface,
} from "../types/generalTypes";
import {
  GenericExpressPostRequestInterface,
  InterfaceRequestBlog,
} from "../types/requestTypes";
import { blogPostMetaType } from "../types/blogPostTypes";
import { SiteType } from "../types/siteTypes";
import { sendEmail, sendEmailToSelectedAuthor } from "./EmailController";

// Function for handling add new branch to server from the dashboard add branch to server page
const createNewBranch = (req: Request, res: Response) => {
  const { branch_email, location, branch_id }: branchObjectInterface = req.body;
  Branch.update<{ branch_email: string; location: string | undefined }>(
    { branch_email, location },
    [branch_email, location],
    "branch_id",
    branch_id
  )
    .then(async (data) => {
      try {
        // get all affiliated sites
        const allAffiliates: AxiosResponse = await axios.get(
          `https://${data[0].website_url}/?rest_route=/connectexpress/v1/getsites/`
        );
        if (allAffiliates.data.length === 0) {
          return res.json({
            success: true,
            message: "no affiliates related to the site created.",
          });
        }
        for await (let lo of allAffiliates.data as Array<affiliatesListInterface>) {
          try {
            await Lo.insert<loDbColsEnum, loObjectInterface>(
              ["branch_id", "lo_email", "lo_name", "location", "website_url"],
              [
                data.branch_id,
                lo.admin_email,
                lo.site_name,
                "Islamabad",
                lo.website_url,
              ]
            );
          } catch (error) {
            console.log(error);
            return res.json({
              success: false,
              message: error,
            });
          }
        }
      } catch (error) {
        console.log(error);
        return res.json({
          success: false,
          message: error,
        });
      }

      return res.json({
        success: true,
        message: "Added all the Los for the created branch",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.json({
        success: false,
        message: err,
      });
    });
};

// function for storing a blog coming from wp to our own db
const postBlogToDb = async (
  req: GenericExpressPostRequestInterface<InterfaceRequestBlog>,
  res: Response
) => {
  const { post_meta } = req.body;

  delete req.body.post_meta;
  const {
    site_id,
    site_type,
    post_content,
    website_url,
    post_title,
    guid,
    author_mail,
    post_status_syndication,
    schedule_post_date,
    author_email,
    author_name,
  } = req.body;

  if (!site_id || !post_content) {
    return res.json({
      success: false,
    });
  }

  // check if the url is corporate or branch
  // const isCorporate = await Corporate.select(["corporate_id"])
  //   .where("website_url", "=", website_url)
  //   .get();

  // // if its a corporate send email to all branches and Lo's
  // if (site_type === "corporate") {
  //  delete website url from request body because our db doesn't have that column
  delete req.body.website_url;
  delete req.body.author_email;
  delete req.body.author_name;
  console.log(req.body);

  // prepare data for insertion in our db
  // get keys from req.body and store in the variable
  const blog_post_columns_names = Object.keys(req.body);
  // get values from req.body keys and store in the variable
  const blog_post_columns_values = Object.values(req.body);
  // Insert Blog from remote source to our db
  BlogPost.insert<InterfaceRequestBlog, string | number>(
    blog_post_columns_names as unknown as InterfaceRequestBlog[],
    blog_post_columns_values
  )
    .then(async (result) => {
      try {
        if (post_meta) {
          // Insert Post meta so elementor styles can be shown in wordpress front end
          await PostMeta.insert<blogPostMetaType, string | number>(
            [
              "post_id",
              "_elementor_edit_mode",
              "_elementor_template_type",
              "_elementor_version",
              "_elementor_pro_version",
              "_elementor_data",
              "_wp_page_template",
            ],
            [
              result.blog_post_id,
              post_meta._elementor_edit_mode,
              post_meta._elementor_template_type,
              post_meta._elementor_version,
              post_meta._elementor_pro_version,
              post_meta._elementor_data,
              post_meta._wp_page_template,
            ]
          );
        }
      } catch (error) {
        console.log(error);
        return res.send(error);
      }
      try {
        // send email to the selected author
        await sendEmailToSelectedAuthor(
          author_email as string,
          post_title,
          guid,
          website_url as string,
          author_name as string,
          schedule_post_date as unknown as string
        )
          .then((result) => {
            console.log("Email sent to Author");
          })
          .catch((err) => {
            console.log(err.response.body);
          });
        return res.json({
          success: true,
          message:
            "Blog Post Added Successfully And Email has been sent to the concerned Author",
        });
      } catch (err) {
        console.log(err);
        return res.send(err);
      }
    })
    .catch((err) => {
      console.log(err);
      return res.send(err);
    });
  // }
  // // if its not corporate send email only to Lo's
  // else {
  //   //  delete website url from request body because our db doesn't have that colum
  //   delete req.body.website_url;
  //   // prepare data for insertion in our db
  //   // get keys from req.body and store in the variable
  //   const blog_post_columns_names = Object.keys(req.body);
  //   // get values from req.body keys and store in the variable
  //   const blog_post_columns_values = Object.values(req.body);
  //   // Insert Blog from remote source to our db
  //   BlogPost.insert(blog_post_columns_names, blog_post_columns_values)
  //     .then(async (result) => {
  //       try {
  //         // Insert Post meta so elementor styles can be shown in wordpress front end
  //         await PostMeta.insert(
  //           [
  //             "post_id",
  //             "_elementor_edit_mode",
  //             "_elementor_template_type",
  //             "_elementor_version",
  //             "_elementor_pro_version",
  //             "_elementor_data",
  //             "_wp_page_template",
  //             "_yoast_fb_title",
  //             "_yoast_fb_desc",
  //             "_yoast_fb_image",
  //             "_yoast_fb_image_id",
  //           ],
  //           [
  //             result.blog_post_id,
  //             post_meta._elementor_edit_mode,
  //             post_meta._elementor_template_type,
  //             post_meta._elementor_version,
  //             post_meta._elementor_pro_version,
  //             post_meta._elementor_data,
  //             post_meta._wp_page_template,
  //             _yoast_fb_title,
  //             _yoast_fb_desc,
  //             _yoast_fb_image,
  //             _yoast_fb_image_id,
  //           ]
  //         );
  //       } catch (error) {
  //         console.log(error);
  //         return res.send(error);
  //       }
  //       try {
  //         // get all the Lo's for the branch from which blog came
  //         const data = await Lo.select(["*"])
  //           .where("branch_id", "=", site_id)
  //           .get();
  //         if (data) {
  //           // async send emails to all the Lo's for blog confirmation
  //           for await (let singleAffiliate of data as Array<emailDataHolderInterface>) {
  //             const { lo_id, website_url, lo_email } = singleAffiliate;
  //             // send email to current iterated lo
  //             await sendEmail(lo_id, lo_email, website_url, post_title, guid)
  //               .then((result) => {
  //                 console.log("Email Sent");
  //               })
  //               .catch((err) => {
  //                 console.log(err);
  //               });
  //           }
  //         }
  //         return res.end();
  //       } catch (err) {
  //         console.log(err);
  //         return res.send(err);
  //       }
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       return res.send(err);
  //     });
  // }
};

// get blog Post
// it should have been by title e.g. Name should be getPostByTitle
// but im too lazy to change it now
const getPostByID = async (req: Request, res: Response) => {
  const { post_title } = req.body;
  // if no post exist with the given post title in our db return with status false
  if (!post_title) {
    return res.json({
      success: false,
      message: "No ID provided",
    });
  }

  // get blog post from db to send to the wordpress
  const blog = await BlogPost.select([
    "blog_post_id",
    "post_content",
    "post_name",
    "post_title",
    "post_type",
    "comment_count",
    "comment_status",
    "guid",
    "menu_order",
    "ping_status",
    "pinged",
    "post_author",
    "post_excerpt",
    "post_mime_type",
    "post_parent",
    "post_password",
    "post_status",
    "to_ping",
    "post_status_syndication",
    "schedule_post_date",
  ])
    .where("post_title", "=", post_title.replace(/-/g, " "))
    .get();

  // if no blog post found with the given title in our db return success false
  if (blog.length === 0) {
    return res.json({
      success: false,
      message: "No blog Post found by the given title",
    });
  }

  // change post_status to publish so it will be published instead of getting into drafts
  blog[0] = {
    ...blog[0],
    post_status: "publish",
  };

  // if blog post with the given title is found get post meta data for elementor styles
  const post_meta = await PostMeta.select([
    "_elementor_edit_mode",
    "_elementor_template_type",
    "_elementor_version",
    "_elementor_pro_version",
    "_elementor_data",
    "_wp_page_template",
  ])
    .where("post_id", "=", blog[0].blog_post_id)
    .get();

  // data for fb open graph
  const openGraphData = await PostMeta.select([
    "_yoast_fb_title",
    "_yoast_fb_desc",
    "_yoast_fb_image",
    "_yoast_fb_image_id",
  ])
    .where("post_id", "=", blog[0].blog_post_id)
    .get();

  // send blog and blog post meta data to wordpress
  return res.json({
    success: true,
    blog: blog[0],
    post_meta: post_meta[0],
    openGraphData: openGraphData[0],
  });
};

// end point for getting the site details stored in our records
const getSiteDetails = async (req: Request, res: Response) => {
  // we will get the branch/corporate id by its url
  const { websiteUrl } = req.body;
  // const httpsRemovedUrl = websiteUrl.replace(/^https?:\/\//, "");

  try {
    // check if the website url is a corporate
    const corporate_id = await Corporate.select(["corporate_id"])
      .where("website_url", "=", websiteUrl)
      .get();

    // if corporate with the url exists
    if (corporate_id.length !== 0) {
      return res.json({
        success: true,
        site_id: corporate_id[0].corporate_id,
        site_type: "corporate",
      });
    } else {
      // if no corporate exist with the given url we will check if a branch exist with the given url
      const branch_id = await Branch.select(["branch_id"])
        .where("website_url", "=", websiteUrl)
        .get();
      // if branch exists
      if (branch_id[0]) {
        return res.json({
          success: true,
          site_id: branch_id[0].branch_id,
          site_type: "branch",
        });
      }
      // if no branch exist check for lo
      else {
        const lo_id = await Lo.select(["lo_id"])
          .where("website_url", "=", websiteUrl)
          .get();

        if (lo_id[0]) {
          return res.json({
            success: true,
            site_id: lo_id[0].lo_id,
            site_type: "lo",
          });
        }
      }
    }
    // if any corporate/branch/lo doesn't exist in our db with the provided url return false
    return res.json({
      success: false,
    });
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

const addBranchUrl = async (req: Request, res: Response) => {
  const { site_url, site_name } = req.body;

  try {
    // get branch details for updating the site url
    const branchDetails = await Branch.select(["branch_id"])
      .where("branch_name", "=", site_name)
      .get();
    // if no branch found by the provided site_name stop execution
    if (branchDetails.length === 0) {
      return res.json({
        success: false,
        message: "No branch found in the record with the given site name",
      });
    }
    // update the branch
    Branch.update(
      { website_url: site_url },
      [site_url],
      "branch_id",
      "=",
      branchDetails[0].branch_id,
      "*"
    )
      .then((result) => {
        return res.json({
          success: false,
          message: "Branch updated successfully",
        });
      })
      .catch((err) => {
        console.log(err);
        return res.json({
          success: false,
          message: err.message,
        });
      });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error,
    });
  }
};

// Function for getting all Branches which has no email associated with them
const getBranchesWithoutAssociatedEmail = async (
  req: Request,
  res: Response
) => {
  try {
    const query =
      "SELECT * FROM branch WHERE branch_email IS NULL OR branch_email=''";
    const branchesWithOutEmail = await pool.query(query);
    return res.json({
      success: true,
      branches: branchesWithOutEmail.rows,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error,
    });
  }
};

// Function for getting all the branches
const getAllBranches = async (req: Request, res: Response) => {
  try {
    const allBranches = await Branch.select([
      "branch_name",
      "branch_id",
      "website_url",
    ]).get();
    return res.json({
      success: true,
      allBranches,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error,
    });
  }
};

// Function for updating a post status to approved
const approveAndScheduleBlogPost = async (req: Request, res: Response) => {
  try {
    const { post_title } = req.body;
    await pool.query(
      "UPDATE blog_post SET post_status_syndication=$1 WHERE post_title=$2",
      ["3", post_title]
    );
    return res.json({
      success: true,
      message: "Post status updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error });
  }
};
module.exports = {
  createNewBranch,
  postBlogToDb,
  getPostByID,
  getSiteDetails,
  addBranchUrl,
  getBranchesWithoutAssociatedEmail,
  getAllBranches,
  approveAndScheduleBlogPost,
};
