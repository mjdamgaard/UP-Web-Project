

















export class EntityReference {
  constructor(id) {
    this.id = id;
  }
}

export class EntityPlaceholder {
  constructor(path) {
    this.path = path;
  }
}











export const jsonGrammar = {
  "json-object": {
    rules: [
      ["object-literal"],
      ["array-literal"],
    ],
    process: becomeChild(0),
  },
  "literal-list": {
    rules: [
      ["literal", "/,/", "literal-list!"],
      ["literal"],
    ],
    process: straightenListSyntaxTree,
  },
  "literal": {
    rules: [
      ["string"],
      ["number"],
      ["constant"],
      ["array-literal!1"],
      ["object-literal"],
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
        syntaxTree.str = JSON.parse(stringLiteral);
      } catch (error) {
        return [false, `Invalid JSON string: ${stringLiteral}`];
      }

      syntaxTree.lexeme = stringLiteral;
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
  "array-literal": {
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
  "object-literal": {
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
    process: straightenListSyntaxTree,
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
export const regEntGrammar = {
  ...jsonGrammar,
  "literal": {
    rules: [
      ["entity-reference!1"],
      ["string"],
      ["number"],
      ["constant"],
      ["array-literal!1"],
      ["object-literal"],
    ],
    process: becomeChild(0),
  },
  "constant": {
    rules: [
      ["/_|true|false|null/"],
    ],
    process: copyLexemeFromChild(0),
  },
  // "mixed-string": {
  //   ...jsonGrammar["string"],
  //   process: (syntaxTree) => {
  //     let [isSuccess = true, error] =
  //       jsonGrammar["string"].process(syntaxTree) || [];
  //     if (!isSuccess) {
  //       return [false, error];
  //     }

  //     let [subSyntaxTree] = regEntStringContentParser.parse(
  //       syntaxTree.strLit.slice(1, -1)
  //     );

  //     Object.assign(syntaxTree, subSyntaxTree);

  //     if (!subSyntaxTree.isSuccess) {
  //       return [false, subSyntaxTree.error];
  //     }
  //   },
  // },
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



export class RegEntParser extends Parser {
  constructor() {
    super(
      regEntStringContentGrammar,
      "string-content",
      [
        /@[\[\{<];?/,
        /[\]\}>]/,
        /([^"\\@\]\}>]|\\[^@\]\}>])+/,
      ],
      false
    );
  }
}


export {RegEntParser as default};