import * as querystring from 'querystring';
import * as url from 'url';

import {ClientError} from "../err/errors.js";



export class InputGetter {

  static getBodyPromise(req) {
    return new Promise((resolve, reject) => {
      if (req.method === 'POST') {
        let data = '';
        req.on('data', chunk => {
          data += chunk.toString();
          if (data.length > 10000) reject(
            new ClientError("Post data maximum size exceeded")
          );
        });
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          }
          catch (err) {
            try {
              resolve(querystring.parse(data));
            }
            catch (err) {
              reject(new ClientError("Ill-formed POST data"));
            }
          }
        });
      }
    });
  }

  static async getParamsPromise(body, paramNameArr, defaultValArr) {
    let paramValArr = [];
    let receivedParamNames = Object.keys(body);
    paramNameArr.forEach((name, ind) => {
      if (!receivedParamNames.includes(name)) {
        let defaultVal = defaultValArr[ind];
        if (defaultVal === undefined) {
          throw new ClientError("Missing mandatory parameter: " + name);
        }
        else {
          paramValArr[ind] = defaultVal.toString();
        }
      }
      else {
        // if (typeof body[name] !== "string") {
        //   throw new ClientError("Received same parameter twice");
        // }
        paramValArr[ind] = body[name];
      }
    });

    return paramValArr;
  }

}