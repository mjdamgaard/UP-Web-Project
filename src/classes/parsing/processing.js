





export function straightenListSyntaxTree(
  syntaxTree, keepDelimiters = false, ruleNum = 2,
) {
  let maxRuleInd = ruleNum - 1;
  if (keepDelimiters) {
    if (syntaxTree.ruleInd < maxRuleInd) {
      return [
        ...syntaxTree.children.slice(0, -1),
        ...syntaxTree.children.at(-1).children,
      ];
    } else {
      return [syntaxTree.children[0]];
    }
  } else {
    if (syntaxTree.ruleInd < maxRuleInd) {
      return [
        syntaxTree.children[0],
        ...syntaxTree.children.at(-1).children,
      ];
    } else {
      return [syntaxTree.children[0]];
    }
  }
}

export function becomeChild(ind = 0) {
  return (syntaxTree) => {
    let child = syntaxTree.children[ind];
    return {
      ...child.res,
      type: child.res.type ?? child.sym,
    };
  }
}
export const becomeFstChild = becomeChild(0);
export const becomeSecChild = becomeChild(1);


export function copyLexemeFromChild(ind = 0) {
  return (syntaxTree) => ({
    lexeme: syntaxTree.children[ind].lexeme,
  });
}


// export function getLexemeArrayFromChildren(syntaxTree) {
//   if (syntaxTree.lexeme) {
//     return [syntaxTree.lexeme];
//   } else {
//     return [].concat(...syntaxTree.children.map(child => (
//       getLexemeArrayFromChildren(child)
//     )));
//   }
// }

// export function makeChildrenIntoLexemeArray(syntaxTree) {
//   syntaxTree.children = getLexemeArrayFromChildren(syntaxTree);
// }




export function processPolyadicInfixOperation(syntaxTree, type, ruleNum = 2) {
  if (syntaxTree.ruleInd === 0) {
    if (syntaxTree.children.at(-1).type === type) {
      return {
        type: type,
        ...straightenListSyntaxTree(syntaxTree, true, ruleNum),
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
