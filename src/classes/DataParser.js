
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
  /[,;:"'\/\\+\-\.\*\?\|@\(\)\[\]\{\}]/;
const nonSpecialCharsPattern = new RegExp (
  "[^" + specialCharPattern.source.substring(1) + "+"
);

const funAndRegEntLexemePatternArr = [
  specialCharPattern,
  nonSpecialCharsPattern,
  
];


const jsonGrammar = {
  "Literal": {
    rules: [
      ["String"],
      ["Number"],
      ["Array"],
      ["Object"],
      ["/true/"],
      ["/false/"],
      ["/null/"],
    ],
  },
  "String": {
    rules: [
      ['/"/', "Chars*", '/"/'],
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
  "Chars": {
    rules: [
      [/[^"\\]+/],
      [/\\/, /["\\\/bfnrt(u[0-9A-Fa-f]{4})].*/],
    ],
  },
  "Number": {
    rules: [
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-+]?(0|[1-9][0-9]*))?/],
    ],
  },
  "Array": {
    rules: [
      [/\[/, "Literal_list", /\]/],
    ],
  },
  "Literal_list": {
    rules: [
      ["Literal", "/,/", "Literal_list"],
      ["Literal"],
    ],
  },
  "Object": {
    rules: [
      [/\{/, "Member_list", /\}/],
    ],
  },
  "Member_list": {
    rules: [
      ["Member", "/,/", "Member_list"],
      ["Member"],
    ],
  },
  "Member": {
    rules: [
      ["String", "/:/", "Literal"],
    ],
  },
};


// We only overwrite some of the nonterminal symbols in the prototype.
const regEntGrammar = {
  ...jsonGrammar,
  "Literal": {
    rules: [
      ["@-literal"],
      ["/_/"],
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
      [/"/, "Chars_or_@-literal*", /"/],
    ],
    test: (syntaxTree) => {
      // TODO: make.
    },
  },
  "Chars_or_@-literal": {
    rules: [
      ["@-Literal"],
      ["Chars"],
    ],
  },
  "@-literal": {
    rules: [
      ["/@/", /\[/, "/0|[1-9][0-9]*/",  /\]/],
      ["/@/", /\[/, "Path_substrings+", /\]/],
      ["/@/", /\{/, "/[1-9][0-9]*/",    /\}/],
    ],
  },
  "Path_substrings": {
    rules: [
      [/[^0-9\[\]@,;"][^\[\]@,;"]+/],
    ],
  },
};




const funEntGrammar = {
  ...regEntGrammar,
  // TODO: make.
};







const regularEntityParser = new Parser(
  regEntGrammar, "ExpList", funAndRegEntLexemePatternArr, false
);
