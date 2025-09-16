
// Server module (SM) that allows user to upload a score for a given quality--
// subject pair. The user can also provide some additional data along with the
// score, namely to the "payload" column of the relevant BBT table. The "score"
// part of each row represents the user score, and the "payload" part, if
// provided, should start with the ID of an entity of the so-called 'Data
// format' class. This entity then defines the data types and the
// interpretations of all data strings that follow the data format ID.
// This auxiliary data might for instance by a sigma (STD) representing the
// error of the score, or it might also be a weight factor below 1,
// representing that the user wants their score to count as less then what is
// the standard.

import homePath from "./.id.js";
import {post, upNodeID} from 'query';
import {checkAdminPrivileges} from 'request';
import {fetchEntityDefinition, fetchEntityID} from "./entities.js";



export function uploadInitialEntities() {
  // Only the admin can call this SMF (from a program such as update.dir.js,
  // and not from an UP app).
  checkAdminPrivileges();

  // TODO: Continue.
}



export function postScoresFromInitialModerators() {
  // Only the admin can call this SMF..
  checkAdminPrivileges();

  // TODO: Continue.
}
