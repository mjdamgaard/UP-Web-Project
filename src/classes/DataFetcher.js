
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
    let entMainData = {
      entID: entID,
      mainProps: null,
      classID: null,
      tmplID: null,
      entInput: null,
      listInput: null,
      strInput: null,
      otherPropsLen: null,
      template: null,
      isMissing: null,
    };
    let reqData = {
      req: "ent",
      id: entID,
    };
    DBRequestManager.query(reqData, (result) => {
      let [
        classID, tmplID, entInput, listInput, strInput,
        mainProps, otherPropsLen
      ] = result[0] ?? [];

      entMainData.classID = classID;
      entMainData.tmplID = tmplID;
      entMainData.entInput = entInput;
      entMainData.listInput = listInput;
      entMainData.strInput = strInput;
      entMainData.mainProps = mainProps;
      entMainData.otherPropsLen = otherPropsLen;
      entMainData.isMissing = !classID;

      // If entity is missing, call callback immediately and return.
      if (!classID) {
        callback(entMainData);
        return;
      }

      // If entity is has no template, the mainProps is just the fetched
      // mainProps object, and we can call callback already.
      if (tmplID == "0") {
        callback(entMainData);
        return;
      }

      // Else continue by looking up the template and construct the mainProps.
      let reqData = {
        req: "ent",
        id: entMainData.tmplID,
      };
      DBRequestManager.query(reqData, (result) => {
        let [,,,,,tmplMainProps] = result[0] ?? [];
        entMainData.template = (tmplMainProps ?? {}).template;
        parseAndConstructMainProps(entMainData, callback);
      });
    });
  }







};