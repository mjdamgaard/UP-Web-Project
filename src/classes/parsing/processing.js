





export function straightenListSyntaxTree(
  children, ruleInd, type, keepDelimiters = false, maxRuleInd = 1,
) {
  let listChildren;
  if (!keepDelimiters) {
    if (ruleInd < maxRuleInd) {
      let lastChild = children.at(-1);
      if (lastChild.type = type) {
        listChildren = [children[0], ...lastChild.children];
      }
      else {
        listChildren = [children[0], lastChild];
      };
    }
    else {
      listChildren = [children[0]];
    }
  }
  else {
    if (ruleInd < maxRuleInd) {
      let lastChild = children.at(-1);
      if (lastChild.type = type) {
        listChildren = [children.slice(0, -1), ...lastChild.children];
      }
      else {
        listChildren = [children.slice(0, -1), lastChild];
      };
    }
    else {
      listChildren = [children[0]];
    }
  }
  return {
    type: type,
    children: listChildren,
  };
}


export function copyFromChild(
  children, _, childInd = 0, subtypeName = "subtype"
) {
  return {
    ...children[childInd],
    type: undefined,
    [subtypeName]: children[childInd].type,
  };
}

export function copyLexemeFromChild(children, _, childInd = 0) {
  return {
    lexeme: children[childInd],
  };
}

export function becomeChild(children, _, childInd = 0) {
  return children[childInd];
}



export function processPolyadicInfixOperation(
  children, ruleInd, type, maxRuleInd = 1
) {
  if (ruleInd === maxRuleInd) {
    return copyFromChild(children);
  } else {
    return straightenListSyntaxTree(children, ruleInd, type, true, maxRuleInd);
  }
}


export function processLeftAssocPostfixes(expInd, postfixListInd, type) {
  return (syntaxTree) => {
    let ret = syntaxTree.children[expInd].res;
    let postfixes = syntaxTree.children[postfixListInd].res;
    let len = postfixes.length;
    for (let i = 0; i < len; i++) {
      ret = {
        type: type,
        exp: ret,
        postfix: postfixes[i],
      }
    }
    return ret;
  }
}
