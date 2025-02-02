import * as querystring from 'querystring';
import * as url from 'url';

import {endWithError} from "../err/errors.js";



export class InputGetter {

  static getParams (req, res, paramNameArr, defaultValArr) {
    let body;

    if (req.method === 'POST') {
      let data = '';
      req.on('data', chunk => {
        data += chunk.toString();
      });
      req.on('end', () => {
        try {
          body = JSON.parse(data);
        } catch (err) {
          try {
            body = querystring.parse(data);
          } catch (err) {
            endWithError(res, "Ill-formed POST data");
            return false;
          }
        }
      });
    }
    else if (req.method === 'GET') {
      try {
        body = url.parse(req.url, true).query;
      } catch (err) {
        endWithError(res, "Ill-formed URL");
        return false;
      }
    } else {
      endWithError(res, "Only accepts POST and GET requests");
      return false;
    }

    let paramValArr = [];
    try {
      let receivedParamNames = Object.keys(body);
      paramNameArr.forEach((name, ind) => {
        if (!receivedParamNames.includes(name)) {
          let defaultVal = defaultValArr[ind];
          if (!defaultVal) {
            throw "Missing mandatory parameter: " + name;
          } else {
            paramValArr[ind] = defaultVal.toString();
          }
        } else {
          paramValArr[ind] = body[name].toString();
        }
      });
    } catch (err) {
      endWithError(res, err);
      return false;
    }

    return paramValArr;
  }
}