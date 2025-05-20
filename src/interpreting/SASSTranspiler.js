
import {sassParser} from "./parsing/SASSParser.js";
import {
  parseString, ScriptInterpreter, Environment, LoadError, StyleError
} from "./ScriptInterpreter.js";



export class SASSTranspiler {

  constructor(scriptInterpreter) {
    this.scriptInterpreter = scriptInterpreter;
    this.supportsCSSNesting = CSS.supports("selector(& div)");
  }

  async executeStyleSheet(
    gas, styleSheetPath, textModules, callerNode, callerEnv,
    parsedStyleSheets = new Map(), liveSASSModules = new Map()
  ) {
    let rootVars = {
      gas: gas, styleSheetPath: styleSheetPath,
      reqUserID: reqUserID, preprocessor: this, textModules: textModules,
      parsedStyleSheets: parsedStyleSheets, liveSASSModules: liveSASSModules,
    };

    let [
      parsedStyleSheet, lexArr, strPosArr, styleSheet
    ] = await this.fetchParsedStyleSheet(
      styleSheetPath, parsedStyleSheets, callerNode, callerEnv
    );

    // Now execute the style sheet as a module.
    let liveSASSModule = await this.executeModule(
      parsedStyleSheet, lexArr, strPosArr, styleSheet, scriptPath, globalEnv
    );

    // Then return the preprocessed "live" SASS module.
    return liveSASSModule;
  }




  async fetchParsedStyleSheet(
    styleSheetPath, parsedStyleSheets, callerNode, callerEnv
  ) {
    let [parsedStyleSheet, lexArr, strPosArr, styleSheet] =
      parsedStyleSheets.get(styleSheetPath) ?? [];
    if (!parsedStyleSheet) {
      let {textModules} = callerEnv.rootVars;
      try {
        styleSheet = await this.scriptInterpreter.fetchTextModule(
          styleSheetPath, textModules, callerNode, callerEnv
        );
      } catch (err) {
        throw new LoadError(err.toString(), callerNode, callerEnv);
      }
      if (typeof styleSheet !== "string") throw new LoadError(
        `No script was found at ${scriptPath}`,
        callerNode, callerEnv
      );
      [parsedStyleSheet, lexArr, strPosArr] = parseString(
        styleSheet, callerNode, callerEnv, sassParser
      );
      parsedStyleSheets.set(
        styleSheetPath, [parsedStyleSheet, lexArr, strPosArr, styleSheet]
      );
    }
    return [parsedStyleSheet, lexArr, strPosArr, styleSheet];
  }





  async executeModule(
    moduleNode, lexArr, strPosArr, styleSheet, modulePath, globalEnv
  ) {
    decrCompGas(moduleNode, globalEnv);

    // Create a new environment for the module.
    let moduleEnv = new SASSEnvironment(
      globalEnv, "module", {
       modulePath: modulePath, lexArr: lexArr, strPosArr: strPosArr,
       styleSheet: styleSheet,
      }
    );

    // Run all the import statements in parallel and get their live
    // environments, but without making any changes to moduleEnv yet.
    let liveSubmoduleArr = await Promise.all(
      moduleNode.atUseRuleArr.map(atUseRule => (
        this.executeSubmoduleOfAtUseRule(atUseRule, modulePath, moduleEnv)
      ))
    );

    // We then run all the @use rules again, this time where each
    // import statement is paired with the environment from the already
    // executed module, and where the changes are now made to moduleEnv.
    moduleNode.atUseRuleArr.forEach((atUseRule, ind) => {
      let liveSubmodule = liveSubmoduleArr[ind];
      this.finalizeImportStatement(atUseRule, liveSubmodule, moduleEnv);
    });

    // Then execute the body of the style sheet consisting of non-@use
    // statements.
    moduleNode.stmtArr.forEach((stmt) => {
      this.executeStatement(stmt, moduleEnv);
    });

    // And finally get the exported "live module," and return it.
    return [moduleEnv.getLiveModule(), moduleEnv];
  }





  executeSubmoduleOfAtUseRule(atUseRule, curModulePath, callerModuleEnv) {
    
  }



  finalizeImportStatement(atUseRule, liveSubmodule, curModuleEnv) {
    
  }



  executeStatement(stmtNode, environment) {
    decrCompGas(stmtNode, environment);

    let type = stmtNode.type;
    if (type === "ruleset") {

    }
    else throw (
      `"${type}" statements have not been implemented yet`
    );
  }





}






export class SASSEnvironment extends Environment {
  constructor(
    parent, scopeType = "block", {
      modulePath, lexArr, strPosArr, styleSheet, rootVars,
    },
  ) {
    super(
      parent, scopeType, {
        modulePath: modulePath, lexArr: lexArr, strPosArr: strPosArr,
        script: styleSheet, scriptVars: rootVars,
      },
    );
  }
}







export {SASSTranspiler as default};
