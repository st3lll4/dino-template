export type TargetBrowser = "chrome-mv3" | "firefox-mv2" | "firefox-mv3";

export type HmrOptions = {
  browser?: TargetBrowser;
  wsPort?: number;
  devPort?: number;
};

export type ServerToExtensionEvent =
  | { event: "background-updated" }
  | { event: "content-updated"; scriptId: string }
  | { event: "full-reload" };

export type ExtensionToServerEvent =
  | { event: "ext:ready" }
  | { event: "ext:error"; message: string };

export type IconMap = Record<string, string>;

export type ActionConfig = {
  default_popup?: string;
  default_icon?: IconMap;
};

export type SourceManifest = {
  manifest_version: 2 | 3;
  name: string;
  version: string;
  description?: string;
  icons?: IconMap;
  action?: ActionConfig;
  browser_action?: ActionConfig;
  options_ui?: { page: string; open_in_tab?: boolean };
  background?: {
    service_worker?: string;
    type?: "module";
    scripts?: string[];
    persistent?: boolean;
  };
  content_scripts?: Array<{
    js: string[];
    matches: string[];
    run_at?: string;
    css?: string[];
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
    gecko?: { id: string; strict_min_version?: string };
  };
  [key: string]: unknown;
};
