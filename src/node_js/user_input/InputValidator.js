
import {Error, throwTypeError} from "../err/errors.js";



export class InputValidator {

  static validateParams(paramValArr, typeArr, paramNameArr) {
  paramValArr.forEach((paramVal, ind) => {
    this.validateParam(paramVal, typeArr[ind], paramNameArr[ind]);
  });

  }


  static validateParam(paramVal, type, paramName) {
    let pattern, regExp, n, len;

    switch (type) {
      case "id":
      case "ulong":
        pattern = "^(0|[1-9][0-9]*)$";
        regExp = new RegExp(pattern);
        if (
          !regExp.test(paramVal) ||
          paramVal.length > 20 ||
          paramVal.length == 20 &&
            paramVal > "18446744073709551615"
        ) {
          throwTypeError(
            paramName, paramVal, "BIGINT UNSIGNED"
          );
        }
        break;
      case "uint":
      case "unix_time":
        pattern = "^[1-9][0-9]*|0$";
        regExp = new RegExp(pattern);
        if (
          !regExp.test(paramVal) ||
          paramVal.length > 10 ||
          paramVal.length == 10 && paramVal > "4294967295"
        ) {
          throwTypeError(
            paramName, paramVal, "INT UNSIGNED"
          );
        }
        break;
      case "int":
        pattern = "^-?[1-9][0-9]{0,9}|0$";
        regExp = new RegExp(pattern);
        n = parseInt(paramVal);
        if (
          !regExp.test(paramVal) ||
          n < -2147483648 ||
          n > 2147483647
        ) {
          throwTypeError(paramName, paramVal, "INT");
        }
        break;
      case "tint":
      // case "rat":
        pattern = "^-?[1-9][0-9]{0,2}|0$";
        regExp = new RegExp(pattern);
        n = parseInt(paramVal);
        if (
          !regExp.test(paramVal) ||
          n < -128 ||
          n > 127
        ) {
          throwTypeError(paramName, paramVal, "TINYINT");
        }
        break;
      case "bool":
      // case "rat":
        pattern = "^[01]$";
        regExp = new RegExp(pattern);
        if (!regExp.test(paramVal)) {
          throwTypeError(paramName, paramVal, pattern);
        }
        break;
      case "utint":
      case "uchar":
      case "rat":
        pattern = "^[1-9][0-9][0-9]|0$";
        regExp = new RegExp(pattern);
        n = parseInt(paramVal);
        if (
          !regExp.test(paramVal) ||
          n < 0 ||
          n > 255
        ) {
          throwTypeError(
            paramName, paramVal, "TINYINT UNSIGNED"
          );
        }
        break;
      case "ushort":
      // case "encoded_rat":
      // case "enc_rat":
        pattern = "^[1-9][0-9]{0,4}|0$";
        regExp = new RegExp(pattern);
        n = parseInt(paramVal);
        if (
          !regExp.test(paramVal) ||
          n > 65535
        ) {
          throwTypeError(
            paramName, paramVal, "SMALLINT UNSIGNED"
          );
        }
        break;
      case "float":
      // TODO: Restricting syntax, unless it's fine..
        pattern =
        "^\\-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][+\\-]?[1-9][0-9]?)?$";
        regExp = new RegExp(pattern);
        if (!regExp.test(paramVal)) {
          throwTypeError(paramName, paramVal, "FLOAT");
        }
        // x = floatval(paramVal);
        // if (
        //   x < -3.402823466E+38 || 3.402823466E+38 < x ||
        //   abs(x) < 1.175494351E-38
        // ) {
        //   throwTypeError(paramName, paramVal, "FLOAT");
        // }
        break;
      case "char":
      case "uft8_char":
        if (
          !(paramVal.length === 1)
        ) {
          throwTypeError(paramName, paramVal, "CHAR");
        }
        break;
      case "str":
        if ( !(paramVal.length <= 700) ) {
          throwTypeError(
            paramName, paramVal, "VARCHAR(700)"
          );
        }
        break;
      case "fun_def": // TODO: Add parsing.
        if ( !(paramVal.length <= 700) ) {
          throwTypeError(
            paramName, paramVal, "function definition"
          );
        }
        break;
      case "fun_call": // TODO: Add parsing.
        if ( !(paramVal.length <= 700) ) {
          throwTypeError(
            paramName, paramVal, "function call"
          );
        }
        break;
      case "attr_ent_obj": // TODO: Add parsing.
        if ( !(paramVal.length <= 700) ) {
          throwTypeError(
            paramName, paramVal, "attr ent object"
          );
        }
        break;
      case "json_str": // TODO: Add parsing.
        if ( !(paramVal.length <= 700) ) {
          throwTypeError(
            paramName, paramVal, "JSON VARCHAR(700)"
          );
        }
        break;
      case "json_text": // TODO: Add parsing.
        if ( !(paramVal.length <= 65535) ) {
          throwTypeError(
            paramName, paramVal, "JSON TEXT"
          );
        }
        break;
      case "other_data_hex":
        pattern = "^([0-9a-fA-F]{2}){0,16}$";
        regExp = new RegExp(pattern);
        if (!regExp.test(paramVal)) {
          throwTypeError(
            paramName, paramVal, "VARBINARY(16) HEX"
          );
        }
        break;
      case "hash":
        pattern = "^[0-9a-f]{128}$";
        regExp = new RegExp(pattern);
        if (regExp.test(paramVal)) {
          throwTypeError(paramName, paramVal, pattern);
        }
        break;
      case "id_list":
        pattern = "^((this|[1-9][0-9]*)(,(this|[1-9][0-9]*))*)?$";
        regExp = new RegExp(pattern);
        len = paramVal.length;
        if (
          len > 209 ||
          !regExp.test(paramVal)
        ) {
          throwTypeError(
            paramName, paramVal, "ID list (max 10)"
          );
        }
        break;
      case "rec_instr_list":
        pattern =
    "^(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))+(;[1-9][0-9]*(,(0|[1-9][0-9]*))+)*$";
        regExp = new RegExp(pattern);
        len = paramVal.length;
        if (
          len > 255 ||
          !regExp.test(paramVal)
        ) {
          throwTypeError(
            paramName, paramVal, "Recursion instruction list"
          );
        }
        break;
      case "list_list":
        pattern =
          "^((this|[1-9][0-9]*)([,\\|](this|[1-9][0-9]*))*)?$";
        regExp = new RegExp(pattern);
        len = paramVal.length;
        if (
          len > 209 ||
          !regExp.test(paramVal)
        ) {
          throwTypeError(
            paramName, paramVal, "ID list (max 10)"
          );
        }
        break;
      case "text":
      case "uft8_text":
        if (paramVal.length > 65535) {
          throwTypeError(
            paramName, paramVal, "UFT-8 TEXT"
          );
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
        if (paramVal.length > 3000) {
          throwTypeError(paramName, paramVal, "JSON");
        }
        try {
          JSON.parse(paramVal);
        } catch (err) {
          throwTypeError(paramName, paramVal, "JSON");
        }
        break;
      case "list_text":
        pattern = "^[1-9][0-9]*(,[1-9][0-9]*)*$";
        if (
          paramVal.length > 65535 ||
          !regExp.test(paramVal)
        ) {
          throwTypeError(paramName, paramVal, "listText");
        }
        break;
      // case "time":
      //   pattern =
      //     "^(" .
      //       "([12]?[0-9]|3[0-4]) ".
      //       "([01][0-9]|2[0-3])" .
      //       "(:[0-5][0-9]){0,2}" .
      //     ")|(" .
      //       "([01][0-9]|2[0-3]:)?" .
      //       "([0-5][0-9])" .
      //       "(:[0-5][0-9])?" .
      //     ")$";
      //   if (!regExp.test(paramVal)) {
      //     throwTypeError(paramName, paramVal, pattern);
      //   }
      //   break;
      case "username":
        // if (!is_string(paramVal) || !ctype_print(paramVal)) {
        //   throwTypeError(
        //     paramName, paramVal, "VARCHAR(1,50)"
        //   );
        // }
        // pattern = "^[\\S]+$";
        pattern = "^[a-zA-Z][\\w\\-]*$"; // TODO: Make this a lot less
        // restrictive. (But do not include integers, as these are
        // reserved for IDs.)
        regExp = new RegExp(pattern);
        if (!regExp.test(paramVal)) {
          throwTypeError(paramName, paramVal, pattern);
        }
        if (paramVal.length > 50) {
          throwTypeError(
            paramName, paramVal, "VARCHAR(1,50)"
          );
        }
        break;
      case "password":
        if (!is_string(paramVal) || !ctype_print(paramVal)) {
          // TODO: Change this as to not echo the password back to
          // the user.
          throwTypeError(
            paramName, paramVal, "VARCHAR(8,72)"
          );
        }
        len = paramVal.length;
        if (len < 8  || len > 72) {
          throwTypeError(
            paramName, paramVal, "VARCHAR(8,72)"
          );
        }
        break;
      case "session_id_hex":
        pattern = "^([0-9a-zA-Z]{2}){60}$";
        regExp = new RegExp(pattern);
        if (!regExp.test(paramVal)) {
          throwTypeError(paramName, paramVal, pattern);
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