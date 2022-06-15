export interface GenericExpressPostRequestInterface<T> extends Express.Request {
  body: T;
}

enum BlogPostStatus {
  "Pending" = 1,
  "Pending Approval",
  "Scheduled",
  "Approved",
}

export interface InterfaceRequestBlog {
  site_id: number;
  site_type: "corporate" | "branch" | "lo";
  post_author?: string;
  post_date?: Date;
  post_data_gmt?: Date;
  post_content: string;
  post_title: string;
  post_status?: string;
  post_excerpt?: string;
  comment_status?: string;
  ping_status?: string;
  post_password?: string;
  post_name: string;
  to_ping?: string;
  pinged?: string;
  post_modified?: Date;
  post_modified_gmt?: Date;
  post_parent?: number;
  guid: string;
  menu_order?: number;
  post_type: string;
  post_mime_type?: string;
  comment_count?: number;
  post_id: number;
  website_url?: string;
  post_meta?: InterFaceRequestBlogPostMeta;
  author_mail: string;
  author_name?:string
  post_status_syndication: BlogPostStatus;
  schedule_post_date: Date;
  author_email?:string|undefined
}

interface InterFaceRequestBlogPostMeta extends Object {
  _elementor_edit_mode: string;
  _elementor_template_type: string;
  _elementor_version: string;
  _elementor_pro_version: string;
  _elementor_data: string;
  _wp_page_template: string;
}

export interface InterfaceRequestCorporate {
  corporate_type: string;
}

export interface InterfaceRequestFolder {
  folder_name: string;
  parent_id?: number;
}
