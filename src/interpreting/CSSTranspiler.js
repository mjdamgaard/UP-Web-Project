
import {cssParser} from "./parsing/CSSParser.js";
import {parseString} from "./ScriptInterpreter.js";



export class CSSTranspiler {

  // transpile() transforms the input styleSheet into CSS, ready to be inserted
  // in the document head, and returns it either directly or as a promise for
  // it (once we implement the @use rule).
  transpile(styleSheet, id, isTrusted, callerNode, callerEnv) {
    if (typeof styleSheet !== "string") throw (
      `CSSTranspiler.transpile(): Style sheet is not a string`
    );

    // Parse the style sheet, throwing a SyntaxError on failure.
    let [styleSheetNode] = parseString(
      styleSheet, callerNode, callerEnv, cssParser
    );

    return styleSheetNode.stmtArr.map(stmt => (
      this.transpileStatement(stmt, id, addConfinement)
    )).join("\n")
  }


  transpileStatement(
    stmt, id, isTrusted, indentSpace = "", isNested = false
  ) {
    let type = stmt.type;
    if (type === "declaration") {
      if (!isNested) {
        return indentSpace +
          "/* Error: Invalid declaration outside of a ruleset */\n";
      }
      return indentSpace + stmt.propName + ": " + stmt.valueArr.map(
        valueNode => valueNode.lexeme
      ).join(" ") + ";\n";
    }
    else if (type === "ruleset") {
      return this.transpileRuleset(
        stmt, id, isTrusted, indentSpace, isNested
      );
    }
    else if (type === "at-rule") {
      return indentSpace +
        "/* Error: At-rules are not implemented just yet */\n"
    }
    else throw (
      "Unrecognized CSS statement type: " + type
    );
  }


  transpileRuleset(stmt, id, isTrusted, indentSpace, isNested) {
    // Transpile the selector. If isTrusted is falsy, only selectors consisting
    // of no combinators and no element types or universal selectors are
    // allowed, and each compound selector has to include at least one regular
    // class (besides pseudo-classes and pseudo-elements).
    let transpiledSelectorList = stmt.selectorArr.map(selector => (
      this.transpileComplexSelector(selector, id, isTrusted, isNested)
    )).join(", ");

    // If the selector succeeds, returns the rule with the transpiled
    // selector list and the transpiled nested statements inside the rule.
    return (
      indentSpace + transpiledSelectorList + " {\n" +
        stmt.stmtArr.map(stmt => (
          this.transpileStatement(stmt, id, isTrusted, indentSpace + "  ", true)
      )).join("") +
      indentSpace + "\n}\n"
    );
  }




  transpileComplexSelector(selector, id, isTrusted, isNested) {
    // The children of a complex selector are the compound selectors at every
    // even index, starting with (and possibly ending in) 0, and then the
    // combinators at every odd index.
    let complexSelectorChildren = selector.children.map((child, ind) => {
      // If ind is 0, allow for a child of "&", but only is isNested is true.
      if (ind === 1 && child === "&") {
        if (isNested) {
          return "&";
        } else {
          return ":not(*)";
        }
      }

      // Transpile the compound selectors, i.e. when ind is even. The
      // addConfinement parameter should only affect to the first compound selector.
      if (ind % 2 === 0) {
        return this.transpileCompoundSelector(
          child, environment, id, styleSheetIDs,
          (ind === 0) ? isTrusted : true,
        );
      }
      // Else for a combinator, also make sure to check that it is not a
      // sibling selector if ind === 1. And if the combinator is whitespace,
      // including comments, transform it to just a space. 
      else {
        let lexeme = child[0]?.lexeme ?? " ";
        if (!isTrusted && ind === 1 && (lexeme === "+" || lexeme === "~")) {
          throw new UnauthorizedSelectorException();
        }
        if (/^[>+~]$/.test(lexeme)) {
          return " " + lexeme + " ";
        } else {
          return " ";
        }
      }
    });

    // If the fist combinator is a sibling combinator, prepend ".this.id-<id> "
    // to the whole thing if isTrusted == false, thus preventing untrusted
    // style sheets from affecting styles outside of its own classes.
    return complexSelectorChildren.join("") +
      isTrusted ? "" : `:not(.protected:not(.by-${id}) *)` +
      pseudoElement?.lexeme ?? ""
  }

  transpileCompoundSelector(
    selector, environment, id, styleSheetIDs, isTrusted
  ) {
    // Initialize an "isConfined" flag reference that the following 
    // transpileSimpleSelector() calls can set to true if one of the simple
    // selectors was a class introduced by this style sheet, meaning that the
    // selector won't apply to any elements that doesn't subscribe to this
    // style sheet.
    let isConfinedFlagRef = [false];
    let transpiledCompoundSelector = selector.map(child => (
      this.transpileSimpleSelector(
        child, environment, id, styleSheetIDs, isConfinedFlagRef
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
    selector, environment, id, styleSheetIDs, isConfinedFlagRef
  ) {
    let type = selector.type;
    if (type === "class-selector") {
      let className = selector.className;

      // If the class name contains no underscore, and thus no prefix,
      // transform it by prepending the style sheet's own ID, and also mark
      // isConfined as true.
      let indOfUnderscore = className.indexOf("_");
      if (indOfUnderscore === -1) {
        isConfinedFlagRef[0] = true;
        return ":" + id + "_" + className;
      }
      // Else extract the existing prefix, which ought to be an identifier of
      // an existing CSS variable containing a route, then get that route, and
      // look in styleSheetIDs for the ID to substitute it for.
      else {
        let ident = className.substring(0, indOfUnderscore);
        let route = environment.get(ident, selector);
        let styleSheetID = styleSheetIDs.get(route) ?? "";
        // (Note that if route is undefined, the class becomes an inaccessible
        // class with a leading underscore.)
        return ":" + styleSheetID + "_" + className;
      }
    }
    else if (type === "pseudo-class-selector") {
      let argument = selector.argument; 
      let argType = argument?.type;
      let tuple;
      if (argType === "selector-list") {
        tuple = "(" +
          argument.children.map(selector => {
            this.transpileComplexSelector(
              selector, environment, id, styleSheetIDs, true
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


export const cssTranspiler = new CSSTranspiler();


export {cssTranspiler as default};
