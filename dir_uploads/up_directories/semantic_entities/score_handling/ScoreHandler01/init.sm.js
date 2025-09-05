
import {post} from 'query';
import {fetchEntityID} from "../../entities.sm.js";

const trustedQualIdent = abs("./../em1.js;get/trusted");


// A [([userEntID, weight],)*] array over all the initial moderators, and their
// weights. (This object can be edited.) 
export const initialModerators = [
  // TODO: Insert some initial moderators.
];


export function insertInitialModerators() {
  return new Promise(resolve => {
    fetchEntityID(trustedQualIdent).then(qualID => {
      post(
        abs("./init_mods.bbt") + "/_insertList/l=" + qualID,
        initialModerators
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  });
}