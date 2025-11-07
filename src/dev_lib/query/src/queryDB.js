
import {payGas, ArgTypeError} from "../../../interpreting/ScriptInterpreter.js";

import * as directoriesMod from "../src/filetypes/directories.js";
import * as textFilesMod from "../src/filetypes/text_files.js";
import * as relationalTableFilesMod from "../src/filetypes/rel_tables.js";
import * as fullTextTableFilesMod from "../src/filetypes/full_text_tables.js";




export async function queryDB(
  route, isPost, postData, options,
  homeDirID, localPath, dirSegments, fileName, fileExt, queryPathSegments,
  callerNode, execEnv, interpreter
) {
  payGas(node, env, {dbRead: 1});

  // Branch according to the file extension.
  let filetypeModule;
  switch (fileExt) {
    case undefined:
      filetypeModule = directoriesMod;
      break;
    case "js":
    case "jsx":
    case "txt":
    case "html":
    case "xml":
    case "svg":
    case "css":
    case "md":
    case "json":
      filetypeModule = textFilesMod;
      break;
    case "att":
    case "bbt":
    case "bt":
    case "ct":
      filetypeModule = relationalTableFilesMod;
      break;
    case "ftt":
      filetypeModule = fullTextTableFilesMod;
      break;
    // (More file types can be added here in the future.)
    default:
      throw new ArgTypeError(
        `Unrecognized file type: ".${fileExt}"`,
        node, env
      );
  }

  // Query the database via the filetypeModule, and return the result.
  let result = await filetypeModule.query(
    {callerNode: node, execEnv: env, interpreter: interpreter},
    route, isPost, postData, options,
    homeDirID, localPath, dirSegments, fileName, fileExt, queryPathSegments,
  );
  return result;
}