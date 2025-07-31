
import {cssParser} from "./CSSParser.js";
import {parseString} from "../../../../interpreting/ScriptInterpreter.js";



export class CSSTransformer {

  // transformStyleSheet() validates and transforms the input styleSheet that
  // has already been parsed as a (processed) CSS syntax tree into a style
  // sheet string ready to be inserted in the document head. Not that
  // transformStyleSheet() ignores @import statements, so these have to be
  // handled by another method/function.
  transformStyleSheet(styleSheetNode, id) {
    return styleSheetNode.stmtArr.map(stmt => (
      this.transformStatement(stmt, id)
    )).join("\n")
  }


  transformStatement(stmt, id, indentSpace = "") {
    let type = stmt.type;
    if (type === "ruleset") {
      return this.transformRuleset(stmt, id, indentSpace);
    }
    else if (type === "at-rule") {
      return indentSpace +
        "/* Error: At-rules are not implemented just yet */\n"
    }
    else throw (
      "Unrecognized CSS statement type: " + type
    );
  }


  transformRuleset(stmt, id, indentSpace) {
    // Transform the selector.
    let transformedSelectorList = this.transformSelectorList(
      stmt.selectorList, `:where(._${id})`
    );

    // Return the rule with the transformed selector list and the transformed
    // declarations inside the rule.
    return (
      indentSpace + transformedSelectorList + " {\n" +
        stmt.decArr.map(dec => (
          this.transformDeclaration(dec, indentSpace + "  ")
      )).join("") +
      indentSpace + "\n}\n"
    );
  }


  transformDeclaration(dec, indentSpace) {
    return indentSpace + dec.propName + ": " + dec.valueArr.map(
      valueNode => valueNode.value ?? valueNode.lexeme
    ).join(" ") + ";\n";
  }


  transformSelectorList(selectorList, whereClause = "") {
    return selectorList.children.map(selector => (
      this.transformComplexSelector(selector, whereClause)
    )).join(", ");
  }


  transformComplexSelector(selector, whereClause) {
    // The children of a complex selector node are the compound selectors at
    // every even index, starting with (and possibly ending in) 0, and then the
    // combinators at every odd index.
    return selector.children.map((child, ind) => {
      // For even indices, transform the given compound selector.
      if (ind % 2 === 0) {
        return this.transformCompoundSelector(child, id);
      }
      // For odd indices, transform the given combinator.
      else {
        return (child.type === "non-space-combinator") ?
          " " + child.lexeme + " " :
          " ";
      }
    }).join("");
  }

  transformCompoundSelector(selector, id) {
    // Initialize a "hasClass" flag reference that is raised by
    // transformSimpleSelector() if the selector is a regular class selector.
    // When the simple selectors has been transformed, we then check that if
    // isTrusted is falsy, then the hasClass flag must have been raised.
    let hasClassRef = [false];
    let transformedCompoundSelector = selector.map(child => (
      this.transformSimpleSelector(child, id, hasClassRef)
    )).join("");

    if (!isTrusted && !hasClassRef[0]) {
      return "._/* Style sheet trust required */._";
    }
    return transformedCompoundSelector;
  }

  transformSimpleSelector(
    selector, id, hasClassRef
  ) {
    let type = selector.type;
    if (type === "class-selector") {
      // Raise the hasClass flag.
      hasClassRef[0] = true;

      // If the class name does not contain any underscores to begin with,
      // append the id to the class, after an underscore. And if it does, check
      // that it is a leading one and that isTrusted is true, as trusted style
      // sheets are allowed to style classes that are set by dev functions,
      // such as e.g. "_failed" or "_pending-style".
      let className = selector.className;
      let indOfUnderscore = className.indexOf("_");
      if (indOfUnderscore === -1) {
        return "." + className + "_" + id;
      }
      else if (indOfUnderscore === 1) {
        if (!isTrusted) {
          return "._/* Style sheet trust required */._";
        }
        return "." + className;
      }
      else {
        return "._/* No non-leading underscores are allowed in a class */._";
      }
    }
    else if (type === "pseudo-class-selector") {
      let argument = selector.argument; 
      let argType = argument?.type;
      let tuple;
      if (argType === "selector-list") {
        tuple = "(" +
          argument.children.map(selector => {
            this.transformComplexSelector(
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
      return "*";
    }
    else if (type === "type-selector") {
      return selector.lexeme;
    }
    else throw "CSSTransformer.transformSimpleSelector(): Unrecognized type";
  }


}





export const cssTransformer = new CSSTransformer();


export {cssTransformer as default};
