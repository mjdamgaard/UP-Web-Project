
import {
  payGas, NetworkError as InterpreterNetworkError,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  ServerQueryHandler, NetworkError
} from "../../../server/ajax_io/ServerQueryHandler.js";
import {FlagTransmitter} from "../../../interpreting/FlagTransmitter.js";

const serverQueryHandler = new ServerQueryHandler();



export async function queryServer(
  isPrivate, route, isPost, postData, options, upNodeID, node, env
) {
  payGas(node, env, {fetch: 1});
  let flags = isPrivate ? FlagTransmitter.getTransmittedFlags(env) : undefined;
  try {
    return await serverQueryHandler.queryServer(
      isPrivate, route, isPost, postData, options, upNodeID, flags
    );
  }
  catch(err) {
    if (err instanceof NetworkError) {
      throw new InterpreterNetworkError(err.msg, node, env);
    }
    throw err;
  }
}