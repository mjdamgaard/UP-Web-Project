
import {cssParser} from "./CSSParser.js";
import {parseString} from "../../../../interpreting/ScriptInterpreter.js";


const COMPONENT_ID_PLACEHOLDER = /(?<!\\)\\cid/g;
const STYLE_SHEET_ID_PLACEHOLDER = /(?<!\\)\\sid/g;


export class CSSTransformer {

  // instantiateStyleSheetTemplate() takes a template as returned from
  // transformStyleSheet() below, as well as a component ID (of the root
  // component of the current style scope) and a style sheet ID, and creates
  // an instance of that template, which is a valid CSS string ready to be
  // inserted in the document head.
  instantiateStyleSheetTemplate(
    styleSheetTemplate, componentID, styleSheetID
  ) {
    return styleSheetTemplate.replaceAll(
      COMPONENT_ID_PLACEHOLDER, componentID
    ).replaceAll(
      STYLE_SHEET_ID_PLACEHOLDER, styleSheetID
    );
  }


  // transformStyleSheet() parses and transforms the input styleSheet into a
  // style sheet template with "\sid" and "\cid" placeholders, which are
  // substituted respectively with the style sheet ID and a component ID for
  // the relevant style scope component before the style sheet is ready to be
  // inserted in the document head.
  transformStyleSheet(styleSheet, node, env) {
    // Transform the style sheet and push each class occurrence to a classes
    // array in the process.
    let classes = [];
    let styleSheetNode = parseString(styleSheet, node, env, cssParser);
    let styleSheetTemplate = styleSheetNode.stmtArr.map(stmt => (
      this.transformStatement(stmt, classes)
    )).join("\n");

    // Remove duplicates from the classes array, and return it along with the
    // template.
    classes = [...new Set(classes)];
    return [styleSheetTemplate, classes]
  }


  transformStatement(stmt, classes, indentSpace = "") {
    let type = stmt.type;
    if (type === "ruleset") {
      return this.transformRuleset(stmt, classes, indentSpace);
    }
    else if (type === "at-rule") {
      return indentSpace +
        "/* Error: At-rules are not implemented just yet */\n"
    }
    else throw (
      "Unrecognized CSS statement type: " + type
    );
  }


  transformRuleset(stmt, classes, indentSpace) {
    // Transform the selector.
    let transformedSelectorList = this.transformSelectorList(
      stmt.selectorList, classes
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


  transformSelectorList(selectorList, classes = []) {
    return selectorList.children.map(selector => (
      this.transformComplexSelector(selector, classes)
    )).join(", ");
  }


  transformComplexSelector(selector, classes = []) {
    // The children of a complex selector node are the compound selectors at
    // every even index, starting with (and possibly ending in) 0, and then the
    // combinators at every odd index.
    return selector.children.map((child, ind) => {
      // For even indices, transform the given compound selector.
      if (ind % 2 === 0) {
        return this.transformCompoundSelector(child, classes);
      }
      // For odd indices, transform the given combinator.
      else {
        return (child.type === "non-space-combinator") ?
          " " + child.lexeme + " " :
          " ";
      }
    }).join("");
  }

  transformCompoundSelector(selector, classes) {
    // First transform the "main children,"" i.e. all simple selectors but the
    // trailing pseudo-element if there is one.
    let transformedMainChildren = selector.mainChildren.map(child => (
      this.transformSimpleSelector(child, classes)
    )).join("");

    // Then append ":where(.c\cid)" to that part, where "\cid" is a
    // placeholder that is meant to be replaced by a component ID.
    transformedMainChildren = transformedMainChildren + ":where(.c\\cid)";

    // Then append the pseudo-element if any, and return the result.
    let pseudoElement = selector.pseudoElement;
    return pseudoElement ? transformedMainChildren + transformSimpleSelector(
      pseudoElement, classes
    ) : transformedMainChildren;
  }

  transformSimpleSelector(selector, classes) {
    let type = selector.type;
    if (type === "class-selector") {
      let className = selector.className;

      // If the class name has a leading underscore, leave it as it is, and do
      // not push it to classes. This is because such classes are built-in,
      // dev-defined classes for which the style sheets are free to define
      // their own styles.
      let indOfUnderscore = className.indexOf("_");
      if (indOfUnderscore === 0 && className.length > 1) {
        return "." + className;
      }

      // Else if there are no underscore, push the untransformed class name to
      // the classes array, and return a transformed version where "_\sid" is
      // appended to it. 
      else if (indOfUnderscore === -1) {
        classes.push(className);
        return "." + className + "_\\sid";
      }
      else {
        return "._/* No non-leading underscores are allowed in classes */._";
      }
    }
    else if (type === "pseudo-class-selector") {
      let argument = selector.argument; 
      let argType = argument?.type;
      let tuple;
      if (argType === "selector-list") {
        tuple = "(" + this.transformSelectorList(argument, classes) + ")";
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
