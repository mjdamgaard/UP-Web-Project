





export function straightenListSyntaxTree(
  children, ruleInd, type, keepDelimiters = false, maxRuleInd = 1,
) {
  let listChildren;
  if (!keepDelimiters) {
    if (ruleInd < maxRuleInd) {
      let lastChild = children.at(-1);
      if (!type || lastChild.type === type) {
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
      if (!type || lastChild.type === type) {
        listChildren = [...children.slice(0, -1), ...lastChild.children];
      }
      else {
        listChildren = [...children.slice(0, -1), lastChild];
      };
    }
    else {
      listChildren = [children[0]];
    }
  }
  return type ? {
    type: type,
    children: listChildren,
  } : {
    children: listChildren,
  };
}


export function copyFromChild(children, _, type, childInd = 0) {
  return type ?
    {...children[childInd], type: type} :
    children[childInd];
}

export function copyLexemeFromChild(children, _, type, childInd = 0) {
  return type ?
    {lexeme: children[childInd], type: type} :
    {lexeme: children[childInd]};
}




export function processPolyadicInfixOperation(
  children, ruleInd, type, maxRuleInd = 1
) {
  if (ruleInd >= maxRuleInd) {
    return copyFromChild(children);
  } else {
    return straightenListSyntaxTree(children, ruleInd, type, true, maxRuleInd);
  }
}


export function processLeftAssocPostfixes(
  children, _, type, expInd = 0, postfixListInd = 1, 
) {
  let ret = children[expInd];
  let postfixes = children[postfixListInd];
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
