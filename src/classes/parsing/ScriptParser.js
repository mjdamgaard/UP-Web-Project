
import {Parser} from "./Parser.js";
import {regEntGrammar} from "./RegEntParser.js";
import {
  straightenListSyntaxTree, becomeChild, copyLexemeFromChild,
  processPolyadicInfixOperation, processLeftAssocPostfixes,
} from "./processing.js";





const RESERVED_KEYWORD_REGEXP = new RegExp(
  "^(let|var|const|this|function|export|import|break|continue|return|throw|" +
  "if|else|switch|case|void|typeof|instanceof|delete|await|class|static|" +
  "true|false|null|undefined|Infinity|NaN|try|catch|finally|for|while|do|" +
  "default|struct)$"
  // TODO: Continue this list.
);




export const scriptGrammar = {
  ...regEntGrammar,
  "script": {
    rules: [
      ["import-statement!1*", "outer-statement+$"],
    ],
    process: (syntaxTree) => {
      syntaxTree.importStmtArr = syntaxTree.children[0].children;
      syntaxTree.stmtArr = syntaxTree.children[1].children;
    },
  },
  "import-statement": {
    rules: [
      ["/import/", "import-list", "/from/", "entity-reference", "/;/"],
      ["/import/", "entity-reference", "/;/"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.importArr = syntaxTree.children[1].children;
        syntaxTree.moduleRef = syntaxTree.children[3];
        syntaxTree.structImports = syntaxTree.importArr
          .map(val => val.structRef ? [val.structRef, val.flagStr] : undefined)
          .filter(val => val);
      } else {
        syntaxTree.importArr = [];
        syntaxTree.moduleRef = syntaxTree.children[1];
        syntaxTree.structImports = [];
      }
    },
  },
  "import-list": {
    rules: [
      ["import", "/,/", "import-list!1"],
      ["import", "/,/?"],
    ],
    process: straightenListSyntaxTree,
  },
  "import": {
    rules: [
      [/\*/, "/as/!", "identifier"],
      [/\{/, "named-import-list!1?", /\}/],
      ["/struct/", "string", "entity-reference!", "/as/", "identifier"],
      ["/struct/", "entity-reference!", "/as/", "identifier"],
      ["identifier"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.namespaceIdent = syntaxTree.children[2].lexeme;
      } else if (syntaxTree.ruleInd === 1) {
        syntaxTree.namedImportArr = syntaxTree.children[1].children[0]
          ?.children ?? [];
      } else if (syntaxTree.ruleInd === 2) {
        syntaxTree.structRef = syntaxTree.children[1];
        syntaxTree.flagStr = syntaxTree.children[1].str;
        syntaxTree.structIdent = syntaxTree.children[4].lexeme;
      } else if (syntaxTree.ruleInd === 3) {
        syntaxTree.structRef = syntaxTree.children[1];
        syntaxTree.flagStr = "";
        syntaxTree.structIdent = syntaxTree.children[4].lexeme;
      } else {
        syntaxTree.defaultIdent = syntaxTree.children[0].lexeme;
      }
    },
  },
  "named-import-list": {
    rules: [
      ["named-import", "/,/", "named-import-list!1"],
      ["named-import", "/,/?"],
    ],
    process: straightenListSyntaxTree,
  },
  "named-import": {
    rules: [
      ["/default/", "/as/!", "identifier"],
      ["identifier", "/as/", "identifier!"],
      ["identifier"],
    ],
    process: (syntaxTree) => {
      syntaxTree.ident = (syntaxTree.ruleInd === 0) ? undefined :
        syntaxTree.children[0].lexeme;
      syntaxTree.alias = syntaxTree.children[2]?.lexeme;
    },
  },
  "outer-statement": {
    rules: [
      ["export-statement!1"],
      ["statement"],
    ],
    process: becomeChild(0),
  },
  "export-statement": {
    rules: [
      ["/export/", "/default/", "/struct/", "string", "statement!"],
      ["/export/", "/default/", "/struct/", "statement!"],
      ["/export/", "/default/", "statement!"],
      ["/export/", "/struct/", "string", /\{/, "export-list!1?!", /\}/],
      ["/export/", "/struct/", "string", "statement!"],
      ["/export/", "/struct/", /\{/, "export-list!1?!", /\}/],
      ["/export/", "/struct/", "statement!"],
      ["/export/", /\{/, "export-list!1?!", /\}/],
      ["/export/", "statement"],
    ],
    process: (syntaxTree) => {
      let ruleInd = syntaxTree.ruleInd;
      let stmt, flagStr, namedExportArr;
      if (ruleInd === 0) {
        flagStr = syntaxTree.children[3].str;
        stmt = syntaxTree.children[4];
      } else if (ruleInd === 1) {
        flagStr = "";
        stmt = syntaxTree.children[3];
      } else if (ruleInd === 2) {
        stmt = syntaxTree.children[2];
      } else if (ruleInd === 3) {
        flagStr = syntaxTree.children[2].str;
        namedExportArr = syntaxTree.children[4].children[0]?.children ?? [];
      } else if (ruleInd === 4) {
        flagStr = syntaxTree.children[2].str;
        stmt = syntaxTree.children[3];
      } else if (ruleInd === 5) {
        flagStr = "";
        namedExportArr = syntaxTree.children[3].children[0]?.children ?? [];
      } else if (ruleInd === 5) {
        flagStr = "";
        stmt = syntaxTree.children[2];
      } else if (ruleInd === 6) {
        namedExportArr = syntaxTree.children[2].children[0]?.children ?? [];
      } else {
        stmt = syntaxTree.children[1];
      }

      let allowedStmtTypes = (ruleInd === 2) ? [
        "function-declaration", "variable-declaration", "expression-statement"
      ] : [
        "function-declaration", "variable-declaration"
      ];
      let isExpStmt = (syntaxTree.type === "expression-statement");
      if (stmt && !allowedStmtTypes.includes(syntaxTree.type)) {
        if (isExpStmt) {
          return [false, "Unnamed export for a non-default export statement"];
        } else {
          return [
            false,
            "Export statement must be a function or variable declaration"
          ];
        }
      }

      syntaxTree.isDefault = (ruleInd <= 2);
      syntaxTree.stmt = stmt;
      syntaxTree.isStructProp = (flagStr !== undefined);
      syntaxTree.flagStr = flagStr;
      if (isExpStmt) {
        syntaxTree.exportArr = [];
      } else if (namedExportArr) {
        syntaxTree.exportArr = namedExportArr.map(ex => [ex.ident, ex.alias]);
      } else if (stmt.name) {
        syntaxTree.exportArr = [[stmt.name]];
      } else {
        syntaxTree.exportArr = stmt.identArr.map(ident => [ident]);
      }

      if (syntaxTree.isDefault && syntaxTree.exportArr.length > 1) {
        return [false, "Only one default export allowed"]
      }
    },
  },
  "named-export-list": {
    rules: [
      ["named-export", "/,/", "named-export-list!1"],
      ["named-export", "/,/?"],
    ],
    process: straightenListSyntaxTree,
  },
  "named-export": {
    rules: [
      ["identifier", "/as/", "/default/"],
      ["identifier", "/as/", "identifier!"],
      ["identifier"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.ident = syntaxTree.children[2].lexeme;
        syntaxTree.alias = "default";
      } else if (syntaxTree.ruleInd === 1) {
        syntaxTree.ident = syntaxTree.children[0].lexeme;
        syntaxTree.alias = syntaxTree.children[2].lexeme;
      } else {
        syntaxTree.ident = syntaxTree.children[0].lexeme;
      }
    },
  },
  "variable-declaration": {
    rules: [
      ["/let|const/", "variable-definition-list", "/;/!"],
      [
        "/let|const/", /\[/, "identifier-list"," /\\]/!", "/=/", "expression",
        "/;/"
      ],
    ],
    process: (syntaxTree) => {
      syntaxTree.isConst = (syntaxTree.children[0].lexeme === "const");
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.decType = "definition-list";
        syntaxTree.defArr = syntaxTree.children[1].children;
        syntaxTree.identArr = syntaxTree.defArr.map(val => val.ident);
      } else {
        syntaxTree.decType = "destructuring";
        syntaxTree.identArr = syntaxTree.children[2].children.map(
          val => val.lexeme
        );
        syntaxTree.exp = syntaxTree.children[5];
      }
    },
  },
  "variable-definition-list": {
    rules: [
      ["variable-definition", "/,/", "variable-definition-list!"],
      ["variable-definition"],
    ],
    process: straightenListSyntaxTree,
  },
  "variable-definition": {
    rules: [
      ["identifier", "/=/", "expression"],
      ["identifier"],
    ],
    process: (syntaxTree) => {
      Object.assign(syntaxTree, {
        ident: syntaxTree.children[0].lexeme,
        exp: syntaxTree.children[2] || undefined,
      });
    },
  },
  "identifier-list": {
    rules: [
      ["identifier", "/,/", "identifier-list!1"],
      ["identifier", "/,/?"],
    ],
    process: straightenListSyntaxTree,
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
  "function-declaration": {
    rules: [
      [
        "/function/", "identifier", /\(/, "parameter-list", /\)/,
        "function-body"
      ],
    ],
    process: (syntaxTree) => {
      syntaxTree.name = syntaxTree.children[1].lexeme;
      syntaxTree.params = syntaxTree.children[3].children;
      syntaxTree.body = syntaxTree.children[5];
    },
  },
  "parameter-list": {
    rules: [
      ["parameter", "/,/", "parameter-list!1"],
      ["parameter", "/,/?"],
    ],
    process: straightenListSyntaxTree,
  },
  "parameter": {
    rules: [
      ["identifier", "/:/", "type", "/=/", "expression!"],
      ["identifier", "/:/", "type", /\?/],
      ["identifier", "/:/", "type!"],
      ["identifier"],
    ],
    process: (syntaxTree) => {
      let children = syntaxTree.children;
      let types = children[2]?.types;
      let isRequired = (syntaxTree.ruleInd === 2);
      if (!types) {
        syntaxTree.ident = children[0].lexeme;
        syntaxTree.invalidTypes = undefined;
        syntaxTree.defaultExp = undefined;
      } else {
        // Initialize a invalidTypes, with nullish types plucked out from the
        // start if isRequired is false.
        let invalidTypes = isRequired ? [
          "entity", "string", "int", "float", "object", "array", "function",
          "struct", "null", "undefined"
        ] : [
          "entity", "string", "int", "float", "object", "array", "function",
          "struct",
        ];

        // Then iterate over each type in types, and pluck out additional
        // elements of invalidTypes.
        types.forEach((type) => {
          if (type.ruleInd === 0) {
            invalidTypes = invalidTypes.filter(val => val !== "entity");
          } else {
            let lexeme = type.lexeme;
            if (lexeme === "any") {
              invalidTypes = invalidTypes.filter(val => (
                val === "null" || val === "undefined"
              ));
            } else if (lexeme === "float") {
              invalidTypes = invalidTypes.filter(val => (
                val !== "float" && val !== "int"
              ));
            } else {
              invalidTypes = invalidTypes.filter(val => val !== lexeme);
            }
          }
        });

        syntaxTree.ident = children[0].lexeme;
        syntaxTree.defaultExp = children[4];
        syntaxTree.invalidTypes = invalidTypes;
      }
    },
  },
  "type": {
    rules: [
      [/\{/, "type^(1)-list!", /\}/],
      ["type^(1)"],
      [/any/],
    ],
    process: (syntaxTree) => {
      syntaxTree.types = (syntaxTree.ruleInd === 0) ?
        syntaxTree.children[1].children :
        [syntaxTree.children[0]];
    },
  },
  "type^(1)-list": {
    rules: [
      ["type^(1)", "/,/", "type^(1)-list!1"],
      ["type^(1)", "/,/?"],
    ],
    process: straightenListSyntaxTree,
  },
  "type^(1)": {
    rules: [
      ["entity-reference"], // A class.
      [/string|bool|int|float|array|object/],
    ],
    process: becomeChild(0),
  },
  "function-body": {
    rules: [
      [/\{/, "statement-list!1", /\}/],
      [/\{/, /\}/],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.stmtArr = syntaxTree.children[1].children;
      } else {
        syntaxTree.stmtArr = []
      }
    },
  },
  "function-body-or-expression": {
    rules: [
      ["function-body!1"], // '!1' here means that that object expressions have
      // to be wrapped in '()'.
      ["expression"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        becomeChild(0)(syntaxTree);
      } else {
        syntaxTree.stmtArr = [{
          sym: "return-statement",
          exp: syntaxTree.children[4],
        }];
      }
    },
  },
  "statement-list": {
    rules: [
      ["statement", "statement-list"],
      ["statement"],
    ],
    process: straightenListSyntaxTree,
  },
  "statement": {
    rules: [
      ["block-statement!1"],
      ["if-else-statement!1"],
      ["loop-statement!1"],
      ["return-statement!1"],
      ["throw-statement!1"],
      ["try-catch-statement!1"],
      ["instruction-statement!1"],
      ["empty-statement!1"],
      ["variable-declaration!1"],
      ["function-declaration!1"],
      // ("!1" here in the rule above avoids expression statement starting with
      // 'function' in the rule below.)
      ["expression-statement"],
    ],
    process: becomeChild(0)
  },
  "expression-statement": {
    rules: [
      ["expression", "/;/"],
    ],
    process: (syntaxTree) => {
      syntaxTree.exp = syntaxTree.children[0];
    },
  },
  "block-statement": {
    rules: [
      [/\{/, "statement-list", "/\\}/!"],
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
        "/for/", "/\\(/", "statement", "expression", "/;/", "expression",
        "/\\)/", "statement",
      ],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        Object.assign(syntaxTree, {
          dec:       undefined,
          cond:      syntaxTree.children[2],
          updateExp: undefined,
          stmt:      syntaxTree.children[4],
          doFirst:   false,
        });
      } else if (syntaxTree.ruleInd === 1) {
        Object.assign(syntaxTree, {
          dec:       undefined,
          cond:      syntaxTree.children[4],
          updateExp: undefined,
          stmt:      syntaxTree.children[1],
          doFirst:   true,
        });
      } else {
        Object.assign(syntaxTree, {
          dec:       syntaxTree.children[2],
          cond:      syntaxTree.children[3],
          updateExp: syntaxTree.children[5],
          stmt:      syntaxTree.children[7],
          doFirst:   false,
        });
      }
    },
  },
  "return-statement": {
    rules: [
      ["/return/", "expression", "/;/"],
      ["/return/", "/;/"],
    ],
    process: (syntaxTree) => {
      syntaxTree.exp = (syntaxTree.ruleInd === 0) ? syntaxTree.children[1] :
        undefined;
    },
  },
  "throw-statement": {
    rules: [
      ["/throw/", "expression", "/;/"],
      ["/throw/", "/;/"],
    ],
    process: (syntaxTree) => {
      syntaxTree.exp = (syntaxTree.ruleInd === 0) ? syntaxTree.children[1] :
        undefined;
    },
  },
  "try-catch-statement": {
    rules: [
      ["/try/", "statement", "/catch/", /\(/, "identifier", /\)/, "statement"],
    ],
    process: (syntaxTree) => {
      let children = syntaxTree.children;
      syntaxTree.tryStmt = children[1];
      syntaxTree.ident = children[4].lexeme;
      syntaxTree.catchStmt = children[6];
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
    process: straightenListSyntaxTree,
  },
  "expression": {
    rules: [
      [/\(/, "parameter-list", /\)/, "/=>/", "function-body-or-expression!"],
      [/\(/, /\)/, "/=>/", "function-body-or-expression!"],
      ["identifier", "/=>/", "function-body-or-expression!"],
      ["/function/", /\(/, "parameter-list", /\)/, "function-body!"],
      ["/function/", /\(/, /\)/, "function-body!"],
      ["expression^(1)", /=|\+=|\-=|\*=|\/=|&&=|\|\|=|\?\?=/, "expression!"],
      ["expression^(1)", /\?/, "expression!", /:/, "expression"],
      ["expression^(1)"],
    ],
    process: (syntaxTree) => {
      let children = syntaxTree.children;
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "arrow-function";
        syntaxTree.params = children[1].children;
        syntaxTree.body = children[4];
      } else if (syntaxTree.ruleInd === 1) {
        syntaxTree.type = "arrow-function";
        syntaxTree.params = [];
        syntaxTree.body = children[3];
      } else if (syntaxTree.ruleInd === 2) {
        syntaxTree.type = "arrow-function";
        syntaxTree.params = [children[0]];
        syntaxTree.body = children[2];
      } else if (syntaxTree.ruleInd === 3) {
        syntaxTree.type = "function-expression";
        syntaxTree.params = children[2].children;
        syntaxTree.body = children[4];
      } else if (syntaxTree.ruleInd === 4) {
        syntaxTree.type = "function-expression";
        syntaxTree.params = [];
        syntaxTree.body = children[3];
      } else if (syntaxTree.ruleInd === 5) {
        syntaxTree.type = "assignment";
        syntaxTree.op = children[1].lexeme;
        syntaxTree.exp1 = children[0];
        syntaxTree.exp2 = children[2];
      } else if (syntaxTree.ruleInd === 6) {
        syntaxTree.type = "conditional-expression";
        syntaxTree.cond = children[0];
        syntaxTree.exp1 = children[2];
        syntaxTree.exp2 = children[4];
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
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "or-expression"
    ),
  },
  "expression^(2)": {
    rules: [
      ["expression^(3)", "/&&/", "expression^(2)!"],
      ["expression^(3)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "and-expression"
    ),
  },
  "expression^(3)": {
    rules: [
      ["expression^(4)", /\|/, "expression^(3)!"],
      ["expression^(4)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "bitwise-or-expression"
    ),
  },
  "expression^(4)": {
    rules: [
      ["expression^(5)", /\^/, "expression^(4)!"],
      ["expression^(5)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "bitwise-xor-expression"
    ),
  },
  "expression^(5)": {
    rules: [
      ["expression^(6)", /\&/, "expression^(5)!"],
      ["expression^(6)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "bitwise-and-expression"
    ),
  },
  "expression^(6)": {
    rules: [
      ["expression^(7)", "/===|!==|==|!=/", "expression^(6)!"],
      ["expression^(7)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "equality-expression"
    ),
  },
  "expression^(7)": {
    rules: [
      ["expression^(8)", "/<|>|<=|>=/", "expression^(7)!"],
      ["expression^(8)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "relational-expression"
    ),
  },
  "expression^(8)": {
    rules: [
      ["expression^(9)", "/<<|>>|>>>/", "expression^(8)!"],
      ["expression^(9)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "shift-expression"
    ),
  },
  "expression^(9)": {
    rules: [
      ["expression^(10)", "/\\+|\\-|<>/", "expression^(9)!"],
      ["expression^(10)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "additive-expression"
    ),
  },
  "expression^(10)": {
    rules: [
      ["expression^(11)", "/\\*|\\/|%/", "expression^(10)!"],
      ["expression^(11)"],
    ],
    process: (syntaxTree) => processPolyadicInfixOperation(
      syntaxTree, "multiplicative-expression"
    ),
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
        "/\\+\\+|\\-\\-|!|~|\\+|\\-|typeof|void|delete/",
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
        syntaxTree.exp = syntaxTree.children[0];
        syntaxTree.op = syntaxTree.children[1].lexeme;
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(14)": {
    rules: [
      ["expression^(15)", "expression-tuple!1+!1"],
      // ["expression^(15)", /\->/, "expression^(15)!", "expression-tuple+"],
      ["expression^(15)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        processLeftAssocPostfixes(0, 1, "function-call")(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression-tuple": {
    rules: [
      [/\(/, "expression-list", "/\\)/!"],
      [/\(/, /\)/],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        becomeChild(1)(syntaxTree);
      } else {
        syntaxTree.children = [];
      }
    },
  },
  "expression^(15)": {
    rules: [
      ["expression^(16)", /\->/, "expression^(16)!"],
      ["expression^(16)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "virtual-method";
        syntaxTree.obj = syntaxTree.children[0];
        syntaxTree.fun = syntaxTree.children[2];
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "expression^(16)": {
    rules: [
      ["expression^(17)", "member-accessor!1+"],
      ["expression^(17)"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        processLeftAssocPostfixes(0, 1, "member-access")(syntaxTree);
      } else {
        becomeChild(0)(syntaxTree);
      }
    },
  },
  "member-accessor": {
    rules: [
      [/\[/, "expression!", /\]/],
      [/\./, "/[_\\$a-zA-Z][_\\$a-zA-Z0-9]*/!"],
      [/\?\./, "/[_\\$a-zA-Z][_\\$a-zA-Z0-9]*/!"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.exp = syntaxTree.children[1];
      } else if (syntaxTree.ruleInd === 1) {
        syntaxTree.ident = syntaxTree.children[1].lexeme;
      } else {
        syntaxTree.ident = syntaxTree.children[1].lexeme;
        syntaxTree.isOpt = true;
      }
    },
  },
  "expression^(17)": {
    rules: [
      [/\(/, "expression", /\)/],
      ["array!1"],
      ["object!1"],
      ["this-keyword"],
      ["identifier"],
      ["literal"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.type = "grouped-expression";
        syntaxTree.exp = syntaxTree.children[1];
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
    process: straightenListSyntaxTree,
  },
  "member": {
    rules: [
      ["identifier", "/:/!", "expression"],
      ["string", "/:/!", "expression"],
      [/\[/, "expression", /\]/, "/:/", "expression"],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        syntaxTree.ident = syntaxTree.children[0].lexeme;
        syntaxTree.valExp = syntaxTree.children[2];
      } else if (syntaxTree.ruleInd === 1) {
        syntaxTree.nameExp = syntaxTree.children[0];
        syntaxTree.valExp = syntaxTree.children[2];
      } else {
        syntaxTree.nameExp = syntaxTree.children[1];
        syntaxTree.valExp = syntaxTree.children[4];
      }
    },
  },
  "literal-list": {
    rules: [
      ["literal", "/,/", "literal-list!1"],
      ["literal", "/,/?"],
    ],
    process: straightenListSyntaxTree,
  },
  "this-keyword": {
    rules: [
      ["/this/"],
    ],
    process: copyLexemeFromChild(0),
  },
  "constant": {
    rules: [
      ["/true|false|null|undefined|Infinity|NaN/"],
    ],
    process: copyLexemeFromChild(0),
  },
};



export class ScriptParser extends Parser {
  constructor() {
    super(
      scriptGrammar,
      "function",
      [
        /"([^"\\]|\\[.\n])*"/,
        // /'([^'\\]|\\[.\n])*'/,
        /(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
        /\+=|\-=|\*=|\/=|&&=|\|\|=|\?\?=/,
        /&&|\|\||\?\?|\+\+|\-\-|\*\*/,
        /\?\.|<>|=>|\->/,
        /===|==|!==|!=|<=|>=/,
        /@[\[\{<];?/,
        /[\.,:;\[\]\{\}\(\)<>\?=\+\-\*\|\^&!%\/]/,
        /[_\$a-zA-Z0-9]+/,
      ],
      /\s+|\/\/.*\n\s*|\/\*([^\*]|\*(?!\/))*(\*\/\s*|$)/
    );
  }
}


export {ScriptParser as default};