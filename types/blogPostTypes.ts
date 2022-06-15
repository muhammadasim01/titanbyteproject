export type blogPostMetaType =
  | "post_id"
  | "_elementor_edit_mode"
  | "_elementor_template_type"
  | "_elementor_version"
  | "_elementor_pro_version"
  | "_elementor_data"
  | "_wp_page_template"
  | "_yoast_fb_title"
  | "_yoast_fb_desc"
  | "_yoast_fb_image"
  | "_yoast_fb_image_id";

export enum blogPostSyndicationStatus{
"Pending"=1,
"Pending Approval",
"Approved"
}