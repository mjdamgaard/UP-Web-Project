
import {cssParser} from "./CSSParser.js";
import {getString, parseString}
from "../../../../interpreting/ScriptInterpreter.js";


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
    styleSheet = getString(styleSheet, node, env);
    let [styleSheetNode] = parseString(styleSheet, node, env, cssParser);
    let styleSheetTemplate = this.transformParsedStyleSheet(styleSheetNode);
    return styleSheetTemplate;
  }


  transformParsedStyleSheet(styleSheetNode, indentSpace = "") {
    return styleSheetNode.stmtArr.map(stmt => (
      this.transformStatement(stmt, indentSpace)
    )).join("\n");
  }


  transformStatement(stmt, indentSpace) {
    let type = stmt.type;
    if (type === "ruleset") {
      return this.transformRuleset(stmt, indentSpace);
    }
    else if (type === "at-rule") {
      return this.transformAtRule(stmt, indentSpace);
    }
    else throw (
      "Unrecognized CSS statement type: " + type
    );
  }


  transformRuleset(stmt, indentSpace) {
    // Transform the selector.
    let transformedSelectorList = this.transformSelectorList(stmt.selectorList);

    // Return the rule with the transformed selector list and the transformed
    // declarations inside the rule.
    return (
      indentSpace + transformedSelectorList + " {\n" +
        stmt.decArr.map(dec => (
          this.transformDeclaration(dec, indentSpace + "  ")
      )).join("") +
      indentSpace + "}\n"
    );
  }


  transformDeclaration(dec, indentSpace) {
    // TODO: Convert aný large numerical value to a maximal one, and let that
    // value be significantly less than the actual maximal value for CSS, which
    // will then in particular allow the web page that shows the UP app (the
    // "app frame," as I've often called it) to use larger z-indices then the
    // UP app can. ..(And let us also similarly limit negative values.)
    return indentSpace + dec.propName + ": " + dec.valueArr.map(
      valueNode => this.transformValue(valueNode)
    ).join(" ") + ";\n";
  }


  transformValue(valueNode) {
    if (valueNode.type === "function-call") {
      return valueNode.ident + "(" +
        valueNode.valOrOpArr.map(valOrOp => {
          return (valOrOp.type === "operator") ? valOrOp.lexeme :
            this.transformValue(valOrOp);
        }).join(" ").replaceAll(" ,", ",") +
      ")";
    }
    else {
      return valueNode.value ?? valueNode.lexeme;
    }
  }


  transformSelectorList(selectorList) {
    return selectorList.children.map(selector => (
      this.transformSelector(selector)
    )).join(", ");
  }


  transformSelector(selector) {
    if (selector.type === "compound-selector") {
      return this.transformCompoundSelector(selector);
    }

    // The children of a complex selector node are the compound selectors at
    // every even index, starting with (and possibly ending in) 0, and then the
    // combinators at every odd index.
    return selector.children.map((child, ind) => {
      // For even indices, transform the given compound selector.
      if (ind % 2 === 0) {
        return this.transformCompoundSelector(child);
      }
      // For odd indices, transform the given combinator.
      else {
        return (child.type === "non-space-combinator") ?
          " " + child.lexeme + " " :
          " ";
      }
    }).join("");
  }

  transformCompoundSelector(selector) {
    // First transform the "main children,"" i.e. all simple selectors but the
    // trailing pseudo-element if there is one.
    let transformedMainChildren = selector.mainChildren.map(child => (
      this.transformSimpleSelector(child)
    )).join("");

    // Then append ":where(.c\cid)" to that part, where "\cid" is a
    // placeholder that is meant to be replaced by a component ID.
    transformedMainChildren = transformedMainChildren + ":where(.c\\cid)";

    // Then append the pseudo-element if any, and return the result.
    let pseudoElement = selector.pseudoElement;
    return pseudoElement ?
      transformedMainChildren + this.transformSimpleSelector(pseudoElement) :
      transformedMainChildren;
  }

  transformSimpleSelector(selector) {
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
        tuple = "(" + this.transformSelectorList(argument) + ")";
      }
      else if (argType === "integer") {
        tuple = "(" + argument.lexeme + ")";
      }
      return ":" + selector.lexeme + (tuple ?? "");
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



  transformAtRule(stmt, indentSpace) {
    // Transform the parameters.
    let transformedParameterList = this.transformAtRuleParameterList(
      stmt.params
    );

    // Return the at-rule with the transformed parameter list, either followed
    // by a ";" or by a block with a nested style sheet, if the 'content'
    // property is defined.
    return (
      indentSpace + stmt.atKeyword + " " + transformedParameterList + (
        stmt.content === undefined ? ";" : " {\n" +
          this.transformParsedStyleSheet(stmt.content, indentSpace + "  ") +
        indentSpace + "}\n"
      )
    );
  }


  transformAtRuleParameterList(params) {
    return params.map(param => {
      if (param.type === "identifier") {
        return param.lexeme;
      }
      else if (param.type === "style-feature") {
        if (param.subType === "relation") {
          let op = (param.operator === ":") ? ": " :
            " " +  param.operator + " ";
          return "(" +
            param.property + op + this.transformValue(param.value) +
          ")";
        }
        else if (param.subType === "range") {
          return "(" +
            this.transformValue(param.loVal) + " " +  param.loOp + " " +
            param.property + " " + param.hiOp + " " +
            this.transformValue(param.hiVal) +
          ")";
        }
      }
      else throw "transformAtRuleParameterList(): Unrecognized param.type"
    }).join(" ");
  }


  transformAtRuleContent(content, indentSpace) {
    if (content.type === "style-sheet") {
      return this.transformParsedStyleSheet(content, indentSpace);
    }
    else if (content.type === "keyframes-content") {
      return this.transformKeyframesContent(content, indentSpace);
    }
    else throw "transformAtRuleContent(): Unrecognized content.type"
  }


  transformKeyframesContent(content, indentSpace) {
    return content.stmtArr.map(stmt => (
      indentSpace + stmt.offset + (!stmt.decArr ? ",\n" : " {\n" +
        stmt.decArr.map(dec => (
          this.transformDeclaration(dec, indentSpace + "  ")
        )).join("") +
      indentSpace + "}\n")
    )).join("");
  }

}





export const cssTransformer = new CSSTransformer();


export {cssTransformer as default};
