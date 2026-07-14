
import {
  DevFunction, LoadError, parseString, 
} from '../interpreting/ScriptInterpreter.js';
import {scriptParser} from "../interpreting/parsing/ScriptParser.js";
import {fetchPlaceholdersModule} from "./query/query.js";


export const exec = new DevFunction(
  "exec", {isAsync: true, typeArr: ["string", "boolean?", "string?"]}, async (
    {callerNode, execEnv, interpreter},
    [moduleString, isPrivate = false, modulePath = undefined]
  ) => {
    modulePath ??= execEnv.getModuleEnv().modulePath;

    // Fetch the placeholders module.
    let placeholdersModule = await fetchPlaceholdersModule(
      modulePath, callerNode, execEnv, interpreter
    ).catch(err => {
      if (err instanceof LoadError) {
        return undefined;
      }
      else throw err;
    });

    // Parse the module.
    let [parsedScript, lexArr, strPosArr] = parseString(
      moduleString, callerNode, execEnv, scriptParser
    );

    // Add add special virtual file extension to the modulePath such that it
    // will not match any actual module route.
    modulePath = modulePath + ";.executed";

    // Then call interpreter.executeModule() and return the resulting
    // LiveJSModule instance.
    let {liveModules} = execEnv.globals;
    let globalEnv = execEnv.getGlobalEnv();
    return await interpreter.executeModule(
      parsedScript, lexArr, strPosArr, moduleString, modulePath, globalEnv,
      liveModules, undefined, undefined, undefined, isPrivate, false
    );
  },
);
