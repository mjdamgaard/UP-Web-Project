import * as querystring from 'querystring';
import * as url from 'url';

import {Error} from "../err/errors.js";



export class InputGetter {

  static getParamsPromise(req, paramNameArr, defaultValArr) {
    return new Promise((resolve, reject) => {
      this.#getParamsPromiseHelper(
        req, paramNameArr, defaultValArr, resolve, reject
      );
    });
  }

  static #getParamsPromiseHelper(
    req, paramNameArr, defaultValArr, resolve, reject
  ) {
    let body;

    if (req.method === 'POST') {
      let data = '';
      req.on('data', chunk => {
        data += chunk.toString();
        if (data.length > 10000) reject(
          new Error("Post data maximum size exceeded")
        );
      });
      req.on('end', () => {
        try {
          body = JSON.parse(data);
        } catch (err) {
          try {
            body = querystring.parse(data);
          } catch (err) {
            reject(new Error("Ill-formed POST data"));
          }
        }
      });
    }
    else if (req.method === 'GET') {
      try {
        body = url.parse(decodeURI(req.url), true).query;
      } catch (err) {
        reject(new Error("Ill-formed URL"));
      }
    } else {
      reject(new Error("Only accepts POST and GET requests"));
    }

    let paramValArr = [];
    let receivedParamNames = Object.keys(body);
    paramNameArr.forEach((name, ind) => {
      if (!receivedParamNames.includes(name)) {
        let defaultVal = defaultValArr[ind];
        if (defaultVal === undefined) {
          reject(new Error("Missing mandatory parameter: " + name));
        } else {
          paramValArr[ind] = defaultVal.toString();
        }
      } else {
        if (typeof body[name] !== "string") {
          reject(new Error("Received same parameter twice"));
        }
        paramValArr[ind] = body[name];
      }
    });

    resolve(paramValArr);
  }
}