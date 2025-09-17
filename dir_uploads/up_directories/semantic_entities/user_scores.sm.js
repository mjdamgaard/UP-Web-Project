
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
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {fetchEntityDefinition, fetchEntityID} from "./entities.js";



export function postUserScoreHex(
  qualKey, subjKey, userKey, scoreHex, payloadHex = undefined
) {
  checkRequestOrigin(true, [
    "TODO: Add trusted components that can upload user scores."
  ]);

  let qualIDProm = fetchEntityID(qualKey);
  let subjIDProm = fetchEntityID(subjKey);
  let userEntIDProm = fetchEntityID(userKey);
  let userEntDefProm = fetchEntityDefinition(userKey);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, userEntIDProm, userEntDefProm
    ]).then(([qualID, subjID, userEntID, userEntDef]) => {
      let userID = userEntDef["User ID"];
      let userUPNodeID = userEntDef["UP Node ID"];
      if (userID !== getRequestingUserID() || userUPNodeID !== upNodeID) {
        resolve(false);
      }
      else {
        let listID = qualID + "&" + userEntID;
        post(homePath + "/users.bt/_insert/k=" + userEntID);
        post(
          homePath + "/userScores.bbt/_insert/l=" + listID + "/k=" + subjID +
          "/s=" + scoreHex + (payloadHex ? "/p=" + payloadHex : "")
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      }
    });
  });
}

