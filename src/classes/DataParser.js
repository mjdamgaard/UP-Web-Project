
import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";

import {LRUCache} from "../classes/LRUCache.js";
import {Parser} from "./Parser.js";

const entitySyntaxTreeCache = new LRUCache(200);



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


const specialCharPattern =
  /[,;(::):"'\/\\+\-\.\*\?\|&@\(\)\[\]\{\}(=>)=<>]/;
const nonSpecialCharsPattern = new RegExp (
  "[^" + specialCharPattern.source.substring(1) + "+"
);

const funAndRegEntLexemePatternArr = [
  specialCharPattern,
  nonSpecialCharsPattern,
  
];


const doubleQuoteStringPattern =
  /"([^"\\]|\\[a[^a]])*"/;

const xmlWSPattern = /\s+/;
const xmlLexemePatternArr = [
  doubleQuoteStringPattern,
  specialCharPattern,
  nonSpecialCharsPattern,

];

const xmlGrammar = {
  "xml-text": {
    rules: [
      ["text-or-element*"],
    ],
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
        "/</", "element-name", "attr-member*", "/>/",
        "xml-text",
        "/</", /\//, "tag-name", "/>/"
      ],
      [
        "/</", "element-name", "attr-member*", /\//, "/>/",
      ]
    ],
  },
  "element-name": {
    rules: [
      [/[_a-sA-Z]+/, "/[_a-sA-Z0-9\\-\\.]+/*"],
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
}



const jsonGrammar = {
  "json-text": {
    rules: [
      ["object"],
      ["array"],
    ],
  },
  "literal-list": {
    rules: [
      ["literal", "/,/", "literal-list"],
      ["literal"],
    ],
    process: straightenListSyntaxTree,
  },
  "literal": {
    rules: [
      ["string"],
      ["number"],
      ["array"],
      ["object"],
      ["/true|false|null/"],
    ],
  },
  "string": {
    rules: [
      ['/"/', "chars*", '/"/'],
    ],
    test: (syntaxTree) => {
      // Concat all the nested lexemes.
      let stringContent = syntaxTree.children[1].children.reduce(
        (acc, val) => acc + val.children.reduce(
          (acc, val) => acc + (
            val.children[0]
          ),
          ""
        ),
        ""
      );

      // Test that the resulting string is a valid JSON string. 
      try {
        JSON.parse(`"${stringContent}"`);
      } catch (error) {
        return [false, `Invalid JSON string: "${stringContent}"`];
      }

      // Also do some early post-processing now that we have the string:
      syntaxTree.children = [`"${stringContent}"`];

      return [true];
    },
  },
  "chars": {
    rules: [
      [/[^"\\]+/],
      [/\\/, /["\\\/bfnrt(u[0-9A-Fa-f]{4})].*/],
    ],
  },
  "number": {
    rules: [
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-+]?(0|[1-9][0-9]*))?/],
    ],
  },
  "array": {
    rules: [
      [/\[/, "literal-list", /\]/],
    ],
  },
  "object": {
    rules: [
      [/\{/, "member-list", /\}/],
    ],
  },
  "member-list": {
    rules: [
      ["member", "/,/", "member-list"],
      ["member"],
    ],
    process: straightenListSyntaxTree,
  },
  "member": {
    rules: [
      ["string", "/:/", "literal"],
    ],
  },
};

export function straightenListSyntaxTree(syntaxTree, delimiterLexNum = 1) {
  syntaxTree.children = (syntaxTree.ruleInd === 0) ? [
    syntaxTree.children[0],
    ...syntaxTree.children[1 + delimiterLexNum].children,
  ] : [
    syntaxTree.children[0]
  ];
}



// We only overwrite some of the nonterminal symbols in the "parent" JSON
// grammar.
const regEntGrammar = {
  ...jsonGrammar,
  "literal": {
    rules: [
      ["ent-ref"],
      ["input-placeholder"],
      ["/_/"],
      ["string"],
      ["number"],
      ["array"],
      ["/true|false|null/"],
    ],
  },
  "string": {
    rules: [
      [/"/, "chars-or-@-literal*", /"/],
    ],
    test: (syntaxTree) => {
      // TODO: make.
    },
  },
  "chars-or-@-literal": {
    rules: [
      ["ent-ref"],
      ["input-placeholder"],
      ["chars"],
    ],
  },
  "chars": {
    rules: [
      [/[^"\\@]+/],
      [/\\/, /["\\\/bfnrt(u[0-9A-Fa-f]{4})].*/],
      ["/@/", /[^\[\{<]/],
      ["/@/", /[\[\{<]/, "/;/"],
    ],
  },
  "ent-ref": {
    rules: [
      ["/@/", /\[/, "/0|[1-9][0-9]*/",  /\]/],
      ["/@/", /\[/, "path-substrings+", /\]/],
    ],
  },
  "input-placeholder": {
    rules: [
      ["/@/", /\{/, "/[1-9][0-9]*/",    /\}/],
    ],
  },
  "path-substrings": {
    rules: [
      [/[^0-9\[\]@,;"][^\[\]@,;"]+/],
    ],
  },
};




const funEntGrammar = {
  ...regEntGrammar,
  "function": {
    rules: [
      [
        "function-name", /\(/, "param-list", /\)/, "/=>/",  /\{/,
        "member-list", /\}/,
      ],
    ],
  },
  "param-list": {
    rules: [
      ["param", "/,/", "param-list"],
      ["param"],
    ],
    process: straightenListSyntaxTree,
  },
  "param": {
    rules: [
      ["string", "/\\?/?", "/:/", "type", "default-val-def?"],
    ],
  },
  "default-val-def": {
    rules: [
      ["/=/", "literal"],
    ],
  },
  "type": {
    rules: [
      [/\(/, "type-disjunction-list", /\)/],
      ["type^(1)"],
    ],
  },
  "type-disjunction-list": {
    rules: [
      ["type^(1)", "/::/", "string", /\|/, "type-disjunction-list"],
      ["type^(1)", "/::/", "string"],
    ],
  },
  "type^(1)": {
    rules: [
      ["type^(2)", "array-type-operator?"],
    ],
  },
  "array-type-operator": {
    rules: [
      [/\[/, "/[1-9][0-9]*/?", /\]/],
    ],
  },
  "type^(2)": {
    rules: [
      ["ent-ref"],
      [/[tuafrjh8d]|string|bool|int|float/],
    ],
  },
};







const regularEntityParser = new Parser(
  regEntGrammar, "literal-list", funAndRegEntLexemePatternArr, false
);
