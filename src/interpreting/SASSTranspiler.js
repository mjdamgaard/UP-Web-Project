
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
    styleSheet, route, id, loadedStyleSheets, styleSheetParams = undefined,
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
       modulePath: route, lexArr: lexArr, strPosArr: strPosArr,
       script: styleSheet, scriptVars: callerEnv.scriptVars,
      }
    );

    return styleSheetNode.stmtArr.map(stmt => (
      this.transpileStatement(
        stmt, styleSheetEnv, loadedStyleSheets, isTrusted, overwrittenVars
      )
    )).join("")
  }



  transpileStatement(
    stmt, environment, loadedStyleSheets, isTrusted, overwrittenVars,
    indentSpace = "", isNested = false,
  ) {
    decrCompGas(stmt, environment);

    let type = stmt.type;
    if (type === "variable-declaration") {
      let valueNode = stmt.value;
      let val;
      if (overwrittenVars && environment.scopeType === "module") {
        val = overwrittenVars.get(valueNode.ident);
        if (val === undefined) {
          val = this.getValue(valueNode, environment);
        }
      }
      else {
        val = this.getValue(valueNode, environment);
      }
      environment.declare(stmt.ident, val, true, stmt);
      return "";
    }
    else if (type === "ruleset") {
      transpileRuleset(
        stmt, environment, loadedStyleSheets, isTrusted,
        indentSpace, isNested,
      );
    }
    else if (type === "member") {
      if (!isNested) throw new RuntimeError(
        "Declaration members most not appear outside a ruleset declaration",
        stmt, environment
      );
      return stmt.propName + ": " + stmt.valueArr.map(valueNode => (
        this.getValue(valueNode, environment)
      )).join(" ");
    }
    else throw (
      "Unrecognized SASS statement type: " + type
    );
  
  }



  getValue(valueNode, environment) {
    if (valueNode.type === "variable") {
      return environment.getVar(valueNode.ident, valueNode);
    }
    else {
      return valueNode.lexeme;
    }
  }



  transpileRuleset(
    stmt, environment, loadedStyleSheets, isTrusted, indentSpace, isNested,
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
          selector, environment, loadedStyleSheets, isTrusted
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
            nestedStmt, newEnv, loadedStyleSheets, isTrusted,
            indentSpace + "  "
          )
        }).join("") +
      indentSpace + "\n}"
    );
  }




  transpileSelector(
    selector, environment, loadedStyleSheets, isTrusted
  ) {
    let complexSelectorChildren = selector.complexSelector.children;
    let pseudoElement = selector.pseudoElement;
    return (
      complexSelectorChildren.map((child, ind) => {
        // If the child is a (compound) selector, rather than a combinator,
        // transpile it, passing isTrusted to only the first one when ind === 1,
        // and passing isTrusted := true for all subsequent selectors.
        if (ind % 2 === 0) {
          return transpileCompoundSelector(
            child, environment, loadedStyleSheets,
            (ind === 0) ? isTrusted : true,
          );
        }
        // Else for a combinator, also make sure to check that it is not a
        // sibling selector if ind === 1.
        else {
          let lexeme = child[0]?.lexeme;
          if (!isTrusted && ind === 1 && lexeme && lexeme !== ">") {
            throw new UnauthorizedSelectorException();
          }
          return lexeme ? " " + lexeme + " " : " ";
        } 
      }).join("") +
      pseudoElement?.lexeme ?? ""
    );
  }

  transpileCompoundSelector(
    selector, environment, loadedStyleSheets, isTrusted
  ) {
    // Initialize an "isConfined" flag reference that the following 
    // transpileSimpleSelector() calls can set to true if one of the simple
    // selectors was a class introduced by this style sheet, meaning that the
    // selector won't apply to any elements that doesn't subscribe to this
    // style sheet.
    let isConfinedFlagRef = [false];
    let transpiledCompoundSelector = selector.map(child => (
      transpileSimpleSelector(
        child, environment, loadedStyleSheets, isConfinedFlagRef
      )
    )).join("");
    
    // Then if the style sheet is not trusted, and the "isConfined" flag wasn't
    // changed to true, throw an UnauthorizedSelectorException, removing this
    // rule from the transpiled result.
    if (!isTrusted && !isConfinedFlagRef[0]) {
      throw new UnauthorizedSelectorException();
    }
    return transpiledCompoundSelector;
  }

  transpileSimpleSelector(
    selector, environment, loadedStyleSheets, isConfinedFlagRef
  ) {
    let type = selector.type;
    if (type === "class-selector") {
      let className = selector.className;

      // If the class name contains no underscore, and thus no prefix,
      // transform it by prepending the style sheet's own prefix (gotten from
      // calling loadedStyleSheets("")), and also mark isConfined as true.
      let indOfUnderscore = className.indexOf("_");
      if (indOfUnderscore === -1) {
        isConfinedFlagRef[0] = true;
        return (
          ":" + loadedStyleSheets("", selector, environment) +
          "_" + className
        );
      }
      // Else simply extract the prefix and transform it with
      // loadedStyleSheets().
      else {
        let prefix = className.substring(0, indOfUnderscore + 1);
        return (
          ":" + loadedStyleSheets(prefix, selector, environment) +
          "_" + className
        );
      }
    }
    else if (type === "pseudo-class-selector") {
      let argument = selector.argument; 
      let argType = argument?.type;
      let tuple;
      if (argType === "selector-list") {
        tuple = "(" +
          argument.children.map(selector => {
            this.transpileSelector(
              selector, environment, loadedStyleSheets, true
            )
          }).join(", ") +
        ")";
      }
      else if (argType === "integer") {
        tuple = "(" + argument.lexeme + ")";
      }
      return selector.lexeme + tuple ?? "";
    }
    else {
      return selector.lexeme;
    }
    
  }

}





class UnauthorizedSelectorException {
  constructor() {}
}



export {SASSTranspiler as default};
