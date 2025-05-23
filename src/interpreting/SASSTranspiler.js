
import {sassParser} from "./parsing/SASSParser.js";
import {
  parseString, ScriptInterpreter, Environment, LoadError, StyleError,
  RuntimeError, decrCompGas,
} from "./ScriptInterpreter.js";



export class SASSTranspiler {

  constructor() {}


  // transpile() transforms the input styleSheet into CSS, ready to be inserted
  // in the document head, and returns it either directly or as a promise for
  // it (once we implement the @use rule).
  transpile(
    styleSheet, styleSheetPath, getClassPrefix, overwrittenVars = null,
    isTrusted = false, callerNode, callerEnv
  ) {
    if (typeof styleSheet !== "string") throw (
      `transpile(): Style sheet is not a string`
    );

    // Parse the style sheet, throwing a SyntaxError on failure.
    let [styleSheetNode, lexArr, strPosArr] = parseString(
      styleSheet, callerNode, callerEnv, sassParser
    );

    // Create a new environment for the style sheet. (We can just use the same
    // Environment class as the ScriptInterpreter for the SASS environments.)
    let styleSheetEnv = new Environment(
      undefined, "module", {
       modulePath: styleSheetPath, lexArr: lexArr, strPosArr: strPosArr,
       script: styleSheet, scriptVars: callerEnv.scriptVars,
      }
    );

    // Get the style sheet's own class prefix.
    let ownClassPrefix = getClassPrefix(styleSheetPath);

    return styleSheetNode.stmtArr.map(stmt => (
      this.transpileStatement(
        stmt, styleSheetEnv, ownClassPrefix, getClassPrefix, isTrusted,
        overwrittenVars
      )
    )).join("")
  }



  transpileStatement(
    stmt, environment, ownClassPrefix, getClassPrefix, isTrusted,
    overwrittenVars, indentSpace = "", isNested = false,
  ) {
    decrCompGas(stmt, environment);

    let type = stmt.type;
    if (type === "variable-declaration") {
      let valueNode = stmt.value;
      let val = this.getVariableValue(valueNode, environment, overwrittenVars);
      environment.declare(stmt.ident, val, true, stmt);
      return "";
    }
    else if (type === "ruleset") {
      transpileRuleset(
        stmt, environment, ownClassPrefix, getClassPrefix, isTrusted,
        indentSpace, isNested,
      );
    }
    else if (type === "member") {
      if (!isNested) throw new RuntimeError(
        "Declaration members most not appear outside a ruleset declaration",
        stmt, environment
      );
    }
    else throw (
      "Unrecognized SASS statement type: " + type
    );

  
  }



  getVariableValue(valueNode, environment, overwrittenVars) {
    if (valueNode.type === "variable") {
      if (overwrittenVars && environment.scopeType === "module") {
        let overwrittenVal = overwrittenVars.get(valueNode.ident);
        if (overwrittenVal !== undefined) {
          return overwrittenVal;
        }
      }
      return environment.getVar(valueNode.ident, valueNode);
    }
    else {
      return valueNode.lexeme;
    }
  }



  transpileRuleset(
    stmt, environment, ownClassPrefix, getClassPrefix, isTrusted,
    indentSpace, isNested,
  ) {
    if (isNested) throw new RuntimeError(
      "Nested rules are not yet implemented",
      stmt, environment
    );

    // Transpile the selector, throwing an exception whenever an untrusted
    // style sheet uses a selector the involves element other than those with
    // classes coming from the style sheet itself. 
    let transpiledSelectorList;
    try {
      transpiledSelectorList = stmt.selectorArr.map(selector => {
        this.transpileSelector(
          selector, environment, ownClassPrefix, getClassPrefix, isTrusted
        )
      }).join(", ");
    }
    catch (err) {
      // If an unauthorized selector was detected, simply return an empty
      // string instead of the ruleset.
      if (err instanceof UnauthorizedSelectorException) {
        return indentSpace + "/* Unauthorized ruleset */\n";
      }
      else throw err;
    }

    // If the selector succeeds, returns the rule with the transpiled
    // selector list and the transpiled nested statements inside the rule.
    let newEnv = new Environment(environment);
    return (
      indentSpace + transpiledSelectorList + " {\n" +
      stmt.nestedStmtArr.map(nestedStmt => {
        this.transpileStatement(
          nestedStmt, newEnv, ownClassPrefix, getClassPrefix, isTrusted,
          indentSpace + "  "
        )
      }).join("")
    );
  }




  transpileSelector(
    selector, environment, ownClassPrefix, getClassPrefix, isTrusted
  ) {

  }


}





class UnauthorizedSelectorException {
  constructor() {}
}



export {SASSTranspiler as default};
