
import {post} from 'query';
import {checkAdminPrivileges} from 'request';
import {getNodeID} from 'route';
import {postConstructedEntity, postAllEntitiesFromModule} from
  "../../semantic_entities/entities.js";
import placeholders from "~/placeholders.js";

const upNodeID = getNodeID();
const {this: {
  directories: {
    "base_app": baseAppDirID,
    "app_browser": appBrowserDirID,
    "file_browser": fileBrowserDirID,
    "base_app_01": baseApp01DirID,
    "flip_game": flipGameDirID,
    "flip_game_01": flipGame01DirID,
    "untrusted_example": untrustedAppDirID,
  },
}} = placeholders;


export function _init_1() {
  checkAdminPrivileges();

  return Promise.all([
    postAllEntitiesFromModule(abs("~/../semantic_entities/em1.js")),
    postAllEntitiesFromModule(abs("~/../semantic_entities/em2.js")),
    postAllEntitiesFromModule(abs("~/../semantic_entities/em3.js")),
  ]);
}


export async function _init_2() {
  checkAdminPrivileges();

  let em3Path = abs("~/../semantic_entities/em3.js");
  await Promise.all([
    postConstructedEntity(em3Path, "App", [upNodeID, baseAppDirID]),
    postConstructedEntity(em3Path, "App", [upNodeID, appBrowserDirID]),
    postConstructedEntity(em3Path, "App", [upNodeID, fileBrowserDirID]),
    postConstructedEntity(em3Path, "App", [upNodeID, baseApp01DirID]),
    postConstructedEntity(em3Path, "App", [upNodeID, flipGameDirID]),
    postConstructedEntity(em3Path, "App", [upNodeID, flipGame01DirID]),
    postConstructedEntity(em3Path, "App", [upNodeID, untrustedAppDirID]),
  ]);

  let insertTCRouteSubstr = "./apps/trustClasses.att./_insert/k/";
  await Promise.all([
    post(abs(insertTCRouteSubstr + baseAppDirID),     "trusted"),
    post(abs(insertTCRouteSubstr + appBrowserDirID),  "trusted"),
    post(abs(insertTCRouteSubstr + fileBrowserDirID), "semi-trusted"),
    post(abs(insertTCRouteSubstr + baseApp01DirID),   "trusted"),
    post(abs(insertTCRouteSubstr + flipGameDirID),   "semi-trusted"),
    post(abs(insertTCRouteSubstr + flipGame01DirID),   "semi-trusted"),
    // No post for untrustedAppDirID.
  ]);
}