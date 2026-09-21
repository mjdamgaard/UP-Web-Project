
import {post} from 'query';
import {checkAdminPrivileges} from 'request';
import {getNodeID} from 'route';
import {postConstructedEntity, postAllEntitiesFromModule} from
  "../../semantic_entities/entities.js";
import {nodeID, directories} from "~/path_map.js";

const {
  "home_app": homeAppDirID,
  "app_browser": appBrowserDirID,
  "file_browser": fileBrowserDirID,
  "home_app_01": homeApp01DirID,
  "flip_game": flipGameDirID,
  "flip_game_01": flipGame01DirID,
  "untrusted_example": untrustedAppDirID,
  "mastermind": mastermindDirID,
  "mastermind_01": mastermind01DirID,
} = directories;


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
    postConstructedEntity(em3Path, "App", [nodeID, homeAppDirID]),
    postConstructedEntity(em3Path, "App", [nodeID, appBrowserDirID]),
    postConstructedEntity(em3Path, "App", [nodeID, fileBrowserDirID]),
    postConstructedEntity(em3Path, "App", [nodeID, homeApp01DirID]),
    postConstructedEntity(em3Path, "App", [nodeID, flipGameDirID]),
    postConstructedEntity(em3Path, "App", [nodeID, flipGame01DirID]),
    postConstructedEntity(em3Path, "App", [nodeID, untrustedAppDirID]),
    postConstructedEntity(em3Path, "App", [nodeID, mastermindDirID]),
    postConstructedEntity(em3Path, "App", [nodeID, mastermind01DirID]),
  ]);

  let insertTCRouteSubstr = "./apps/trustClasses.att/_insert/k/";
  await Promise.all([
    post(abs(insertTCRouteSubstr + homeAppDirID),     "trusted"),
    post(abs(insertTCRouteSubstr + appBrowserDirID),  "trusted"),
    post(abs(insertTCRouteSubstr + fileBrowserDirID), "semi-trusted"),
    post(abs(insertTCRouteSubstr + homeApp01DirID),   "trusted"),
    post(abs(insertTCRouteSubstr + flipGameDirID),   "semi-trusted"),
    post(abs(insertTCRouteSubstr + flipGame01DirID),   "semi-trusted"),
    // No post for untrustedAppDirID.
    post(abs(insertTCRouteSubstr + mastermindDirID),   "semi-trusted"),
    post(abs(insertTCRouteSubstr + mastermind01DirID),   "semi-trusted"),
  ]);
}