
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


export function _init_1() {
  checkAdminPrivileges();

  return Promise.all([
    postAllEntitiesFromModule(abs("~/em1.js")),
    postAllEntitiesFromModule(
      abs("~/score_handling/ScoreHandler01/em.js")
    ),
    postAllEntitiesFromModule(abs("~/em2.js")),
    postAllEntitiesFromModule(abs("~/em3.js")),
  ]);
}


export async function _init_2() {
  checkAdminPrivileges();

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