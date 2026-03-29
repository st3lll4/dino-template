export type TargetBrowser = "chrome" | "firefox";

export type HmrOptions = {
  browser?: TargetBrowser;
  wsPort?: number;
  devPort?: number;
};

export type ServerToExtensionEvent =
  | { event: "background-updated" }
  | { event: "content-updated" };

export type ExtensionToServerEvent =
  | { event: "ext:ready" }
  | { event: "ext:error"; message: string };

export type IconMap = Record<string, string>;

export type ActionConfig = {
  default_popup?: string;
  default_icon?: IconMap;
};

export type SourceManifest = {
  manifest_version: 3;
  name: string;
  version: string;
  description?: string;
  icons?: IconMap;
  action?: ActionConfig;
  options_ui?: { page: string; open_in_tab?: boolean };
  background?: {
    service_worker?: string;
    type?: "module";
    scripts?: string[];
    page?: string;
  };
  content_scripts?: Array<{
    js: string[];
    matches: string[];
    run_at?: string;
    css?: string[];
    type?: "module";
  }>;
  permissions?: string[];
  host_permissions?: string[];
  web_accessible_resources?:
    | Array<{ resources: string[]; matches: string[] }>
    | string[];
  content_security_policy?:
    | string
    | { extension_pages?: string; sandbox?: string };
  side_panel?: { default_path: string };
  browser_specific_settings?: {
    gecko?: {
      id: string;
      strict_min_version?: string;
      data_collection_permissions?: {
        required: string[];
        optional: string[];
      };
    };
  };
  [key: string]: unknown;
};
