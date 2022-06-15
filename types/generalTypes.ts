export type queryBindings = {
  selects: string[];
  wheres: string[];
  joins: string[];
};

export type emailDataHolderInterface = {
  lo_id: number;
  lo_email: string;
  website_url: string;
};

export type affiliatesListInterface = {
  admin_email: string;
  site_name: string;
  website_url: string;
};
