
import {DBRequestManager} from "../classes/DBRequestManager.js";

// const CLASS_CLASS_METADATA_JSON = JSON.stringify({
//   entID: 1,
//   tmplID: 0,
//   mainProps: {title: "class"},
//   classID: 1,
//   otherPropsLen: 0,
// });




export class DataFetcher {


  static fetchPublicSmallEntity(entID, callback) {
    let reqData = {
      req: "ent",
      id: entID,
      m: 65535,
      s: 0,
    };
    DBRequestManager.query(reqData, (result) => {
      let [datatype, defStr, len] = result[0] ?? [];
      let isContained = (len <= 65535); 
      callback(datatype, defStr, len, isContained);
    });
  }







};