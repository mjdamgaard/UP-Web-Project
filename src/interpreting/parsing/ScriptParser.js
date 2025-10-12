
import {Parser} from "./Parser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
  processPolyadicInfixOperation,
} from "./processing.js";


const ESCAPED_SINGLE_QUOTE_REGEX_G = /(?<!(\\\\)*\\)\\'/g;


const RESERVED_KEYWORD_REGEXP = new RegExp(
  "^(let|var|const|this|function|export|import|break|continue|return|throw|" +
  "if|else|switch|case|void|typeof|instanceof|delete|await|class|static|" +
  "true|false|null|undefined|Infinity|NaN|try|catch|finally|for|while|do|" +
  "default|public|debugger|new|console|abstract|arguments|boolean|byte|char|" +
  "double|enum|eval|extends|final|float|goto|implements|in|int|interface|" +
  "long|native|package|private|protected|short|super|synchronized|throws|" +
  "transient|volatile|with|yield|Promise|abs)$"
);



export const HTML_ELEMENT_TYPE_REGEX = new RegExp(
  "^(div|span|i|b|br|hr|template|button|h1|h2|h3|h4|h5|h6|p|section|code|" +
  "|pre|footer|header|main|ol|ul|li)$"
  // TODO: Continue this list.
);




export const scriptGrammar = {
  "script": {
    rules: [
      [
        "import-statement!1*",
        "outer-statement!1*$"
      ],
    ],
    process: (children) => ({
      type: "script",
      importStmtArr: children[0],
      stmtArr: children[1],
    }),
  },
  "import-statement": {
    rules: [
      ["/import/", "import-list", "/from/!", "string", "/;/"],
      ["/import/", "/from/", "string", "/;/"],
    ],
    process: (children, ruleInd) => ({
      type: "import-statement",
      str: (ruleInd == 0) ? children[3].str : children[2].str,
      importArr: (ruleInd === 0) ? children[1].children : [],
    }),
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
      [/\{/, "named-import-list!1?!", /\}/],
      ["identifier"],
    ],
    process: (children, ruleInd) => {
      let ret = (ruleInd === 0) ? {
        importType: "namespace-import",
        ident: children[2].ident,
      } : (ruleInd === 1) ? {
        importType: "named-imports",
        namedImportArr: children[1][0]?.children,
      } : {
        importType: "default-import",
        ident: children[0].ident,
      };
      ret.type = "import";
      return ret;
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
    process: (children, ruleInd) => ({
      type: "named-import",
      ident: (ruleInd === 0) ? undefined : children[0].ident,
      alias: children[2]?.ident,
    }),
  },
  "outer-statement": {
    rules: [
      ["export-statement!1"],
      ["statement"],
    ],
    process: copyFromChild,
  },
  "export-statement": {
    rules: [
      ["/export/", "/const/", "identifier!", "/=/", "expression", "/;/"],
      ["/export/", "/default/?", "function-declaration!1"],
      ["/export/", "/default/?", "class-declaration!1"],
      ["/export/", "/default/", "expression-statement"],
      ["/export/", /\{/, "named-export-list!1?", /\}/, "/;/"],
// TODO: Implement 'export * from' and export * as <name>' statements as well.
    ],
    process: (children, ruleInd) => {
      if (ruleInd === 0) {
        return {
          type: "export-statement",
          subtype: "variable-export",
          ident: children[2].ident,
          exp: children[4],
        };
      }
      else if (ruleInd === 1 || ruleInd === 2) {
        return {
          type: "export-statement",
          subtype: "function-or-class-export",
          isDefault: children[1][0] ? true : false,
          ident: children[2].name,
          stmt: children[2],
        };
      }
      else if (ruleInd === 3) {
        return {
          type: "export-statement",
          subtype: "anonymous-export",
          isDefault: true,
          exp: children[2].exp,
        };
      }
      else {
        return {
          type: "export-statement",
          subtype: "named-exports",
          namedExportArr: children[2][0]?.children ?? [],
        };
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
    process: (children, ruleInd) => {
      let ret = (ruleInd === 0) ? {
        ident: children[0].ident,
        alias: "default",
      } : (ruleInd === 1) ? {
        ident: children[0].ident,
        alias: children[2].ident,
      } : {
        ident: children[0].ident,
      };
      ret.type = "named-export";
      return ret;
    },
  },
  "identifier": {
    rules: [
      [/[_\$a-zA-Z][_\$a-zA-Z0-9]*/],
    ],
    process: (children) => {
      let lexeme = children[0];
      if (RESERVED_KEYWORD_REGEXP.test(lexeme)) {
        return false;
      } else {
        return {type: "identifier", ident: lexeme};
      }
    },
  },
  "variable-declaration": {
    rules: [
      ["/let|const/", "parameter-list", "/;/"],
    ],
    process: (children) => ({
      type: "variable-declaration",
      isConst: children[0] === "const",
      children: children[1].children,
    }),
  },
  "parameter-list": {
    rules: [
      ["parameter", "/,/", "parameter-list!1"],
      ["parameter"],
    ],
    process: straightenListSyntaxTree,
  },
  "optional-parameter-list": {
    rules: [
      ["optional-parameter-list^(1)", "parameter"],
      ["optional-parameter-list^(1)"],
    ],
    process: (children, ruleInd) => ({
      type: "optional-parameter-list",
      children: (ruleInd === 0) ? [...children[0], children[1]] : children[0],
    }),
  },
  "optional-parameter-list^(1)": {
    rules: [
      ["optional-parameter*"],
    ],
    process: (children) => ({
      type: "optional-parameter-list^(1)",
      children: children[0].map(val => val.child),
    }),
  },
  "optional-parameter": {
    rules: [
      ["parameter", "/,/"],
      ["/,/"],
    ],
    process: (children) => ({
      type: "optional-parameter",
      child: children[0],
    }),
  },
  "parameter": {
    rules: [
      ["destructuring", "/=/", "expression!"],
      ["destructuring"],
      ["identifier", "/=/", "expression!"],
      ["identifier"],
    ],
    process: (children) => ({
      type: "parameter",
      targetExp: children[0],
      defaultExp: children[2],
    }),
  },
  "destructuring": {
    rules: [
      ["array-destructuring"],
      ["object-destructuring"],
    ],
    process: copyFromChild,
  },
  "array-destructuring": {
    rules: [
      [/\[/, "optional-parameter-list^(1)", "/\.\.\./", "identifier", /\]/],
      [/\[/, "optional-parameter-list^(1)", "parameter", /\]/],
      [/\[/, "optional-parameter-list^(1)", /\]/],
    ],
    process: (children, ruleInd) => ({
      type: "array-destructuring",
      children: (ruleInd === 1) ? children[1].children.concat(children[2]) :
        children[1].children,
      restParam: (ruleInd === 0) ? {
        type: "parameter",
        targetExp: children[3],
      } : undefined,
    }),
  },
// TODO: Implement "...rest" syntax for object destructuring.
  "object-destructuring": {
    rules: [
      [/\{/, "parameter-member-list", "/,/?", /\}/],
      [/\{/, /\}/],
    ],
    process: (children, ruleInd) => (
      (ruleInd === 0) ? {
        type: "object-destructuring",
        children: children[1].children,
      } : {
        type: "object-destructuring",
        children: [],
      }
    ),
  },
  "parameter-member-list": {
    rules: [
      ["parameter-member", "/,/", "parameter-member-list!1"],
      ["parameter-member"],
    ],
    process: straightenListSyntaxTree,
  },
  "parameter-member": {
    rules: [
      ["identifier", "/:/", "parameter!"],
      ["identifier", "/=/", "expression!"],
      ["identifier"],
    ],
    process: (children, ruleInd) => (
      (ruleInd === 0) ? {
        type: "parameter-member",
        ident: children[0].ident,
        targetExp: children[2].targetExp,
        defaultExp: children[2].defaultExp,
      } : {
        type: "parameter-member",
        ident: children[0].ident,
        targetExp: children[0],
        defaultExp: children[2],
      }
    ),
  },
  "function-declaration": {
    rules: [
      ["/function/", "identifier", "parameter-tuple", "block-statement"],
    ],
    process: (children) => ({
      type: "function-declaration",
      name: children[1].ident,
      params: children[2].children,
      body: children[3],
    }),
  },
  "function-body": {
    rules: [
      ["block-statement!1"], // '!1' here means that that object expressions
      // have to be wrapped in '()'.
      ["expression"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? children[0] : {
        type: "block-statement",
        stmtArr: [{
          type: "return-statement",
          exp: children[0],
        }],
      }
    },
  },
  "class-declaration": {
    rules: [
      [
        "/class/", "identifier", "/extends/", "identifier", /\{/,
        "class-member!1*", /\}/
      ],
      ["/class/", "identifier", /\{/, "class-member!1*", /\}/],
    ],
    process: (children, ruleInd) => ({
      type: "class-declaration",
      name: children[1].ident,
      superclass: (ruleInd === 0) ? children[3].ident : undefined,
      members: (ruleInd === 0) ? children[5] : children[3],
    }),
  },
  "class-member": {
    rules: [
      ["identifier", "parameter-tuple", "block-statement!"],
      ["identifier", "/=/", "expression", "/;/"],
    ],
    process: (children, ruleInd) => (
      (ruleInd === 0) ? {
        type: "member",
        ident: children[0].ident,
        valExp: {
          type: "function-expression",
          params: children[1].children,
          body: children[2],
        },
      } : {
        type: "member",
        ident: children[0].ident,
        valExp: children[2],
      }
    ),
  },
  "statement": {
    rules: [
      ["block-statement!1"],
      ["if-else-statement!1"],
      ["loop-statement!1"],
      ["switch-statement!1"],
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
    process: copyFromChild,
  },
  "expression-statement": {
    rules: [
      ["expression", "/;/"],
    ],
    process: (children) => ({
      type: "expression-statement",
      exp: children[0],
    }),
  },
  "block-statement": {
    rules: [
      [/\{/, "statement!1*", "/\\}/!"],
    ],
    process: (children) => ({
      type: "block-statement",
      stmtArr: children[1],
    }),
  },
  "if-else-statement": {
    rules: [
      ["/if/", /\(/, "expression", /\)/, "statement", "/else/", "statement!"],
      ["/if/", /\(/, "expression", /\)/, "statement"],
    ],
    process: (children) => ({
      type: "if-else-statement",
      cond: children[2],
      ifStmt: children[4],
      elseStmt: children[6],
    }),
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
    process: (children, ruleInd) => {
      let ret = (ruleInd === 0) ? {
        dec:       undefined,
        cond:      children[2],
        updateExp: undefined,
        stmt:      children[4],
        doFirst:   false,
      } : (ruleInd === 1) ? {
        dec:       undefined,
        cond:      children[4],
        updateExp: undefined,
        stmt:      children[1],
        doFirst:   true,
      } : {
        dec:       children[2],
        cond:      children[3],
        updateExp: children[5],
        stmt:      children[7],
        doFirst:   false,
      };
      ret.type = "loop-statement";
      return ret;
    },
  },
  "switch-statement": {
    rules: [
      [
        "/switch/", /\(/, "expression", /\)/, /\{/, "case-or-statement!1*", /\}/
      ],
    ],
    process: (children) => {
      let stmtArr = [...children[5]];
      let caseArr = [];
      let defaultCase;
      stmtArr.forEach((node, ind, stmtArr) => {
        if (node.type === "case") {
          stmtArr[ind] = {type: "empty-statement"};
          caseArr.push([node.exp, ind]);
        }
        else if (node.type === "default-case") {
          if (defaultCase !== undefined) {
            return "Switch statement can only have at most one default clause"
          }
          stmtArr[ind] = {type: "empty-statement"};
          defaultCase = ind;
        }
      })
      return {
        type: "switch-statement",
        exp: children[2],
        caseArr: caseArr,
        stmtArr: stmtArr,
        defaultCase: defaultCase,
      };
    },
  },
  "case-or-statement": {
    rules: [
      ["statement"],
      ["/case/", "expression", "/:/"],
      ["/default/", "expression", "/:/"],
    ],
    process: (children, ruleInd) => (
      (ruleInd === 0) ? children[0] : (ruleInd === 1) ? {
        type: "case",
        exp: children[1],
      } : {
        type: "default-case",
      }
  ),
  },
  "return-statement": {
    rules: [
      ["/return/", "expression", "/;/"],
      ["/return/", "/;/"],
    ],
    process: (children, ruleInd) => ({
      type: "return-statement",
      exp: (ruleInd === 0) ? children[1] : undefined,
    }),
  },
  "throw-statement": {
    rules: [
      ["/throw/", "expression", "/;/"],
      ["/throw/", "/;/"],
    ],
    process: (children, ruleInd) => ({
      type: "throw-statement",
      exp: (ruleInd === 0) ? children[1] : undefined,
    }),
  },
  "try-catch-statement": {
    rules: [
      // [
      //   "/try/", /\{/, "statement!1*", /\}/, "/catch/", /\(/, /\[/,
      //   "identifier", "/,/", "identifier!1", "/,/?", /\]/, /\)/, /{/,
      //   "statement!1*", /\}/
      // ],
      [
        "/try/", /\{/, "statement!1*", /\}/, "/catch/", /\(/, "identifier",
        /\)/, /{/, "statement!1*", /\}/
      ],
    ],
    process: (children) => ({
      type: "try-catch-statement",
      tryStmtArr: children[2],
      ident: children[6].ident,
      catchStmtArr: children[9],
    }),
  },
  "instruction-statement": {
    rules: [
      ["/break|continue|debugger/", "/;/"],
    ],
    process: copyLexemeFromChild,
    params: ["instruction-statement"],
  },
  "empty-statement": {
    rules: [
      ["/;/"],
    ],
    process: () => ({type: "empty-statement"}),
  },
  "expression-list": {
    rules: [
      ["expression", "/,/", "expression-list!1"],
      ["expression"],
    ],
    process: straightenListSyntaxTree,
  },
  "expression-or-spread-list": {
    rules: [
      ["spread", "/,/", "expression-or-spread-list!1"],
      ["expression", "/,/", "expression-or-spread-list!1"],
      ["spread", "/,/?"],
      ["expression", "/,/?"],
    ],
    process: (children, ruleInd) => straightenListSyntaxTree(
      children, ruleInd, undefined, false, 2,
    ),
  },
  "spread": {
    rules: [
      [/\.\.\./, "expression"],
    ],
    process: (children) => ({
      type: "spread",
      exp: children[1],
    }),
  },
  "expression": {
    rules: [
      ["parameter-tuple", "/=>/", "function-body!"],
      ["identifier", "/=>/", "function-body!"],
      ["/function/", "parameter-tuple", "function-body!"],
      ["array-destructuring", "/=/", "expression!"],
      [/\(/, "object-destructuring", "/=/", "expression!", /\)/],
      ["expression^(1)", /=|\+=|\-=|\*=|\/=|&&=|\|\|=|\?\?=/, "expression!"],
      ["expression^(1)", /\?/, "expression!", /:/, "expression"],
      ["expression^(1)"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "arrow-function",
        params: children[0].children,
        body: children[2],
      } : (ruleInd === 1) ? {
        type: "arrow-function",
        params: [{
          type: "parameter",
          targetExp: children[0],
        }],
        body: children[2],
      } : (ruleInd === 2) ? {
        type: "function-expression",
        params: children[1].children,
        body: children[2],
      } : (ruleInd === 3) ? {
        type: "array-destructuring-assignment",
        destExp: children[0],
        valExp: children[2],
      } : (ruleInd === 4) ? {
        type: "object-destructuring-assignment",
        destExp: children[1],
        valExp: children[3],
      } : (ruleInd === 5) ? {
        type: "assignment",
        exp1: children[0],
        exp2: children[2],
        op: children[1],
      } : (ruleInd === 6) ? {
        type: "conditional-expression",
        cond: children[0],
        exp1: children[2],
        exp2: children[4],
      } :
        copyFromChild(children);
    },
  },
  "expression^(1)": {
    rules: [
      ["expression^(2)", /(\|\|)|(\?\?)/, "expression^(1)!"],
      ["expression^(2)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["or-expression"],
  },
  "expression^(2)": {
    rules: [
      ["expression^(3)", "/&&/", "expression^(2)!"],
      ["expression^(3)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["and-expression"],
  },
  "expression^(3)": {
    rules: [
      ["expression^(4)", /\|/, "expression^(3)!"],
      ["expression^(4)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["bitwise-or-expression"],
  },
  "expression^(4)": {
    rules: [
      ["expression^(5)", /\^/, "expression^(4)!"],
      ["expression^(5)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["bitwise-xor-expression"],
  },
  "expression^(5)": {
    rules: [
      ["expression^(6)", /\&/, "expression^(5)!"],
      ["expression^(6)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["bitwise-and-expression"],
  },
  "expression^(6)": {
    rules: [
      ["expression^(7)", "/===|!==|==|!=/", "expression^(6)!"],
      ["expression^(7)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["equality-expression"],
  },
  "expression^(7)": {
    rules: [
      ["expression^(8)", "/<|>|<=|>=|instanceof/", "expression^(7)!"],
      ["expression^(8)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["relational-expression"],
  },
  "expression^(8)": {
    rules: [
      ["expression^(9)", "/<<|>>|>>>/", "expression^(8)!"],
      ["expression^(9)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["shift-expression"],
  },
  "expression^(9)": {
    rules: [
      ["expression^(10)", "/\\+|\\-/", "expression^(9)!"],
      ["expression^(10)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["additive-expression"],
  },
  "expression^(10)": {
    rules: [
      ["expression^(11)", "/\\*|\\/|%/", "expression^(10)!"],
      ["expression^(11)"],
    ],
    process: processPolyadicInfixOperation,
    params: ["multiplicative-expression"],
  },
  "expression^(11)": {
    rules: [
      ["expression^(12)", /\*\*/, "expression^(11)!"],
      ["expression^(12)"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "exponential-expression",
        root: children[0],
        exp: children[2],
      } :
        copyFromChild(children);
    },
  },
  "expression^(12)": {
    rules: [
      ["/\\+\\+|\\-\\-|delete/", "expression^(14)!"],
      ["/!|~|\\+|\\-|typeof|void/", "expression^(13)!"],
      ["expression^(13)"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd <= 1) ? {
        type: "prefix-expression",
        op: children[0],
        exp: children[1],
      } :
        copyFromChild(children);
    },
  },
  "expression^(13)": {
    rules: [
      ["expression^(14)", "/\\+\\+|\\-\\-/"],
      ["expression^(14)"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "postfix-expression",
        exp: children[0],
        op: children[1],
      } :
        copyFromChild(children);
    },
  },
  "expression^(14)": {
    rules: [
      ["expression^(15)", "member-accessor-or-expression-tuple!1*"],
      ["/new/", "expression^(15)", "member-accessor-or-expression-tuple!1*"],
    ],
    process: (children, ruleInd) => {
      let postfixArr = children[1 + ruleInd];
      if (!postfixArr[0] && !ruleInd) {
        return children[0 + ruleInd];
      }
      else if (ruleInd && postfixArr[0]?.type !== "expression-tuple") {
        return "'new' expression expects a (possibly empty) argument tuple"
      }
      else return {
        type: "chained-expression",
        isNew: ruleInd ? true : false,
        rootExp: children[0 + ruleInd],
        postfixArr: postfixArr,
      };
    },
  },
  "member-accessor-or-expression-tuple": {
    rules: [
      ["member-accessor"],
      ["expression-tuple"],
    ],
    process: copyFromChild,
  },
  "member-accessor": {
    rules: [
      [/\[/, "expression!", /\]/],
      [/\./, "/[_\\$a-zA-Z][_\\$a-zA-Z0-9]*/!"],
      [/\?\./, "/[_\\$a-zA-Z][_\\$a-zA-Z0-9]*/!"],
    ],
    process: (children, ruleInd) => {
      let ret = (ruleInd === 0) ? {
        exp: children[1],
      } : (ruleInd === 1) ? {
        ident: children[1],
      } : {
        ident: children[1],
        isOpt: true,
      }
      ret.type = "member-accessor";
      return ret;
    },
  },
  "expression-tuple": {
    rules: [
      [/\(/, "expression-list", "/,/?", "/\\)/!"],
      [/\(/, /\)/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "expression-tuple",
        children: children[1].children,
      } : {
        type: "expression-tuple",
        children: [],
      }
    },
  },
  "parameter-tuple": {
    rules: [
      [/\(/, "parameter-list", "/,/?", "/\\)/!"],
      [/\(/, /\)/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "parameter-tuple",
        children: children[1].children,
      } : {
        type: "parameter-tuple",
        children: [],
      }
    },
  },
  "expression^(15)": {
    rules: [
      [/\(/, "expression", /\)/],
      ["array!1"],
      ["object!1"],
      ["jsx-element!1"],
      ["import-call!1"],
      ["console-call!1"],
      ["super-call-or-access!1"],
      ["promise-call"],
      ["abs-call!1"],
      ["this-keyword"],
      ["identifier"],
      ["literal"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ?
        {type: "grouped-expression", exp: children[1]} :
        copyFromChild(children, ruleInd);
    },
  },
  "array": {
    rules: [
      [/\[/, "expression-or-spread-list!1", "/,/?", /\]/],
      [/\[/, /\]/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "array",
        children: children[1].children,
      } : {
        type: "array",
        children: [],
      }
    },
  },
  "object": {
    rules: [
      [/\{/, "member-list!1", /\}/],
      [/\{/, /\}/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "object",
        members: children[1].children,
      } : {
        type: "object",
        members: [],
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
      [/[_\$a-zA-Z][_\$a-zA-Z0-9]*/, "/:/", "expression!"],
      [/[_\$a-zA-Z][_\$a-zA-Z0-9]*/, "expression-tuple", "block-statement!"],
      ["string", "/:/!", "expression"],
      [/\[/, "expression", /\]/, "/:/", "expression"],
      ["spread"],
    ],
    process: (children, ruleInd) => (
      (ruleInd === 0) ? {
        type: "member",
        ident: children[0],
        valExp: children[2],
      } : (ruleInd === 1) ? {
        type: "member",
        ident: children[0],
        valExp: {
          type: "function-expression",
          params: children[1].children,
          body: children[2],
        },
      } : (ruleInd === 2) ? {
        type: "member",
        keyExp: children[0],
        valExp: children[2],
      } : (ruleInd === 3) ? {
        type: "member",
        keyExp: children[1],
        valExp: children[4],
      } :
        children[0]
    ),
  },
  "jsx-element": {
    rules: [
      ["/<>/", "jsx-content!1*", /<\/>/],
      ["/</", "tag-name", "jsx-property!1*", /\/>/],
      [
        "/</", "tag-name", "jsx-property!1*", "/>/", "jsx-content!1*",
        /<\//, "tag-name", />/
      ],
    ],
    process: (children, ruleInd) => {
      if (ruleInd === 0) {
        return {
          type: "jsx-element",
          isFragment: true,
          children: children[1],
        };
      } else if (ruleInd === 1) {
        let tagName = children[1].lexeme;
        let isComponent = /^[A-Z]/.test(tagName);
        if (!isComponent && tagName !== "br" && tagName !== "hr") {
          return (
            `Invalid void element tag name: "${tagName}"`
          );
        }
        return {
          type: "jsx-element",
          tagName: tagName,
          isComponent: isComponent,
          isVoid: true,
          propArr: children[2],
        };
      } else {
        let tagName = children[1].lexeme;
        let endTagName = children[6].lexeme;
        if (endTagName !== tagName) {
          return (
            `End tag name, "${endTagName}", did not match start tag name, ` +
            `"${tagName}"`
          );
        }
        if (tagName === "br" || tagName === "hr") {
          return (
            `Tags of the type "${tagName}" need to be self-closing`
          );
        }
        return {
          type: "jsx-element",
          tagName: tagName,
          isComponent: /^[A-Z]/.test(tagName),
          propArr: children[2],
          children: children[4],
        };
      }
    },
  },
  "tag-name": {
    rules: [
      [/[A-Z][a-zA-z0-9_$]*/],
      [HTML_ELEMENT_TYPE_REGEX],
    ],
    process: copyLexemeFromChild,
  },
  "jsx-property": {
    rules: [
      ["identifier", "/=/", "literal"],
      ["identifier", "/=/!1", /\{/, "expression", /\}/],
      ["identifier"],
      [/\{/, /\.\.\./, "expression", /\}/],
    ],
    process: (children, ruleInd) => {
      if (ruleInd <= 2) {
        let ret = {
          type: "jsx-property",
          ident: children[0].ident,
        };
        if (ruleInd === 0) {
          ret.exp = children[2];
        }
        else if (ruleInd === 1) {
          ret.exp = children[3];
        }
        return ret;
      }
      else {
        return {
          type: "jsx-property",
          isSpread: true,
          exp: children[2],
        };
      }
    },
  },
  "jsx-content": {
    rules: [
      ["jsx-element!1"],
      [/\{/, "expression", /\}/],
      [/\{/, /\}/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? children[0] : (ruleInd === 1) ? children[1] :
        {type: "empty-jsx-content"};
    },
  },
  "literal-list": {
    rules: [
      ["literal", "/,/", "literal-list!1"],
      ["literal", "/,/?"],
    ],
    process: straightenListSyntaxTree,
  },
  "literal": {
    rules: [
      ["string"],
      ["number"],
      ["constant"],
    ],
    process: copyFromChild,
  },
  "string": {
    rules: [
      [/"([^"\\]|\\(\S|\s))*"/],
      [/'([^'\\]|\\(\S|\s))*'/],
    ],
    process: (children, ruleInd) => {
      let stringLiteral = children[0];
      let str;
      if (ruleInd === 1) {
        stringLiteral =
          '"' + stringLiteral.slice(1, -1).replaceAll('"', '\\"')
            .replaceAll(ESCAPED_SINGLE_QUOTE_REGEX_G, "'") +
          '"';
      }
      try {
        str = JSON.parse(stringLiteral);
      } catch (error) {debugger;
        return `Invalid string: ${stringLiteral}`;
      }
      return {type: "string", str: str};
    },
  },
  "number": {
    rules: [
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/],
    ],
    process: copyLexemeFromChild,
    params: ["number"],
  },
  "constant": {
    rules: [
      ["/true|false|null|undefined|Infinity|NaN/"],
    ],
    process: copyLexemeFromChild,
    params: ["constant"],
  },
  "this-keyword": {
    rules: [
      ["/this/"],
    ],
    process: () => ({type: "this-keyword"}),
  },
  "import-call": {
    rules: [
      ["/import/", /\(/, "expression", /\)/],
    ],
    process: (children) => ({
      type: "import-call",
      pathExp: children[2],
    }),
  },
  "console-call": {
    rules: [
      ["/console/", /\./, "/log|trace|error/", "expression-tuple"],
    ],
    process: (children) => ({
      type: "console-call",
      subtype: children[2],
      expArr: children[3].children,
    }),
  },
  "super-call-or-access": {
    rules: [
      ["/super/", "expression-tuple!1"],
      ["/super/", /\./, "member-accessor"],
    ],
    process: (children, ruleInd) => (
      (ruleInd === 0) ? {
        type: "super-call",
        params: children[1].children,
      } : {
        type: "super-access",
        accessor: children[2],
      }
    ),
  },
  "promise-call": {
    rules: [
      ["/Promise/", /\./, "/all/", /\(/, "expression", /\)/],
      ["/new/", "/Promise/", /\(/, "expression", /\)/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "promise-all-call",
        exp: children[4],
      } : {
        type: "promise-call",
        exp: children[3],
      };
    },
  },
  "abs-call": {
    rules: [
      ["/abs/", /\(/, "expression", /\)/],
    ],
    process: (children) => ({
      type: "abs-call",
      exp: children[2],
    }),
  },
};



export class ScriptParser extends Parser {
  constructor() {
    super(
      scriptGrammar,
      "script",
      [
        /"([^"\\]|\\(\S|\s))*"/,
        /'([^'\\]|\\(\S|\s))*'/,
        /(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
        /\+=|\-=|\*=|\/=|&&=|\|\|=|\?\?=/,
        /&&|\|\||\?\?|\+\+|\-\-|\*\*/,
        /\?\.|\.\.\.|=>|<\/?>|\/>|<\//,
        /===|==|!==|!=|<=|>=/,
        /[.,:;\[\]{}()<>?=+\-*|^&!%/]/,
        /[_$a-zA-Z0-9]+/,
      ],
      /\s+|\/\/.*(\n\s*|$)|\/\*([^*]|\*(?!\/))*(\*\/\s*|$)/
    );
  }

  parse(str, startSym, isPartial, keepLastLexeme) {
    let [syntaxTree, lexArr, strPosArr] = super.parse(
      str, startSym, isPartial, keepLastLexeme
    );
    this.addPosAndNextPosToResults(syntaxTree);
    return [syntaxTree, lexArr, strPosArr];
  }

  addPosAndNextPosToResults(syntaxTree) {
    if (syntaxTree.res && syntaxTree.pos !== undefined) {
      syntaxTree.res.pos = syntaxTree.pos;
      syntaxTree.res.nextPos = syntaxTree.nextPos;
    }
    if (syntaxTree.children) {
      syntaxTree.children.forEach(child => {
        this.addPosAndNextPosToResults(child);
      });
    }
  }
}



export const scriptParser = new ScriptParser();

export default {scriptParser};