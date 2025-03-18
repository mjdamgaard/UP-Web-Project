import * as querystring from 'querystring';
import * as url from 'url';

import {ClientError} from "../err/errors.js";



export class InputGetter {

  constructor(req) {
    this.req = req;
    this.bodyPromise = new Promise((resolve, reject) => {
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
          } catch (err) {
            try {
              resolve(querystring.parse(data));
            } catch (err) {
              reject(new ClientError("Ill-formed POST data"));
            }
          }
        });
      }
      else if (req.method === 'GET') {
        try {
          resolve(url.parse(decodeURI(req.url), true).query);
        } catch (err) {
          reject(new ClientError("Ill-formed URL"));
        }
      }
      else {
        reject(new ClientError("Only accepts POST and GET requests"));
      }
    });
  }

  static async getParamsPromise(paramNameArr, defaultValArr) {
    let paramValArr = [];
    let body = await this.bodyPromise;
    let receivedParamNames = Object.keys(body);
    paramNameArr.forEach((name, ind) => {
      if (!receivedParamNames.includes(name)) {
        let defaultVal = defaultValArr[ind];
        if (defaultVal === undefined) {
          throw new ClientError("Missing mandatory parameter: " + name);
        } else {
          paramValArr[ind] = defaultVal.toString();
        }
      } else {
        if (typeof body[name] !== "string") {
          throw new ClientError("Received same parameter twice");
        }
        paramValArr[ind] = body[name];
      }
    });

    return paramValArr;
  }

}