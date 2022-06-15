export interface corporateObjectInterface {
  corporate_type: string;
  location?: string;
  website_url: string;
  corporate_email: string;
  corporate_name: string;
}

export type corporateDbColsEnum =
  | "corporate_type"
  | "location"
  | "website_url"
  | "corporate_email"
  | "corporate_name";

export type branchDbColsEnum =
  | "branch_email"
  | "branch_name"
  | "corporate_id"
  | "location"
  | "branch_email"
  | "website_url";

export type loDbColsEnum =
  | "lo_name"
  | "website_url"
  | "lo_email"
  | "location"
  | "branch_id";
export interface branchObjectInterface {
  corporate_id: number;
  branch_name: string;
  location?: string;
  branch_id: number;
  website_url: string;
  branch_email: string;
}

export interface loObjectInterface {
  branch_id: number;
  // corporate_id: number;
  lo_name: string;
  location?: string;
  website_url: string;
  lo_email: string;
}

export interface userObjectInterface {
  user_id: number;
  email: string;
  password: string;
}

export interface folderObjectInterface {
  folder_id: number;
  folder_name: string;
  created_at: Date;
  children?: string[];
}
