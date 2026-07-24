
import {post} from 'query';
import {postConstructedEntity} from "../../semantic_entities/entities.js";
import placeholders from "~/placeholders.js";

const {
  this: {directories: {
    "base_app": baseAppDirID,
    "app_browser": appBrowserDirID,
    "file_browser": fileBrowserDirID,
  }},
} = placeholders;


export async function _init_1() {
  let em3Path = abs("~/../semantic_entities/em3.js");
  await Promise.all([
    postConstructedEntity(em3Path, "App", [baseAppDirID]),
    postConstructedEntity(em3Path, "App", [appBrowserDirID]),
    postConstructedEntity(em3Path, "App", [fileBrowserDirID]),
  ]);

  let insertTCRouteSubstr = "./apps/trustClasses.att./_insert/k/";
  await Promise.all([
    post(abs(insertTCRouteSubstr + baseAppDirID),     "trusted"),
    post(abs(insertTCRouteSubstr + appBrowserDirID),  "trusted"),
    post(abs(insertTCRouteSubstr + fileBrowserDirID), "trusted"),
  ]);
}