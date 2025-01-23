
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
  /[,;:"'\\\?\|\(\)\[\]\{\}]/;
const nonSpecialCharsPattern = new RegExp (
  "[^" + specialCharsPattern.source.substring(1) + "+"
);

const funAndRegEntLexemePatternArr = [
  specialCharPattern,
  nonSpecialCharsPattern,
  // /[,;:\?\*\+]/,
  // /"(\\[\S\s]|[^"])*"/, // We test() this further when parsing.
  // /(0|\-?[1-9][0-9])(\.[0-9]*)?([eE][+\-]?[0-9]*)/, // We test() when parsing.
  // /@\[[^\[\]]\]/,
  // /@\{[^\{\}]\}/,
  // /@<\/?[a-zA-z_]+[^>]*>/, // Correct if/when we impl. such non-substituted
  // // secondary-key entity references.
  
];


const jsonLiteralGrammar = {
  "Literal": {
    rules: [
      ["String"],
      ["Number"],
      ["Array"],
      ["/true/"],
      ["/false/"],
      ["/null/"],
    ],
  },
  "String": {
    rules: [
      [/"/, "CharsNoDoubleQuote*", /"/],
    ],
    test: (syntaxTree) => {
      let stringContent = syntaxTree.children[1].children.reduce(
        (acc, val) => (acc + val.children[0]),
        ""
      );
      try {
        JSON.parse(`"${stringContent}"`);
      } catch (error) {
        return [false, `Invalid JSON string: "${stringContent}"`];
      }
      // Some early post-processing now that we have the string:
      syntaxTree.children = [`"${stringContent}"`];

      return [true];
    },
  },
  "CharsNoDoubleQuote": {
    rules: [
      [/([^"]+|\\[a[^a]])+/,],
    ],
  },
  "Number": {
    rules: [
      [/......./,],
    ],
    test: (syntaxTree) => {
      let stringContent = syntaxTree.children[1].children.reduce(
        (acc, val) => (acc + val.children[0]),
        ""
      );
      try {
        JSON.parse(`"${stringContent}"`);
      } catch (error) {
        return [false, `Invalid JSON string: "${stringContent}"`];
      }
      // Some early post-processing now that we have the string:
      syntaxTree.children = [`"${stringContent}"`];

      return [true];
    },
  },
};

const regEntGrammar = new Object (jsonLiteralGrammar, {
  "ExpList": {
    rules: [
      ["Exp", "/,/", "ExpList"],
      ["Exp"],
    ]
  },
  "Exp": {
    rules: [
      ["EntRef"],
      ["Literal"],
      ["/_/"],
    ]
  },
  "EntRef": {
    rules: [
      [/@\[[^\[\]]\]/],
    ],
    test: (syntaxTree) => {
      let match = syntaxTree.children[0].children[0];
      let entID = match.slice(2, -1);
      if (parseInt(entID).toString() === entID) {
        return [true];
      } else {
        return [false, "Ill-formed entity ID"];
      }
    },
  },
  "Literal": {
    rules: [
      ["String"],
      ["Number"],
      ["Array"],
      ["/true/"],
      ["/false/"],
      ["/null/"],
    ]
  },
  // TODO: Continue.
});

const regularEntityParser = new Parser(
  regEntGrammar, "ExpList", funAndRegEntLexemePatternArr, false
);
