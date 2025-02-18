





export function straightenListSyntaxTree(
  syntaxTree, keepDelimiters = false, ruleNum = 2,
) {
  let maxRuleInd = ruleNum - 1;
  if (keepDelimiters) {
    syntaxTree.children = (syntaxTree.ruleInd < maxRuleInd) ? [
      ...syntaxTree.children.slice(0, -1),
      ...syntaxTree.children.at(-1).children,
    ] : [
      syntaxTree.children[0]
    ];
  } else {
    syntaxTree.children = (syntaxTree.ruleInd < maxRuleInd) ? [
      syntaxTree.children[0],
      ...syntaxTree.children.at(-1).children,
    ] : [
      syntaxTree.children[0]
    ];
  }
}

export function becomeChild(ind = 0) {
  return (syntaxTree) => {
    let child = syntaxTree.children[ind];
    Object.assign(syntaxTree, {
      ruleInd: null,
      ...child,
      type: child.type ?? child.sym,
      sym: syntaxTree.sym,
    });
  }
}

export function copyLexemeFromChild(ind = 0) {
  return (syntaxTree) => {
    syntaxTree.lexeme = syntaxTree.children[ind].lexeme;
  }
}


export function getLexemeArrayFromChildren(syntaxTree) {
  if (syntaxTree.lexeme) {
    return [syntaxTree.lexeme];
  } else {
    return [].concat(...syntaxTree.children.map(child => (
      getLexemeArrayFromChildren(child)
    )));
  }
}

export function makeChildrenIntoLexemeArray(syntaxTree) {
  syntaxTree.children = getLexemeArrayFromChildren(syntaxTree);
}




export function processPolyadicInfixOperation(syntaxTree, type, ruleNum = 2) {
  if (syntaxTree.ruleInd === 0) {
    syntaxTree.type = type;
    if (syntaxTree.children.at(-1).type === type) {
      straightenListSyntaxTree(syntaxTree, true, ruleNum);
    }
  } else {
    becomeChild(0)(syntaxTree);
  }
}


export function processLeftAssocPostfixes(expInd, postfixListInd, type) {
  return (syntaxTree) => {
    let ret = syntaxTree.children[expInd];
    let postfixes = syntaxTree.children[postfixListInd].children;
    let len = postfixes.length;
    for (let i = 0; i < len; i++) {
      ret = {
        type: type,
        exp: ret,
        postfix: postfixes[i],
      }
    }
    Object.assign(syntaxTree, ret);
  }
}
