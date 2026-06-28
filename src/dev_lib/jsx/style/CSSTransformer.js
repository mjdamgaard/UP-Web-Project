

// TODO: This CSS transformer is now almost redundant, but for now we keep it
// just as an added layer of security if the CSSParser is faulty. But once the
// CSSParser has been sufficiently tested, parsing a style sheet should be
// enough to validate it. (This class used to actually transform the CSS, by
// e.g. transforming class names, but now it only essentially removes comments.)

export class CSSTransformer {

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

  transformRelativeSelectorList(relativeSelectorList) {
    return relativeSelectorList.children.map(relativeSelector => (
      this.transformRelativeSelector(relativeSelector)
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

  transformRelativeSelector(relativeSelector) {
    let {selector, combinator} = relativeSelector;
    let transformedSelector = this.transformSelector(selector);
    return (combinator) ?
      combinator.lexeme + " " + transformedSelector :
      transformedSelector;
  }


  transformCompoundSelector(selector) {
    // First transform the "main children,"" i.e. all simple selectors but the
    // trailing pseudo-element if there is one.
    let transformedMainChildren = selector.mainChildren.map(child => (
      this.transformSimpleSelector(child)
    )).join("");

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
      return "." + className;
    }
    else if (type === "pseudo-class-selector") {
      let argument = selector.argument; 
      let argType = argument?.type;
      let tuple;
      if (argType === "selector-list") {
        tuple = "(" + this.transformSelectorList(argument) + ")";
      }
      if (argType === "relative-selector-list") {
        tuple = "(" + this.transformRelativeSelectorList(argument) + ")";
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
      if (typeof param === "string") {
        return param;
      }
      if (param.lexeme) {
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
