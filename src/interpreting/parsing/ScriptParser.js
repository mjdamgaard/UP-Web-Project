
import {Parser} from "./Parser.js";
import {regEntGrammar} from "./RegEntParser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
  processPolyadicInfixOperation, processLeftAssocPostfixes,
} from "./processing.js";





const RESERVED_KEYWORD_REGEXP = new RegExp(
  "^(let|var|const|this|function|export|import|break|continue|return|throw|" +
  "if|else|switch|case|void|typeof|instanceof|delete|await|class|static|" +
  "true|false|null|undefined|Infinity|NaN|try|catch|finally|for|while|do|" +
  "default|public|debugger|new|exit|Protected|PassAsMutable)$"
  // TODO: Continue this list.
);




export const scriptGrammar = {
  ...regEntGrammar, // TODO: Remove such that the whole grammar is contained
  // here.
  "script": {
    rules: [
      [ 
        "import-statement!1*",
        "outer-statement+$"
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
    process: (children, ruleInd) => {
      let str = (ruleInd == 0) ? children[3].str : children[2].str;
      let isChildPath, isParentPath, isAbsPath, isDevLibPath;
      isChildPath = (str.substring(0, 2) === "./");
      isParentPath = (str.substring(0, 3) === "../");
      isAbsPath = (str.substring(0, 1) === "/");
      isDevLibPath = !isChildPath && !isParentPath && !isAbsPath;
      let ret = {
        type: "import-statement",
        isChildPath: isChildPath,
        isParentPath: isParentPath,
        isAbsPath: isAbsPath,
        isDevLibPath: isDevLibPath,
      };
      ret.importArr = (ruleInd === 0) ? children[1].children : [];
      return ret;
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
      [
        "/export/", "/default/?", "/const/", "identifier!", "/=/",
        "expression", "/;/"
      ],
      ["/export/", "/default/?", "function-declaration!1"],
      ["/export/", "/default/", "expression-statement"],
      ["/export/", /\{/, "named-export-list!1?", /\}/, "/;/"],
    ],
    process: (children, ruleInd) => {
      if (ruleInd === 0) {
        return {
          type: "export-statement",
          subtype: "protected-object-export",
          ident: children[2].ident,
          isPrivate: (children[6].lexeme === "true") ? true : false,
          isServerSide: (children[8].lexeme === "true") ? true : false,
          signalDocPath: children[10].str,
          signal: children[12].str,
          exp: children[14],
        };
      }
      else if (ruleInd === 1) {
        return {
          type: "export-statement",
          subtype: "variable-export",
          isDefault: children[1][0] ? true : false,
          // isConst: children[2] === "const",
          ident: children[3].ident,
          exp: children[5],
        };
      }
      else if (ruleInd === 2) {
        return {
          type: "export-statement",
          subtype: "function-export",
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
          exp: children[2],
        };
      }
      else {
        return {
          type: "export-statement",
          subtype: "named-exports",
          namedExportArr: children[2].children,
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
        ident: children[2].ident,
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
  "variable-declaration": {
    rules: [
      ["/let|const/", "variable-definition-list", "/;/!"],
      [
        "/let|const/", /\[/, "identifier-list"," /\\]/!", "/=/", "expression",
        "/;/"
      ],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "variable-declaration",
        decType: "definition-list",
        isConst: (children[0] === "const"),
        defArr: children[1].children,
        identArr: children[1].children.map(val => val.ident),
      } : {
        type: "variable-declaration",
        decType: "destructuring",
        isConst: (children[0] === "const"),
        identArr: children[2].children.map(val => val.ident),
        exp: children[5],
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
    process: (children) => {
      return {
        type: "variable-definition",
        ident: children[0].ident,
        exp: children[2] || undefined,
      };
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
    process: (children) => {
      let lexeme = children[0];
      if (RESERVED_KEYWORD_REGEXP.test(lexeme)) {
        return false;
      } else {
        return {type: "identifier", ident: lexeme};
      }
    },
  },
  "function-declaration": {
    rules: [
      [
        "/function/", "identifier", /\(/, "parameter-list!1?", /\)/,
        "function-body"
      ],
    ],
    process: (children) => ({
      type: "function-declaration",
      name: children[1].ident,
      params: children[3][0]?.children || [],
      body: children[5],
    }),
  },
  "parameter-list": {
    rules: [
      ["parameter", "/,/", "parameter-list!1"],
      ["parameter", "/,/?"],
    ],
    process: straightenListSyntaxTree,
  },
  // TODO: Implement types (as a subset of TS).
  "parameter": {
    rules: [
      // ["identifier", "/:/", "type", "/=/", "expression!"],
      // ["identifier", "/:/", "type", /\?/],
      // ["identifier", "/:/", "type!"],
      ["identifier", "/=/", "expression!"],
      ["identifier"],
    ],
    process: (children) => ({
      type: "parameter",
      ident: children[0].ident,
      defaultExp: children[2],
    }),
  },
  "function-body": {
    rules: [
      [/\{/, "statement-list!1", /\}/],
      [/\{/, /\}/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        stmtArr: children[1].children,
      } : {
        stmtArr: [],
      }
    },
  },
  "function-body-or-expression": {
    rules: [
      ["function-body!1"], // '!1' here means that that object expressions have
      // to be wrapped in '()'.
      ["expression"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? children[0] : {
        stmtArr: [{
          type: "return-statement",
          exp: children[0],
        }],
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
      // ["exit-statement!1"],
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
      [/\{/, "statement-list", "/\\}/!"],
      [/\{/, /\}/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "block-statement",
        stmtArr: children[1].children,
      } : {
        type: "block-statement",
        stmtArr: [],
      }
    },
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
      [
        "/try/", /\{/, "statement!1*", /\}/, "/catch/", /\(/, /\[/,
        "identifier", "/,/", "identifier!1", "/,/?", /\]/, /\)/, /{/,
        "statement!1*", /\}/
      ],
      [
        "/try/", /\{/, "statement!1*", /\}/, "/catch/", /\(/, /\[/,
        "identifier", "/,/?", /\]/, /\)/, /{/,
        "statement!1*", /\}/
      ],
    ],
    process: (children) => {
      return (ruleInd === 0) ? {
        type: "try-catch-statement",
        tryStmtArr: children[2],
        errIdent: children[7].ident,
        numIdent: children[9].ident,
        catchStmtArr: children[14],
      } : {
        type: "try-catch-statement",
        tryStmtArr: children[2],
        errIdent: children[7].ident,
        catchStmtArr: children[12],
      };
    },
  },
  "instruction-statement": {
    rules: [
      ["/break|continue/", "/;/"],
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
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "arrow-function",
        params: children[1].children,
        body: children[4],
      } : (ruleInd === 1) ? {
        type: "arrow-function",
        params: [],
        body: children[3],
      } : (ruleInd === 2) ? {
        type: "arrow-function",
        params: [children[0]],
        body: children[2],
      } : (ruleInd === 3) ? {
        type: "function-expression",
        params: children[2].children,
        body: children[4],
      } : (ruleInd === 4) ? {
        type: "function-expression",
        params: [],
        body: children[3],
      } : (ruleInd === 5) ? {
        type: "assignment",
        op: children[1],
        exp1: children[0],
        exp2: children[2],
      } : (ruleInd === 6) ? {
        type: "conditional-expression",
        cond: children[0],
        exp1: children[2],
        exp2: children[4],
      } :
        copyFromChild(children, ruleInd);
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
      ["expression^(8)", "/<|>|<=|>=/", "expression^(7)!"],
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
      ["/!|~|\\+|\\-|typeof|void|new/", "expression^(13)!"],
      ["expression^(13)"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
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
    ],
    process: (children) => ({
      type: "chained-expression",
      rootExp: children[0],
      postfixArr: children[1],
    }),
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
      [/\(/, "expression-list", "/\\)/!"],
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
  "expression^(15)": {
    rules: [
      [/\(/, "expression", /\)/],
      ["array!1"],
      ["object!1"],
      ["this-keyword"],
      ["exit-call!1"],
      ["protected-call!1"],
      ["pass-as-mutable-call!1"],
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
      [/\[/, "expression-list!1", /\]/],
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
        children: children[1].children,
      } : {
        type: "object",
        children: [],
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
    process: (children, ruleInd) => {
      let ret = (ruleInd === 0) ? {
        ident: children[0].ident,
        valExp: children[2],
      } : (ruleInd === 1) ? {
        nameExp: children[0],
        valExp: children[2],
      } : {
        nameExp: children[1],
        valExp: children[4],
      };
      ret.type = "member";
      return ret;
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
    process: () => ({type: "this-keyword"}),
  },
  "exit-call": {
    rules: [
      ["/exit/", /\(/, "expression!1", /\)/],
      ["/exit/", /\(/, /\)/],
    ],
    process: (children, ruleInd) => ({
      type: "exit-call",
      exp: (ruleInd === 0) ? children[2] : undefined,
    }),
  },
  "protected-call": {
    rules: [
      ["/Protected/", /\(/, "expression", "/,/", "expression", /\)/],
    ],
    process: (children) => ({
      type: "protected-call",
      optionsExp: children[2],
      valExp: children[4],
    }),
  },
  "pass-as-mutable-call": {
    rules: [
      ["/PassAsMutable/", /\(/, "expression", /\)/],
    ],
    process: (children) => ({
      type: "pass-as-mutable-call",
      exp: children[2],
    }),
  },
  "constant": {
    rules: [
      ["/true|false|null|undefined|Infinity|NaN/"],
    ],
    process: copyLexemeFromChild,
    params: ["constant"],
  },
};



export class ScriptParser extends Parser {
  constructor() {
    super(
      scriptGrammar,
      "function",
      [
        /"([^"\\]|\\[.\n])*"/,
        /'([^'\\]|\\[.\n])*'/,
        /(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
        /\+=|\-=|\*=|\/=|&&=|\|\|=|\?\?=/,
        /&&|\|\||\?\?|\+\+|\-\-|\*\*/,
        /\?\.|=>/,
        /===|==|!==|!=|<=|>=/,
        /[\.,:;\[\]\{\}\(\)<>\?=\+\-\*\|\^&!%\/]/,
        /[_\$a-zA-Z0-9]+/,
        /#[_\$a-zA-Z0-9]+/,
        /#"([^"\\]|\\[.\n])*"/,
      ],
      /\s+|\/\/.*\n\s*|\/\*([^\*]|\*(?!\/))*(\*\/\s*|$)/
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