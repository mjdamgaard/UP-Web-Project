
import {post} from 'query';
import placeholders from "~/placeholders.js";

const {
  this: {directories: {
    "base_app": baseAppDirID,
    "app_browser": appBrowserDirID,
    "file_browser": fileBrowserDirID,
  }},
} = placeholders;

export async function _init() {
  let insertTCRouteSubstr = "./apps/trustClasses.att./_insert/k/";
  await Promise.all([
    post(abs(insertTCRouteSubstr + baseAppDirID),     "trusted"),
    post(abs(insertTCRouteSubstr + appBrowserDirID),  "trusted"),
    post(abs(insertTCRouteSubstr + fileBrowserDirID), "trusted"),
  ]);
}