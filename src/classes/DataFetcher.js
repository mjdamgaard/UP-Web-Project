
import {DBRequestManager} from "../classes/DBRequestManager.js";

// const CLASS_CLASS_METADATA_JSON = JSON.stringify({
//   entID: 1,
//   tmplID: 0,
//   mainProps: {title: "class"},
//   classID: 1,
//   otherPropsLen: 0,
// });




export class DataFetcher {


  static fetchPublicEntity(entID, callback) {
    let reqData = {
      req: "ent",
      id: entID,
    };
    DBRequestManager.query(reqData, (result) => {
      let [def, len] = result[0] ?? [];
      callback(def, len);
    });
  }







};