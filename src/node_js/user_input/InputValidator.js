
import {endWithError, endWithTypeErrorJSON} from "../err/errors.js";



export class InputValidator {

  static validateParams(res, paramValArr, typeArr, paramNameArr) {
  paramValArr.forEach((paramVal, ind) => {
    this.validateParam(res, paramVal, typeArr[ind], paramNameArr[ind]);
  });

  }


  static validateParam(res, paramVal, type, paramName) {
  let pattern, regExp, n, len;

  switch (type) {
    case "id":
    case "ulong":
      pattern = "/^[1-9][0-9]*|0$/";
      regExp = new RegExp(pattern);
      if (
        !regExp.test(paramVal) ||
        paramVal.length > 20 ||
        paramVal.length == 20 &&
          paramVal > "18446744073709551615"
      ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "BIGINT UNSIGNED"
        );
      }
      break;
    case "uint":
    case "unix_time":
      pattern = "/^[1-9][0-9]*|0$/";
      regExp = new RegExp(pattern);
      if (
        !regExp.test(paramVal) ||
        paramVal.length > 10 ||
        paramVal.length == 10 && paramVal > "4294967295"
      ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "INT UNSIGNED"
        );
      }
      break;
    case "int":
      pattern = "/^-?[1-9][0-9]{0,9}|0$/";
      regExp = new RegExp(pattern);
      n = intval(paramVal);
      if (
        !regExp.test(paramVal) ||
        n < -2147483648 ||
        n > 2147483647
      ) {
        endWithTypeErrorJSON(paramName, paramVal, "INT");
      }
      break;
    case "tint":
    // case "rat":
      pattern = "/^-?[1-9][0-9]{0,2}|0$/";
      regExp = new RegExp(pattern);
      n = intval(paramVal);
      if (
        !regExp.test(paramVal) ||
        n < -128 ||
        n > 127
      ) {
        endWithTypeErrorJSON(paramName, paramVal, "TINYINT");
      }
      break;
    case "bool":
    // case "rat":
      pattern = "/^[01]$/";
      regExp = new RegExp(pattern);
      if (!regExp.test(paramVal)) {
        endWithTypeErrorJSON(paramName, paramVal, pattern);
      }
      break;
    case "utint":
    case "uchar":
    case "rat":
      pattern = "/^[1-9][0-9][0-9]|0$/";
      regExp = new RegExp(pattern);
      n = intval(paramVal);
      if (
        !regExp.test(paramVal) ||
        n < 0 ||
        n > 255
      ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "TINYINT UNSIGNED"
        );
      }
      break;
    case "ushort":
    // case "encoded_rat":
    // case "enc_rat":
      pattern = "/^[1-9][0-9]{0,4}|0$/";
      regExp = new RegExp(pattern);
      n = intval(paramVal);
      if (
        !regExp.test(paramVal) ||
        n > 65535
      ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "SMALLINT UNSIGNED"
        );
      }
      break;
    case "float":
    // TODO: Restricting syntax, unless it's fine..
      pattern =
       "/^\\-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][+\\-]?[1-9][0-9]?)?$/";
      regExp = new RegExp(pattern);
      if (!regExp.test(paramVal)) {
        endWithTypeErrorJSON(paramName, paramVal, "FLOAT");
      }
      // x = floatval(paramVal);
      // if (
      //   x < -3.402823466E+38 || 3.402823466E+38 < x ||
      //   abs(x) < 1.175494351E-38
      // ) {
      //   endWithTypeErrorJSON(paramName, paramVal, "FLOAT");
      // }
      break;
    case "char":
    case "uft8_char":
      if (
        !(mb_paramVal.length === 1)
      ) {
        endWithTypeErrorJSON(paramName, paramVal, "CHAR");
      }
      break;
    case "str":
      if ( !(mb_paramVal.length <= 700) ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "VARCHAR(700)"
        );
      }
      break;
    case "fun_def": // TODO: Add parsing.
      if ( !(mb_paramVal.length <= 700) ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "function definition"
        );
      }
      break;
    case "fun_call": // TODO: Add parsing.
      if ( !(mb_paramVal.length <= 700) ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "function call"
        );
      }
      break;
    case "attr_ent_obj": // TODO: Add parsing.
      if ( !(mb_paramVal.length <= 700) ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "attr ent object"
        );
      }
      break;
    case "json_str": // TODO: Add parsing.
      if ( !(mb_paramVal.length <= 700) ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "JSON VARCHAR(700)"
        );
      }
      break;
    case "json_text": // TODO: Add parsing.
      if ( !(mb_paramVal.length <= 65535) ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "JSON TEXT"
        );
      }
      break;
    case "other_data_hex":
      pattern = "/^([0-9a-fA-F]{2}){0,16}$/";
      regExp = new RegExp(pattern);
      if (!regExp.test(paramVal)) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "VARBINARY(16) HEX"
        );
      }
      break;
    case "hash":
      pattern = "/^[0-9a-f]{128}$/";
      regExp = new RegExp(pattern);
      if (regExp.test(paramVal)) {
        endWithTypeErrorJSON(paramName, paramVal, pattern);
      }
      break;
    case "id_list":
      pattern = "/^((this|[1-9][0-9]*)(,(this|[1-9][0-9]*))*)?$/";
      regExp = new RegExp(pattern);
      len = paramVal.length;
      if (
        len > 209 ||
        !regExp.test(paramVal)
      ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "ID list (max 10)"
        );
      }
      break;
    case "rec_instr_list":
      pattern =
  "/^(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))+(;[1-9][0-9]*(,(0|[1-9][0-9]*))+)*$/";
      regExp = new RegExp(pattern);
      len = paramVal.length;
      if (
        len > 255 ||
        !regExp.test(paramVal)
      ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "Recursion instruction list"
        );
      }
      break;
    case "list_list":
      pattern =
        "/^((this|[1-9][0-9]*)([,\\|](this|[1-9][0-9]*))*)?$/";
      regExp = new RegExp(pattern);
      len = paramVal.length;
      if (
        len > 209 ||
        !regExp.test(paramVal)
      ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "ID list (max 10)"
        );
      }
      break;
    case "text":
    case "uft8_text":
      len = paramVal.length;
      if (
        len > 65535 ||
        !mb_check_encoding(paramVal, 'UTF-8')
      ) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "UFT-8 TEXT"
        );
      }
      break;
    case "blob":
      if (
        !is_string(paramVal) ||
        // !ctype_print(paramVal) ||
        paramVal.length > 65535
      ) {
        endWithTypeErrorJSON(paramName, paramVal, "BLOB");
      }
      break;
    case "json":
    case "json_indexable":
      // Never mind about this, I don't wish to not have
      // 'constructor' as a possible attribute:
      // jsObjProtoPropsPattern =
      //   '/[^\\]"(' .
      //     '__defineGetter__|__defineSetter__|__lookupGetter__|' .
      //     '__lookupSetter__|__proto__|hasOwnProperty|' .
      //     'isPrototypeOf|propertyIsEnumerable|toLocaleString|' .
      //     'toString|valueOf|constructor|' . 
      //     '<get __proto__\\(\\)>|<set __proto__\\(\\)>' .
      //   ')":/';
      if (
        paramVal.length > 3000 ||
        !json_validate(paramVal) // ||
        // preg_match(jsObjProtoPropsPattern, paramVal)
      ) {
        endWithTypeErrorJSON(paramName, paramVal, "JSON");
      }
      break;
    case "list_text":
      pattern = "/^[1-9][0-9]*(,[1-9][0-9]*)*$/";
      if (
        paramVal.length > 65535 ||
        !regExp.test(paramVal)
      ) {
        endWithTypeErrorJSON(paramName, paramVal, "listText");
      }
      break;
    // case "time":
    //   pattern =
    //     "/^(" .
    //       "([12]?[0-9]|3[0-4]) ".
    //       "([01][0-9]|2[0-3])" .
    //       "(:[0-5][0-9]){0,2}" .
    //     ")|(" .
    //       "([01][0-9]|2[0-3]:)?" .
    //       "([0-5][0-9])" .
    //       "(:[0-5][0-9])?" .
    //     ")$/";
    //   if (!regExp.test(paramVal)) {
    //     endWithTypeErrorJSON(paramName, paramVal, pattern);
    //   }
    //   break;
    case "username":
      // if (!is_string(paramVal) || !ctype_print(paramVal)) {
      //   endWithTypeErrorJSON(
      //     res, paramName, paramVal, "VARCHAR(1,50)"
      //   );
      // }
      // pattern = "/^[\\S]+$/";
      pattern = "/^[a-zA-Z][\\w\\-]*$/"; // TODO: Make this a lot less
      // restrictive. (But do not include integers, as these are
      // reserved for IDs.)
      regExp = new RegExp(pattern);
      if (!regExp.test(paramVal)) {
        endWithTypeErrorJSON(paramName, paramVal, pattern);
      }
      if (paramVal.length > 50) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "VARCHAR(1,50)"
        );
      }
      break;
    case "password":
      if (!is_string(paramVal) || !ctype_print(paramVal)) {
        // TODO: Change this as to not echo the password back to
        // the user.
        endWithTypeErrorJSON(
          res, paramName, paramVal, "VARCHAR(8,72)"
        );
      }
      len = paramVal.length;
      if (len < 8  || len > 72) {
        endWithTypeErrorJSON(
          res, paramName, paramVal, "VARCHAR(8,72)"
        );
      }
      break;
    case "session_id_hex":
      pattern = "/^([0-9a-zA-Z]{2}){60}$/";
      regExp = new RegExp(pattern);
      if (!regExp.test(paramVal)) {
        endWithTypeErrorJSON(paramName, paramVal, pattern);
      }
      break;
    case "any":
      break;
    default:
      throw (
      'InputValidator.validateParam(): unknown type ' +
        type + ' for ' + paramName
      );
  }
  }
}