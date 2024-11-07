
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
    // TODO: Also query for the highest rated 'representation' and if the
    // score is high enough, use the entity data from that instead.
    let reqData = {
      req: "ent",
      id: entID,
      m: 65535,
      s: 0,
    };
    DBRequestManager.query(reqData, (result) => {
      let [datatype, defStr, len, creatorID] = result[0] ?? [];
      let isContained = (len <= 65535); 
      callback(datatype, defStr, len, creatorID, isContained);
    });
  }



  static fetchEntityList(userID, scaleID, callback) {
    let reqData = {
      req: "entList",
      u: userID,
      s: scaleID,
      n: 4000,
      o: 0,
      a: 0,
    };
    DBRequestManager.query(reqData, (entList) => {
      callback(entList);
    });
  }

  static fetchEntityListFromDefStr(userID, scaleDefStr, callback) {
    let reqData = {
      req: "entListFromDefStr",
      u: userID,
      d: scaleDefStr,
      n: 4000,
      o: 0,
      a: 0,
    };
    DBRequestManager.query(reqData, (result) => {
      let scaleID = result[0][1];
      let entList = result.slice(1);
      callback(entList, scaleID);
    });
  }




};