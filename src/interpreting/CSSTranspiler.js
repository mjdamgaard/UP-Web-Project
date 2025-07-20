
import {cssParser} from "./parsing/CSSParser.js";
import {parseString} from "./ScriptInterpreter.js";



export class CSSTranspiler {

  // transpileStyleSheet() validates and transforms the input styleSheet that
  // has already been parsed into CSS that is ready to be inserted in the
  // document head. transpileStyleSheet() ignores @import statements, so these
  // has to be handled by another method/function.
  transpileStyleSheet(styleSheetNode, id, isTrusted) {
    return styleSheetNode.stmtArr.map(stmt => (
      this.transpileStatement(stmt, id, isTrusted)
    )).join("\n")
  }


  transpileStatement(stmt, id, isTrusted, indentSpace = "") {
    let type = stmt.type;
    if (type === "ruleset") {
      return this.transpileRuleset(stmt, id, isTrusted, indentSpace);
    }
    else if (type === "at-rule") {
      return indentSpace +
        "/* Error: At-rules are not implemented just yet */\n"
    }
    else throw (
      "Unrecognized CSS statement type: " + type
    );
  }


  transpileRuleset(stmt, id, isTrusted, indentSpace) {
    // Transpile the selector. If isTrusted is falsy, only compound selectors
    // consisting of nothing but classes, pseudo-classes, and pseudo-elements
    // are allowed, or lists of these. So no complex selectors (i.e. with
    // combinators such as " " or ">"). Furthermore, each compound selector has
    // to include at least one regular class. But if isTrusted is true, on the
    // other hand, all kinds of selectors are allowed.
    let transpiledSelectorList = stmt.selectorArr.map(selector => (
      this.transpileComplexSelector(selector, id, isTrusted)
    )).join(", ");

    // Return the rule with the transpiled selector list and the transpiled
    // declarations inside the rule.
    return (
      indentSpace + transpiledSelectorList + " {\n" +
        stmt.decArr.map(dec => (
          this.transpileDeclaration(dec, indentSpace + "  ")
      )).join("") +
      indentSpace + "\n}\n"
    );
  }


  transpileDeclaration(dec, indentSpace) {
    return indentSpace + dec.propName + ": " + dec.valueArr.map(
      valueNode => valueNode.value ?? valueNode.lexeme
    ).join(" ") + ";\n";
  }



  transpileComplexSelector(selector, id, isTrusted) {
    // The children of a complex selector node are the compound selectors at
    // every even index, starting with (and possibly ending in) 0, and then the
    // combinators at every odd index.
    let complexSelectorChildren = selector.children;

    // If the style sheet is not trusted, no combinators, including the
    // descendant combinator (" "), are allowed.
    if (!isTrusted && complexSelectorChildren.length > 1) {
      return "._/* Style sheet trust required */._";
    }
    
    return complexSelectorChildren.map((child, ind) => {
      // For even indices, transpile the given compound selector.
      if (ind % 2 === 0) {
        return this.transpileCompoundSelector(child, id, isTrusted);
      }
      // For odd indices, transpile the given combinator.
      else {
        return (child.type === "non-space-combinator") ?
          " " + child.lexeme + " " :
          " ";
      }
    }).join("");
  }

  transpileCompoundSelector(selector, id, isTrusted) {
    // Initialize a "hasClass" flag reference that is raised by
    // transpileSimpleSelector() if the selector is a regular class selector.
    // When the simple selectors has been transpiled, we then check that if
    // isTrusted is falsy, then the hasClass flag must have been raised.
    let hasClassRef = [false];
    let transpiledCompoundSelector = selector.map(child => (
      this.transpileSimpleSelector(child, id, isTrusted, hasClassRef)
    )).join("");

    if (!isTrusted && !hasClassRef[0]) {
      return "._/* Style sheet trust required */._";
    }
    return transpiledCompoundSelector;
  }

  transpileSimpleSelector(
    selector, id, isTrusted, hasClassRef
  ) {
    let type = selector.type;
    if (type === "class-selector") {
      // Raise the hasClass flag.
      hasClassRef[0] = true;

      // Check that the class name does not contain any underscores to begin
      // with (such selectors are only used in class transforms), and then
      // append id to hte class, after an underscore, before returning it.
      let className = selector.className;
      if (className.indexOf("_") !== -1) {
        return "._/* No underscores allowed in classes */._";
      }
      return "." + className + "_" + id;
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
      return ":" + selector.lexeme + tuple ?? "";
    }
    else if (type === "pseudo-element") {
      return "::" + selector.lexeme;
    }
    else if (type === "universal-selector") {
      if (!isTrusted) {
        return "._/* Style sheet trust required */._";
      }
      return "*";
    }
    else if (type === "type-selector") {
      if (!isTrusted) {
        return "._/* Style sheet trust required */._";
      }
      return selector.lexeme;
    }
    else throw "CSSTranspiler.transpileSimpleSelector(): Unrecognized type";
  }


}





export const cssTranspiler = new CSSTranspiler();


export {cssTranspiler as default};
