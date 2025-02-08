
import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";

import {PriorityCache} from "./PriorityCache.js";
import {Parser} from "./Parser.js";

const entitySyntaxTreeCache = new PriorityCache(200);

const ARRAY_TYPE_MAX_LEN = 20;



export class DataParser {

  static parseEntity(
    entType, defStr, len, creatorID, isEditable, readerWhitelistID
  ) {
    switch (entType) {
      case "r":
        return this.parseRegularEntity(
          defStr, len, creatorID, isEditable, readerWhitelistID
        );
      case "f":
        return this.parseFunctionEntity(
          defStr, len, creatorID, isEditable, readerWhitelistID
        );
      case "h":
        return this.parseHTMLEntity(
          defStr, len, creatorID, isEditable, readerWhitelistID
        );
      // TODO: Continue.
      default:
        throw "DataParser.parseEntity(): Unrecognized entType.";
    }
  }

  static parseRegularEntity(
    defStr, len, creatorID, isEditable, readerWhitelistID
  ) {

  }

  static parseFunctionEntity(
    defStr, len, creatorID, isEditable, readerWhitelistID
  ) {
    
  }

  static parseHTMLEntity(
    defStr, len, creatorID, isEditable, readerWhitelistID
  ) {
    
  }


}















export function straightenListSyntaxTree(
  delimiterNum = 1, storeDelimiters = false, ruleNum = 2,
) {
  let maxRuleInd = ruleNum - 1;
  if (storeDelimiters && delimiterNum === 1) {
    return (syntaxTree) => {
      syntaxTree.children = (syntaxTree.ruleInd !== maxRuleInd) ? [
        syntaxTree.children[0],
        ...syntaxTree.children[2].children,
      ] : [
        syntaxTree.children[0]
      ];
      syntaxTree.delimiters = [
        syntaxTree.children[1],
        ...syntaxTree.children[2].delimiters,
      ];
    }
  } else if (storeDelimiters) {
    return (syntaxTree) => {
      syntaxTree.children = (syntaxTree.ruleInd !== maxRuleInd) ? [
        syntaxTree.children[0],
        ...syntaxTree.children[1 + delimiterNum].children,
      ] : [
        syntaxTree.children[0]
      ];
      syntaxTree.delimiters = [
        syntaxTree.children.slice(1, -1),
        ...syntaxTree.children[1 + delimiterNum].delimiters,
      ];
    }
  } else {
    return (syntaxTree) => {
      syntaxTree.children = (syntaxTree.ruleInd !== maxRuleInd) ? [
        syntaxTree.children[0],
        ...syntaxTree.children[1 + delimiterNum].children,
      ] : [
        syntaxTree.children[0]
      ];
    }
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









const jsonGrammar = {
  "json-object": {
    rules: [
      ["object"],
      ["array"],
    ],
    process: becomeChild(0),
  },
  "literal-list": {
    rules: [
      ["literal", "/,/", "literal-list!"],
      ["literal"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "literal": {
    rules: [
      ["string"],
      ["number"],
      ["constant"],
      ["array!1"],
      ["object"],
    ],
    process: becomeChild(0),
  },
  "string": {
    rules: [
      [/"([^"\\]|\\[.\n])*"/],
    ],
    process: (syntaxTree) => {
      // Concat all the nested lexemes.
      let stringLiteral = syntaxTree.children[0].lexeme;

      // Test that the resulting string is a valid JSON string. 
      try {
        JSON.parse(stringLiteral);
      } catch (error) {
        return [false, `Invalid JSON string: ${stringLiteral}`];
      }

      syntaxTree.strLit = stringLiteral;
    },
  },
  "number": {
    rules: [
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/],
    ],
    process: copyLexemeFromChild(0),
  },
  "constant": {
    rules: [
      ["/true|false|null/"],
    ],
    process: copyLexemeFromChild(0),
  },
  "array": {
    rules: [
      [/\[/, "literal-list!1", /\]/],
      [/\[/, /\]/],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.children = syntaxTree.children[1].children;
      } else {
        syntaxTree.children = []
      }
    },
  },
  "object": {
    rules: [
      [/\{/, "member-list!1", /\}/],
      [/\{/, /\}/],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.children = syntaxTree.children[1].children;
      } else {
        syntaxTree.children = []
      }
    },
  },
  "member-list": {
    rules: [
      ["member", "/,/", "member-list!"],
      ["member"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "member": {
    rules: [
      ["string", "/:/", "literal"],
    ],
    process: (syntaxTree) => {
      syntaxTree.name = syntaxTree.children[0];
      syntaxTree.val = syntaxTree.children[2];
    },
  },
};

// const jsonParser = new Parser(
//   jsonGrammar,
//   "literal",
//   [
//     /"([^"\\]|\\[.\n])*"/,
//     /\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
//     /=>|@[\[\{<]|[,:\[\]\{\}\(\)>\?=]/,
//     "/true|false|null/",
//   ],
//   /\s+/
// );




// We only overwrite some of the nonterminal symbols in the JSON grammar.
const regEntGrammar = {
  ...jsonGrammar,
  "literal": {
    rules: [
      ["entity-reference!1"],
      ["input-placeholder!1"],
      ["mixed-string"],
      ["number"],
      ["constant"],
      ["array!1"],
      ["object"],
    ],
    process: becomeChild(0),
  },
  "constant": {
    rules: [
      ["/_|true|false|null/"],
    ],
    process: copyLexemeFromChild(0),
  },
  "mixed-string": {
    ...jsonGrammar["string"],
    process: (syntaxTree) => {
      let [isSuccess = true, error] =
        jsonGrammar["string"].process(syntaxTree) || [];
      if (!isSuccess) {
        return [false, error];
      }

      let [subSyntaxTree] = regEntStringContentParser.parse(
        syntaxTree.strLit.slice(1, -1)
      );

      Object.assign(syntaxTree, subSyntaxTree);

      if (!subSyntaxTree.isSuccess) {
        return [false, subSyntaxTree.error];
      }
    },
  },
  "entity-reference": {
    rules: [
      [/@\[/, /[_\$a-zA-Z0-9]+/,  "/\\]/!"],
      [/@\[/, /"[^"\\]*"/, /\]/],
    ],
    process: (syntaxTree) => {
      copyLexemeFromChild(1)(syntaxTree);
      syntaxTree.isTBD = (syntaxTree.ruleInd === 1);
    }
  },
  "input-placeholder": {
    rules: [
      [/@\{/, /0|[1-9][0-9]*/, /\}/],
    ],
    process: copyLexemeFromChild(1),
  },
};

export const regEntParser = new Parser(
  regEntGrammar,
  "literal-list",
  [
    /"([^"\\]|\\[.\n])*"/,
    // /'([^'\\]|\\[.\n])*'/,
    /\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
    /@[\[\{<];?|[,:\[\]\{\}>]/,
    /[_\$a-zA-Z0-9]+/,
  ],
  /\s+/
);






const regEntStringContentGrammar = {
  ...regEntGrammar,
  "string-content": {
    rules: [
      ["string-part*$"]
    ],
    process: becomeChild(0),
  },
  "string-part": {
    rules: [
      ["entity-reference!1"],
      ["input-placeholder!1"],
      ["escaped-bracket"],
      ["plain-text"],
    ],
  },
  "escaped-bracket": {
    rules: [
      [/@[\[\{<];/],
    ],
    process: copyLexemeFromChild(0),
  },
  "plain-text": {
    rules: [
      [/([^"\\@\]\}>]|\\[^@\]\}>]|)+/],
    ],
    process: copyLexemeFromChild(0),
  },
};


export const regEntStringContentParser = new Parser(
  regEntStringContentGrammar,
  "string-content",
  [
    /@[\[\{<];?/,
    /[\]\}>]/,
    /([^"\\@\]\}>]|\\[^@\]\}>])+/,
  ],
  false
);





const RESERVED_KEYWORD_REGEXP =
  /^(let|var|const|function|export|import|break|continue|return|throw)$/;




const scriptGrammar = {
  ...regEntGrammar,
  "script": {
    rules: [
      ["import-statement-list", "declaration-list"],
      ["import-statement-list", "expression", "/;/?"],
      ["declaration-list"],
    ],
    process: (syntaxTree) => {
      // ...
    },
  },
  "import-statement-list": {
    rules: [
      ["import-statement", "import-statement-list"],
      ["import-statement"],
    ],
    process: straightenListSyntaxTree(0),
  },
  "import-statement": {
    rules: [
      [
        "/import/", /\{/, "import-list", /\}/,
        "/from/", "entity-reference", "/;/"
      ],
    ],
    process: (syntaxTree) => {
      // ...
    },
  },
  "import-list": {
    rules: [
      ["import", "/,/", "import-list!1"],
      ["import", "/,/?"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "import": {
    rules: [
      ["identifier", "/as/", "identifier!"],
      ["identifier"],
    ],
    process: (syntaxTree) => {
      // ...
    },
  },
  "declaration-list": {
    rules: [
      ["declaration", "declaration-list"],
      ["declaration"],
    ],
    process: straightenListSyntaxTree(0),
  },
  "declaration": {
    rules: [
      ["/export/", "/default/", "variable-declaration"],
      ["/export/", "/default/", "function-declaration"],
      ["/export/", "variable-declaration"],
      ["/export/", "function-declaration"],
      ["variable-declaration"],
      ["function-declaration"],
    ],
    process: straightenListSyntaxTree(0),
  },
  "variable-declaration": {
    rules: [
      ["/let/", "variable-definition-list", "/;/!"],
      ["/let/", /\[/, "identifier-list"," /\\]/!", "/=/", "expression", "/;/"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "definition-list";
        syntaxTree.defList = syntaxTree.children[1];
      } else {
        syntaxTree.type = "destructuring";
        syntaxTree.identList = syntaxTree.children[2];
        syntaxTree.exp = syntaxTree.children[5];
      }
    },
  },
  "identifier-list": {
    rules: [
      ["identifier", "/,/", "identifier-list!1"],
      ["identifier", "/,/?"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "identifier": {
    rules: [
      [/[_\$a-zA-Z][_\$a-zA-Z0-9]*/],
    ],
    process: (syntaxTree) => {
      syntaxTree.lexeme = syntaxTree.children[0].lexeme;
      return [
        !RESERVED_KEYWORD_REGEXP.test(syntaxTree.lexeme)
      ];
    },
  },
  "variable-definition-list": {
    rules: [
      ["variable-definition", "/,/", "variable-definition-list!"],
      ["variable-definition"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "variable-definition": {
    rules: [
      ["identifier", "/=/", "expression"],
      ["identifier"],
    ],
    process: (syntaxTree) => {
      Object.assign(syntaxTree, {
        ident: syntaxTree.children[0],
        exp: syntaxTree.children[2] || undefined,
      });
    },
  },
  "function-declaration": {
    rules: [
      [
        "/function/", "identifier", /\(/, "parameter-list", /\)/,
        /\{/, "statement-list!", /\}/
      ],
      [
        "identifier", /\(/, "parameter-list", /\)/, "/=>/",
        /\(/, "expression!", /\)/
      ],
    ],
    process: (syntaxTree) => {
      let children = syntaxTree.children;
      if (syntaxTree.ruleInd === 0) {
        Object.assign(syntaxTree, {
          type: "procedure-function",
          name: children[0].lexeme,
          params: children[2].children,
          stmts: children[5],
        });
      } else {
        Object.assign(syntaxTree, {
          type: "expression-function",
          name: children[0].lexeme,
          params: children[2].children,
          return: children[5],
        });
      }
    },
  },
  "parameter-list": {
    rules: [
      ["parameter", "/,/", "parameter-list!1"],
      ["parameter", "/,/?"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "parameter": {
    rules: [
      [/"([^"\\]|\\[.\n])*"/, "/:/", "type"],
    ],
    process: (syntaxTree) => {
      let children = syntaxTree.children;
      Object.assign(syntaxTree, {
        name: children[0].lexeme,
        type: children[2],
      });
    },
  },
  "type": {
    rules: [
      ["type^(1)", "/\\?/"],
      ["type^(1)", "/=/", "literal!"],
      ["type^(1)"],
    ],
    process: (syntaxTree) => {
      syntaxTree.type = syntaxTree.children[0];
      syntaxTree.isOptional = syntaxTree.children[1] ? true : false;
      syntaxTree.defaultVal = syntaxTree.children[2] || undefined;
    },
  },
  "type^(1)": {
    rules: [
      [/\{/, "type^(2)-list!", /\}/],
      ["type^(2)"],
    ],
    process: (syntaxTree) => {
      syntaxTree.types = (syntaxTree.ruleInd === 0) ?
        syntaxTree.children[1].children :
        [syntaxTree.children[0]];
    },
  },
  "type^(2)-list": {
    rules: [
      ["type^(2)", "/,/", "type^(2)-list!1"],
      ["type^(2)", "/,/?"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "type^(2)": {
    rules: [
      [/\[/, "type^(3)-list", /\]/, "array-type-operator"],
      [/\[/, "type^(3)-list!", /\]/],
      ["type^(3)", "array-type-operator"],
      ["type^(3)"],
    ],
    process: (syntaxTree) => {
      let ruleInd = syntaxTree.ruleInd;
      let children = syntaxTree.children;
      if (ruleInd <= 1) {
        syntaxTree.types = children[1].children;
        syntaxTree.arrayLen = (ruleInd === 0) ? children[3].num : 0;
      } else {
        syntaxTree.types = [children[0]];
        syntaxTree.arrayLen = (ruleInd === 2) ? children[1].num : 0;
      }
    },
  },
  "array-type-operator": {
    rules: [
      [/\[/, "/[1-9][0-9]*/", "/\\]/!"],
      [/\[/, /\]/],
    ],
    process: (syntaxTree) => {
      let numLiteral = (syntaxTree.ruleInd === 0) ?
        syntaxTree.children[1].lexeme :
        null;
      let num = parseInt(numLiteral);

      if (numLiteral !== null && (num.toString !== numLiteral || num === 1)) {
        return [false, `Invalid array length: ${numLiteral}`];
      }

      syntaxTree.num = (numLiteral === null) ? null : num;
    },
  },
  "type^(3)-list": {
    rules: [
      ["type^(3)", "/,/", "type^(3)-list!1"],
      ["type^(3)", "/,/?"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "type^(3)": {
    rules: [
      ["entity-reference"], // A class.
      [/[tuafrjh8dl]|string|bool|int|float/],
      [/object|array|mixed/], // User has to manually type in a parsable
      // literal.
    ],
    process: copyLexemeFromChild(0),
  },
  "statement-list": {
    rules: [
      ["statement", "statement-list"],
      ["statement"],
    ],
    process: straightenListSyntaxTree(0),
  },
  "statement": {
    rules: [
      ["block-statement!1"],
      ["if-else-statement!1"],
      ["loop-statement!1"],
      ["variable-declaration!1"],
      ["return-statement!1"],
      ["throw-statement!1"],
      ["instruction-statement!1"],
      ["empty-statement!1"],
      ["expression", "/;/"],
    ],
    process: becomeChild(0)
  },
  "block-statement": {
    rules: [
      [/\{/, "statement-list?", /\}/],
    ],
    process: becomeChild(1),
  },
  "if-else-statement": {
    rules: [
      ["/if/", /\(/, "expression", /\)/, "statement", "/else/", "statement!"],
      ["/if/", /\(/, "expression", /\)/, "statement"],
    ],
    process: (syntaxTree) => {
      Object.assign(syntaxTree, {
        cond: syntaxTree.children[2],
        ifStmt: syntaxTree.children[4],
        elseStmt: syntaxTree.children[6],
      });
    },
  },
  "loop-statement": {
    rules: [
      ["/while/", "/\\(/!", "expression", "/\\)/", "statement",],
      ["/do/", "statement!", "/while/", "/\\(/", "expression", "/\\)/"],
      [
        "/for/", "/\\(/", "statement", "statement", "expression", "/\\)/",
        "statement",
      ],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        Object.assign(syntaxTree, {
          dec:        undefined,
          cond:       syntaxTree.children[2],
          updateStmt: undefined,
          stmt:       syntaxTree.children[4],
          doFirst:    false,
        });
      } else if (syntaxTree.ruleInd === 1) {
        Object.assign(syntaxTree, {
          dec:        undefined,
          cond:       syntaxTree.children[4],
          updateStmt: undefined,
          stmt:       syntaxTree.children[1],
          doFirst:    true,
        });
      } else {
        Object.assign(syntaxTree, {
          dec:        syntaxTree.children[2],
          cond:       syntaxTree.children[3],
          updateStmt: syntaxTree.children[4],
          stmt:       syntaxTree.children[6],
          doFirst:    false,
        });
      }
    },
  },
  "return-statement": {
    rules: [
      ["/return/", "expression", "/;/"],
    ],
    process: (syntaxTree) => {
      syntaxTree.exp = syntaxTree.children[1];
    },
  },
  "throw-statement": {
    rules: [
      ["/throw/", "expression", "/;/"],
    ],
    process: (syntaxTree) => {
      syntaxTree.exp = syntaxTree.children[1];
    },
  },
  "instruction-statement": {
    rules: [
      ["/break|continue/", "/;/"],
    ],
    process: copyLexemeFromChild(0),
  },
  "empty-statement": {
    rules: [
      ["/;/"],
    ],
  },
  "expression-list": {
    rules: [
      ["expression", "/,/", "expression-list!1"],
      ["expression", "/,/?"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "expression": {
    rules: [
      ["expression^(1)", /=|\+=|\-=|\*=|&&=|\|\|=|\?\?=/, "expression!"],
      ["expression^(1)", /\?/, "expression!", /:/, "expression"],
      ["expression^(1)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        Object.assign(syntaxTree, {
          type: "assignment",
          op: syntaxTree.children[1].lexeme,
          exp1: syntaxTree.children[0],
          exp2: syntaxTree.children[2],
        });
      } else if (syntaxTree.ruleInd === 1) {
        Object.assign(syntaxTree, {
          type: "conditional-expression",
          cond: syntaxTree.children[0],
          exp1: syntaxTree.children[2],
          exp2: syntaxTree.children[4],
        });
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(1)": {
    rules: [
      ["expression^(2)", /(\|\|)|(\?\?)/, "expression^(1)!"],
      ["expression^(2)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "or-expression";
        straightenListSyntaxTree(1, true)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(2)": {
    rules: [
      ["expression^(3)", "/&&/", "expression^(2)!"],
      ["expression^(3)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "and-expression";
        straightenListSyntaxTree(1, false)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(3)": {
    rules: [
      ["expression^(4)", /\|/, "expression^(3)!"],
      ["expression^(4)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "bitwise-or-expression";
        straightenListSyntaxTree(1, false)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(4)": {
    rules: [
      ["expression^(5)", /\^/, "expression^(4)!"],
      ["expression^(5)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "bitwise-xor-expression";
        straightenListSyntaxTree(1, false)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(5)": {
    rules: [
      ["expression^(6)", /\&/, "expression^(5)!"],
      ["expression^(6)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "bitwise-and-expression";
        straightenListSyntaxTree(1, false)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(6)": {
    rules: [
      ["expression^(7)", "/===|!==|==|!=/", "expression^(6)!"],
      ["expression^(7)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "equality-expression";
        straightenListSyntaxTree(1, true)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(7)": {
    rules: [
      ["expression^(8)", "/<|>|<=|>=/", "expression^(7)!"],
      ["expression^(8)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "relational-expression";
        straightenListSyntaxTree(1, true)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(8)": {
    rules: [
      ["expression^(9)", "/<<|>>|>>>/", "expression^(8)!"],
      ["expression^(9)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "shift-expression";
        straightenListSyntaxTree(1, true)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(9)": {
    rules: [
      ["expression^(10)", "/\\+|\\-/", "expression^(9)!"],
      ["expression^(10)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "additive-expression";
        straightenListSyntaxTree(1, true)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(10)": {
    rules: [
      ["expression^(11)", "/\\*|\\/|%/", "expression^(10)!"],
      ["expression^(11)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "multiplicative-expression";
        straightenListSyntaxTree(1, true)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(11)": {
    rules: [
      ["expression^(12)", "/\\*\\*/", "expression^(11)!"],
      ["expression^(12)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "exponential-expression";
        syntaxTree.root = syntaxTree.children[0];
        syntaxTree.exp = syntaxTree.children[2];
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(12)": {
    rules: [
      [
        "/\\+\\+|\\-\\-|!|~|\\+|\\-|typeof|void|delete|await/",
        "expression^(13)!"
      ],
      ["expression^(13)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "prefix-expression";
        syntaxTree.op = syntaxTree.children[0].lexeme;
        syntaxTree.exp = syntaxTree.children[1];
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(13)": {
    rules: [
      ["expression^(14)", "/\\+\\+|\\-\\-/"],
      ["expression^(14)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "postfix-expression";
        syntaxTree.op = syntaxTree.children[0].lexeme;
        syntaxTree.exp = syntaxTree.children[1];
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(14)": {
    rules: [
      ["identifier", "expression-tuple!1"],
      ["expression^(15)", /\->/, "identifier!", "expression-tuple"],
      ["expression^(15)"],
    ],
    process: (syntaxTree) => {
      let children = syntaxTree.children;
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "function-call";
        syntaxTree.fun = children[0];
        syntaxTree.tuple = children[1];
      }
      // A "virtual method call" is a syntactic sugar over a function call.
      else if (syntaxTree.ruleInd === 1) {
        syntaxTree.type = "function-call";
        syntaxTree.fun = children[0];
        let tuple = children[3];
        tuple.children = [obj].concat(tuple.children);
        syntaxTree.tuple = tuple;
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression-tuple": {
    rules: [
      [/\(/, "expression-list?", /\)/],
    ],
    process: becomeChild(1),
  },
  "expression^(15)": {
    rules: [
      ["expression^(16)", "member-accessor+"],
      ["expression^(16)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "member-access";
        syntaxTree.exp = syntaxTree.children[0];
        syntaxTree.indices = syntaxTree.children[1].children;
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "member-accessor": {
    rules: [
      [/\[/, "expression!", /\]/],
      [/\./, "identifier!"],
      [/\?/, /\./, "identifier"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "computed-accessor";
        syntaxTree.exp = syntaxTree.children[1];
      } else if (syntaxTree.ruleInd === 1) {
        syntaxTree.type = "identifier-accessor";
        syntaxTree.ident = syntaxTree.children[1];
      } else {
        syntaxTree.type = "optional-identifier-accessor";
        syntaxTree.ident = syntaxTree.children[2];
      }
    },
  },
  "expression^(16)": {
    rules: [
      [/\(/, "expression", /\)/],
      ["array!1"],
      ["object!1"],
      ["literal"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        becomeChild(1)(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "array": {
    rules: [
      [/\[/, "expression-list!1", /\]/],
      [/\[/, /\]/],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.children = syntaxTree.children[1].children;
      } else {
        syntaxTree.children = []
      }
    },
  },
  "object": {
    rules: [
      [/\{/, "member-list!1", /\}/],
      [/\{/, /\}/],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.children = syntaxTree.children[1].children;
      } else {
        syntaxTree.children = []
      }
    },
  },
  "member-list": {
    rules: [
      ["member", "/,/", "member-list!1"],
      ["member", "/,/?"],
    ],
    process: straightenListSyntaxTree(1),
  },
  "member": {
    rules: [
      ["identifier", "/:/", "expression"],
      ["string", "/:/", "expression"],
    ],
    process: (syntaxTree) => {
      syntaxTree.name = syntaxTree.children[0];
      syntaxTree.val = syntaxTree.children[2];
    },
  },
  "literal": {
    rules: [
      ["entity-reference!1"],
      ["input-placeholder!1"],
      ["string"],
      ["number"],
      ["constant"],
    ],
    process: becomeChild(0),
  },
  // "string": {
  // },
  "constant": {
    rules: [
      ["/true|false|null|undefined/"],
    ],
    process: copyLexemeFromChild(0),
  },
};


export const scriptParser = new Parser(
  scriptGrammar,
  "function",
  [
    /"([^"\\]|\\[.\n])*"/,
    // /'([^'\\]|\\[.\n])*'/,
    /\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
    /\+=|\-=|\*=|&&=|\|\|=|\?\?=/,
    /&&|\|\||\?\?|\+\+|\-\-|\*\*/,
    /<>|\->/,
    /===|==|!==|!=|<=|>=/,
    /@[\[\{<];?/,
    /[\.,:;\[\]\{\}\(\)<>\?=\+\-\*\|\^&!%\/]/,
    /[_\$a-zA-Z0-9]+/,
  ],
  /\s+|\/\/.*\n\s*|\/\*([^\*]|\*(?!\/))*(\*\/\s*|$)/
);




/* Tests */

// regEntParser.log(regEntParser.parse(
//   `12`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, 13`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!"`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `,`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `@`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `@[`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12,`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12,\[`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!",@[7],_,false`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!",@[7],_,false,`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!",@[7],_,false`, "literal-list"
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!",@[7],_,false`, "literal"
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"H`, "literal"
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12`, "literal", true
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12`, "literal", true, true
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12`, "literal+", true, true
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12`, "literal-list", true
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12,`, "literal-list", true
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12,@`, "literal-list", true
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, "Hello, @[7]!"`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, "Hello, @[7!"`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, [13, [14,[15 ,  16]]]`
// )[0]);
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, {"prop": [13]}, 13`
// )[0]);
// // Works.


// scriptParser.log(scriptParser.parse(
//   '(' + [
//     '"Name":string',
//     '"Parent class":@[classes]?',
//   ].join(',')
// )[0]);
// // Works.
scriptParser.log(scriptParser.parse(
  '(' + [
    '"Name":string',
    '"Parent class":@[\'classes\']?',
    // 'Member format?:(f::Function|t::Entity type)',
    '"Member type":string="r"',
    '"Member format":f?',
    '"Description":h?',
  ].join(',') +
  ')=>({' + [
    '"Class":@[\'classes\']',
    '"Name":@{1}',
    '"Parent class":@{2}',
    '"Member type":@{3}',
    '"Member format":@{4}',
    '"Description":@{5}',
  ].join(',') + '})'
)[0]);
// Works.


















const specialCharPattern =
  /=>|[,;:"'\/\\\+\-\.\*\?\|&@\(\)\[\]\{\}=<>]/;
const nonSpecialCharsPattern = new RegExp (
  "[^" + specialCharPattern.source.substring(1) + "+"
);


const doubleQuoteStringPattern =
  /"([^"\\]|\\[\s\S])*"/;
const xmlSpecialCharPattern =
  /[<>"'\\\/&;]/;

const xmlWSPattern = /\s+/;
const xmlLexemePatternArr = [
  doubleQuoteStringPattern,
  xmlSpecialCharPattern,
  nonSpecialCharsPattern,

];

const xmlGrammar = {
  "xml-text": {
    rules: [
      ["text-or-element*"],
    ],
    // process: (syntaxTree) => {
    //   let contentArr = syntaxTree.children[0].children;
    //   let children = contentArr;
    //   return [children];
    // },
  },
  "text-or-element": {
    rules: [
      ["element"],
      [/[^&'"<>]+/],
      ["/&/", /[#\w]+/, "/;/"],
    ],
  },
  "element": {
    rules: [
      [
        "/</", /[_a-zA-Z][_a-zA-Z0-9\-\.]*/, "attr-member*", "/>/",
        "xml-text",
        "/</", /\//, "element-name", "/>/"
      ],
      [
        "/</", /[_a-zA-Z][_a-zA-Z0-9\-\.]*/, "attr-member*", /\//, "/>/",
      ]
    ],
    process: (syntaxTree) => {
      let startTagName = syntaxTree.children[1].lexeme;
      if (/^[xX][mM][lL]/.test(startTagName)) {
        return [null, "Element name cannot start with 'xml'"]
      }

      let ruleInd = syntaxTree.ruleInd;
      if (ruleInd === 0) {
        let endTagName = syntaxTree.children[7].lexeme;
        if (endTagName !== startTagName) {
          return [null,
            "End tag </" + endTagName + "> does not match start tag <" +
            startTagName + ">"
          ];
        }
      }

      Object.assign(syntaxTree, {
        name: startTagName,
        attrMembers: syntaxTree.children[2].children,
        content: (ruleInd === 0) ? syntaxTree.children[4] : undefined,
        isSelfClosing: (ruleInd === 1),
      });
    },
  },
  "element-name": {
    rules: [
      [/[_a-zA-Z]+/, "/[_a-zA-Z0-9\\-\\.]+/*"],
    ],
    // (One could include a test() here to make sure it doesn't start with
    // /[xX][mM][lL]/.)
  },
  "attr-member": {
    rules: [
      ["attr-name", "/=/", "string"],
      ["attr-name", "/=/", "number"],
      ["attr-name", "/=/", "/true|false/"],
      ["attr-name"],
    ],
  },
  "attr-name": {
    rules: [
      // NOTE: This might very well be wrong. TODO: Correct.
      [/[_a-sA-Z]+/, "/[_a-sA-Z0-9\\-\\.]+/*"],
    ],
  },
  "string": {
    rules: [
      [doubleQuoteStringPattern],
    ],
    process: (children) => {
      // Test that the string is a valid JSON string.
      let stringLiteral = children[0].lexeme;
      try {
        JSON.parse(stringLiteral);
      } catch (error) {
        return [false, `Invalid JSON string: ${stringLiteral}`];
      }
      return [];
    },
  },
  "number": {
    rules: [
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/],
    ],
  },
}

export const xmlParser = new Parser(
  xmlGrammar, "xml-text", xmlLexemePatternArr, xmlWSPattern
);

// // Tests:
// xmlParser.log(xmlParser.parse(
//   `Hello, world!`
// ));
// xmlParser.log(xmlParser.parse(
//   `Hello, <i>world</i>.`
// ));
// xmlParser.log(xmlParser.parse(
//   `Hello, <i>world</wrong>.`
// ));
