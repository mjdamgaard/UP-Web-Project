
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
  /[,;:"'\/\\+\-\.\*\?\|&@\(\)\[\]\{\}(=>)=<>]/;
const nonSpecialCharsPattern = new RegExp (
  "[^" + specialCharPattern.source.substring(1) + "+"
);

const funAndRegEntLexemePatternArr = [
  specialCharPattern,
  nonSpecialCharsPattern,
  
];



const xmlWSPattern = /\s+/;

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
      ["attr-name", "/=/", "string..."], // TODO continue.
      ["attr-name"],
    ],
  },
  "attr-name": {
    rules: [
      // TODO: Continue.
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
  "literal": {
    rules: [
      ["string"],
      ["number"],
      ["array"],
      ["object"],
      ["/true/"],
      ["/false/"],
      ["/null/"],
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
  "literal-list": {
    rules: [
      ["literal", "/,/", "literal-list"],
      ["literal"],
    ],
    process: straightenListSyntaxTree,
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
    ...straightenListSyntaxTree(
      syntaxTree.children[1 + delimiterLexNum],
      delimiterLexNum
    ),
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
      ["@-literal"],
      ["/-/"],
      ["string"],
      ["number"],
      ["array"],
      ["/true/"],
      ["/false/"],
      ["/null/"],
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
      ["@-literal"],
      ["chars"],
    ],
  },
  "@-literal": {
    rules: [
      ["/@/", /\[/, "/0|[1-9][0-9]*/",  /\]/],
      ["/@/", /\[/, "path-substrings+", /\]/],
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
      ["string", "type-operator?", "/:/", "type"],
    ],
  },
  "type-operator": {
    rules: [
      [/\?/],
      ["/=/", "literal"],
    ],
  },
  "type": {
    rules: [
      ["@-literal"], // TODO: Change to "ent-ref" instead..
      // TODO: Continue.
      [/\(/, "type-disjunction-list", /\)/],
    ],
    test: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        // If @-literal is not an entity reference (ruleInd === 0), fail.
        let atLiteralSyntaxTree = syntaxTree.children[0];
        if (atLiteralSyntaxTree.ruleInd !== 0) {
          return [false, `Invalid type: wrong type of @-literal.`];
        } else {
          return [true];
        }
      }
    }
  },
};







const regularEntityParser = new Parser(
  regEntGrammar, "literal-list", funAndRegEntLexemePatternArr, false
);
