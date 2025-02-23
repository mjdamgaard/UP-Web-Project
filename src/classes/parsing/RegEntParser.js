
import {Parser} from "./Parser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
} from "./processing.js";
















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
      ["object"],
      ["array"],
    ],
    process: copyFromChild,
    params: ["json-object"],
  },
  "literal-list": {
    rules: [
      ["literal", "/,/", "literal-list!"],
      ["literal"],
    ],
    process: straightenListSyntaxTree,
    params: ["literal-list"],
  },
  "literal": {
    rules: [
      ["string"],
      ["number"],
      ["constant"],
      ["array!1"],
      ["object"],
    ],
    process: copyFromChild,
  },
  "string": {
    rules: [
      [/"([^"\\]|\\[.\n])*"/],
    ],
    process: (children) => {
      // Concat all the nested lexemes.
      let stringLiteral = children[0];

      // Test that the resulting string is a valid JSON string.
      let str;
      try {
        str = JSON.parse(stringLiteral);
      } catch (error) {
        return [false, `Invalid JSON string: ${stringLiteral}`];
      }

      return {type: "string", lexeme: stringLiteral, str: str};
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
      ["/true|false|null/"],
    ],
    process: copyLexemeFromChild,
    params: ["constant"],
  },
  "array": {
    rules: [
      [/\[/, "literal-list!1", /\]/],
      [/\[/, /\]/],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "array",
        children: children[1].children,
      } : {
        type: "array",
        children: [],
      };
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
      };
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
    process: (children) => ({
      type: "member",
      name: children[0].str,
      val: children[2],
    }),
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
      ["array!1"],
      ["object"],
    ],
    process: copyFromChild,
  },
  "constant": {
    rules: [
      ["/_|true|false|null/"],
    ],
    process: copyLexemeFromChild,
    params: ["constant"],
  },
  // "mixed-string": {
  //   ...jsonGrammar["string"],
  //   process: (children, ruleInd) => {
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
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? {
        type: "entity-reference",
        id: children[1],
      } : {
        type: "entity-reference",
        path: children[1],
      };
    },
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




export class RegEntParser extends Parser {
  constructor() {
    super(
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
  }
}


export {RegEntParser as default};








// const regEntStringContentGrammar = {
//   ...regEntGrammar,
//   "string-content": {
//     rules: [
//       ["string-part*$"]
//     ],
//     process: copyFromChild(0),
//   },
//   "string-part": {
//     rules: [
//       ["entity-reference!1"],
//       ["escaped-bracket"],
//       ["plain-text"],
//     ],
//   },
//   "escaped-bracket": {
//     rules: [
//       [/@[\[\{<];/],
//     ],
//     process: copyLexemeFromChild(0),
//   },
//   "plain-text": {
//     rules: [
//       [/([^"\\@\]\}>]|\\[^@\]\}>]|)+/],
//     ],
//     process: copyLexemeFromChild(0),
//   },
// };



// export class RegEntStringContentParser extends Parser {
//   constructor() {
//     super(
//       regEntStringContentGrammar,
//       "string-content",
//       [
//         /@[\[\{<];?/,
//         /[\]\}>]/,
//         /([^"\\@\]\}>]|\\[^@\]\}>])+/,
//       ],
//       false
//     );
//   }
// }