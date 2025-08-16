
// Server module (SM) that allows user to upload a score for a given quality--
// subject pair (i.e. a given "semantic parameter"). The user can also provide
// some additional data along with the score, namely to the "payload" column
// of the relevant BBT table. The "score" part of each row represents the user
// score, and the "payload" part, if provided, should start with the ID of an
// entity of the so-called 'Data format' class. This entity then defines the
// data types and the interpretations of all data strings that follow the
// data format ID. This auxiliary data might for instance by a sigma (STD)
// representing the error of the score, or it might also be a weight factor
// below 1, representing that the user wants their score to count as less then
// what is the standard.

import homePath from "./.id.js";
import {post} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';



export function postUserScore(qualID, subjID, scoreBase64, payloadBase64) {
  checkRequestOrigin(true, [
    "TODO: Add trusted components that can upload user scores."
  ]);

  let userID = getRequestingUserID();
  let listID = qualID + "&" + userID;
  return new Promise(resolve => {
    post(homePath + "/users.bt/_insert/k=" + userID);
    post(
      homePath + "/userScores.bbt/_insert/l=" + listID + "/k=" + subjID +
      "/s=" + scoreBase64 + (payloadBase64 ? "/p=" + payloadBase64 : "")
    ).then(
      wasUpdated => resolve(wasUpdated)
    );
  });
}

