
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
  /=>|[,;:"'\/\\+\-\.\*\?\|&@\(\)\[\]\{\}=<>]/;
const nonSpecialCharsPattern = new RegExp (
  "[^" + specialCharPattern.source.substring(1) + "+"
);

const funAndRegEntLexemePatternArr = [
  specialCharPattern,
  nonSpecialCharsPattern,
  
];


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
    process: (children, ruleInd) => {
      let contentArr = children[0].children;
      return contentArr;
    },
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
    process: (children, ruleInd) => {
      let startTagName = children[1].lexeme;
      if (/^[xX][mM][lL]/.test(startTagName)) {
        return [null, "Element name cannot start with 'xml'"]
      }

      let attrMembers = syntaxTree.children[2].children;
      let content = (ruleInd === 0) ? syntaxTree.children[4] : undefined;
      let isSelfClosing = (ruleInd === 1);

      if (ruleInd === 0) {
        let endTagName = syntaxTree.children[7].lexeme;
        if (endTagName !== startTagName) {
          return [null,
            "End tag </" + endTagName + "> does not match start tag <" +
            startTagName + ">"
          ];
        }
      }

      return [startTagName, attrMembers, content, isSelfClosing];
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
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-+]?(0|[1-9][0-9]*))?/],
    ],
  },
}

export const xmlParser = new Parser(
  xmlGrammar, "xml-text", xmlLexemePatternArr, xmlWSPattern
);

// Tests:
xmlParser.log(xmlParser.parseAndProcess(
  `Hello, world!`
));
xmlParser.log(xmlParser.parseAndProcess(
  `Hello, <i>world</i>.`
));
xmlParser.log(xmlParser.parseAndProcess(
  `Hello, <i>world</wrong>.`
));





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
    process: (children, ruleInd) => {
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
      [/\\/, /(["\\\/bfnrt]|u[0-9A-Fa-f]{4}).*/],
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

export function straightenListSyntaxTree(
  children, ruleInd, delimiterLexNum = 1
) {
  children = (ruleInd === 0) ? [
    children[0],
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
    process: (children, ruleInd) => {
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
      [/\\/, /(["\\\/bfnrt]|u[0-9A-Fa-f]{4}).*/],
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
      ["type^(1)", "/\\?/"],
      ["type^(1)", "/=/", "literal"],
      ["type^(1)"],
    ],
  },
  "type^(1)": {
    rules: [
      [/\(/, "type-disjunction-list", /\)/],
      ["type^(2)"],
    ],
  },
  "type-disjunction-list": {
    rules: [
      ["string", "/:/", "type^(2)", /\|/, "type-disjunction-list"],
      ["string", "/:/", "type^(2)"],
    ],
  },
  "type^(2)": {
    rules: [
      [/\[/, "type^(3)-list", /\]/, "array-type-operator"],
      [/\[/, "type^(3)-list", /\]/],
      ["type^(3)"],
    ],
  },
  "array-type-operator": {
    rules: [
      [/\[/, "/[1-9][0-9]*/", /\]/],
      [/\[/, /\]/],
    ],
  },
  "type^(3)-list": {
    rules: [
      ["type^(3)", "/,/", "type^(3)-list"],
      ["type^(3)"],
    ],
    process: straightenListSyntaxTree,
  },
  "type^(3)": {
    rules: [
      ["ent-ref"], // A class.
      [/[tuafrjh8d]|string|bool|int|float/],
      [/array|object/], // User has to manually type in a parsable JS array/
      // object.
    ],
  },
};







// const regularEntityParser = new Parser(
//   regEntGrammar, "literal-list", funAndRegEntLexemePatternArr, false
// );
