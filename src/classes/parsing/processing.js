





export function straightenListSyntaxTree(
  children, ruleInd, keepDelimiters = false, maxRuleInd = 1,
) {
  if (!keepDelimiters) {
    if (ruleInd < maxRuleInd) {
      return [
        children[0],
        ...children.at(-1),
      ];
    } else {
      return [children[0]];
    }
  } else {
    if (ruleInd < maxRuleInd) {
      return [
        ...children.slice(0, -1),
        ...children.at(-1),
      ];
    } else {
      return [children[0]];
    }
  }
}





export function processPolyadicInfixOperation(
  children, ruleInd, type, ruleNum = 2
) {
  if (ruleInd === 0) {
    if (children.at(-1).type === type) {
      return {
        type: type,
        ...straightenListSyntaxTree(children, ruleInd, true, ruleNum),
      };
    }
    else return {type: type};
  }
  else {
    return becomeFstChild(syntaxTree);
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
