
// An admin-only server module for uploading initial entities, as well as some
// initial scores. 

import homePath from "./.id.js";
import {post} from 'query';
import {checkAdminPrivileges} from 'request';
import {map} from 'object';
import * as entityMod1 from "./em1.js";
import * as scoreHandlerEntityMod from "./score_handling/ScoreHandler01/em.js";



export function uploadInitialEntities() {
  // Only the admin can call this SMF (from a program such as update.dir.js,
  // and not from an UP app).
  checkAdminPrivileges();

  // Post all the entities simultaneously, then return a promise that resolves
  // when all the posts has resolved.
  let postPromArr = [
    ...map(entityMod1, (val, alias) => {
      if (val.Class !== undefined) {
        let entPath = homePath + "/em1.js;get/" + alias;
        return post(homePath + "/entities.sm.js/callSMF", entPath);
      }
      else {
        return new Promise(res => res());
      }
    }),
    ...map(scoreHandlerEntityMod, (val, alias) => {
      if (val.Class !== undefined) {
        let entPath = homePath + "/score_handling/ScoreHandler01/em.js;get/" +
          alias;
        return post(homePath + "/entities.sm.js/callSMF", entPath);
      }
      else {
        return new Promise(res => res());
      }
    }),
  ];
  return Promise.all(postPromArr);
}



export function postScoresFromInitialModerators() {
  // Only the admin can call this SMF..
  checkAdminPrivileges();

  // TODO: Continue.
}
