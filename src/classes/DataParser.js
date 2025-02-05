
import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";

import {LRUCache} from "./PriorityLRUCache.js";
import {Parser} from "./Parser.js";

const entitySyntaxTreeCache = new LRUCache(200);

const ARRAY_TYPE_MAX_LEN = 20;



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








const jsonGrammar = {
  "json-object": {
    rules: [
      ["object"],
      ["array"],
    ],
    process: becomeChild,
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
      ["array"],
      ["object"],
      ["constant"],
    ],
    process: becomeChild,
  },
  "constant": {
    rules: [
      ["/true|false|null/"],
    ],
    process: becomeChild,
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
        JSON.parse(stringLiteral);
      } catch (error) {
        return [false, `Invalid JSON string: ${stringLiteral}`];
      }

      syntaxTree.strLit = stringLiteral;
    },
  },
  "number": {
    rules: [
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/],
    ],
    process: makeChildrenIntoLexemeArray,
  },
  "constant": {
    rules: [
      ["/true|false|null/"],
    ],
    process: makeChildrenIntoLexemeArray,
  },
  "array": {
    rules: [
      [/\[/, "literal-list", /\]/],
    ],
    process: (syntaxTree) => becomeChild(syntaxTree, 1),
  },
  "object": {
    rules: [
      [/\{/, "member-list", /\}/],
    ],
    process: (syntaxTree) => becomeChild(syntaxTree, 1),
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
      syntaxTree.children = {
        name: syntaxTree.children[0],
        val: syntaxTree.children[2],
      }
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



export function straightenListSyntaxTree(syntaxTree, delimiterLexNum = 1) {
  syntaxTree.children = (syntaxTree.ruleInd === 0) ? [
    syntaxTree.children[0],
    ...syntaxTree.children[1 + delimiterLexNum].children,
  ] : [
    syntaxTree.children[0]
  ];
}

export function becomeChild(syntaxTree, ind = 0) {
  let child = syntaxTree.children[ind];
  Object.assign(syntaxTree, {
    ruleInd: null,
    ...child,
    type: child.type ?? child.sym,
  });
}


export function getLexemeArrayFromChildren(syntaxTree) {
  if (syntaxTree.lexeme) {
    return [syntaxTree.lexeme];
  } else {
    return [].concat(...syntaxTree.children.map(child => (
      getLexemeArrayFromChildren(child)
    )));
  }
}

export function makeChildrenIntoLexemeArray(syntaxTree) {
  syntaxTree.children = getLexemeArrayFromChildren(syntaxTree);
}








// We only overwrite some of the nonterminal symbols in the JSON grammar.
const regEntGrammar = {
  ...jsonGrammar,
  "literal": {
    rules: [
      ["ent-ref"],
      ["input-placeholder"],
      ["value-string"],
      ["number"],
      ["array"],
      ["object"],
      ["constant"],
    ],
    process: becomeChild,
  },
  "constant": {
    rules: [
      ["/_|true|false|null/"],
    ],
    process: becomeChild,
  },
  "value-string": {
    ...jsonGrammar["string"],
    process: (syntaxTree) => {
      let [isSuccess = true, error] =
        jsonGrammar["string"].process(syntaxTree) || [];
      if (!isSuccess) {
        return [false, error];
      }

      let subSyntaxTree = regEntStringContentParser.parse(
        syntaxTree.strLit.slice(1, -1)
      );
      if (!subSyntaxTree.isSuccess) {
        return [false, subSyntaxTree.error];
      }

      Object.assign(syntaxTree, subSyntaxTree);
    },
  },
  "ent-ref": {
    rules: [
      [/@\[/, "/0|[1-9][0-9]*/",  /\]/],
      [/@\[/, "path", /\]/],
    ],
    process: (syntaxTree) => {
      let ruleInd = syntaxTree.ruleInd;
      Object.assign(syntaxTree, {
        isTBD: (ruleInd === 1),
        entID: (ruleInd === 0) ? syntaxTree.children[1].lexeme : undefined,
        path:  (ruleInd === 1) ? syntaxTree.children[1].lexeme : undefined,
      });
    }
  },
  "input-placeholder": {
    rules: [
      [/@\{/, "/[1-9][0-9]*/",    /\}/],
    ],
  },
  "path": {
    rules: [
      [/'([^'\\]|\\[.\n])*'/],
    ],
    process: becomeChild,
  },
};

export const regEntParser = new Parser(
  regEntGrammar,
  "literal-list",
  [
    /"([^"\\]|\\[.\n])*"/,
    /'([^'\\]|\\[.\n])*'/,
    /\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
    /@[\[\{<];?|[,:\[\]\{\}>]/,
    /[^\s,:\[\]\{\}\(\)>\?='"]+/,
  ],
  /\s+/
);






const regEntStringContentGrammar = {
  ...regEntGrammar,
  "string-content": {
    rules: [
      ["string-part*$"]
    ],
    process: becomeChild,
  },
  "string-part": {
    rules: [
      ["ent-ref"],
      ["input-placeholder"],
      ["escaped-bracket"],
      ["plain-text"],
    ],
  },
  "escaped-bracket": {
    rules: [
      [/@[\[\{<];/],
    ],
    process: becomeChild,
  },
  "plain-text": {
    rules: [
      [/([^"\\@\]\}>]|\\[^@\]\}>]|)+/],
    ],
    process: becomeChild,
  },
};


export const regEntStringContentParser = new Parser(
  regEntStringContentGrammar,
  "string-content",
  [
    /@[\[\{<];?/,
    /[\]\}>]/,
    /([^"\\@\]\}>]|\\[^@\]\}>])+/,
  ],
  false
);







const funEntGrammar = {
  ...regEntGrammar,
  "function": {
    rules: [
      [
        /[^0-9\[\]@,;"\s][^\[\]@,;"\s]*/, /\(/, "param-list", /\)/, "/=>/", 
        /\(/, "literal", /\)/,
      ],
      [
        /[^0-9\[\]@,;"\s][^\[\]@,;"\s]*/, /\(/, "param-list", /\)/, "/=>/", 
        /\{/, "statement-list", /\}/
      ],
    ],
    process: (syntaxTree) => {
      let children = syntaxTree.children;
      Object.assign(syntaxTree, {
        name: children[0].lexeme,
        params: children[2].children,
        return: children[5],
      });
    },
  },
  "param-list": {
    rules: [
      ["param", "/,/", "param-list!"],
      ["param"],
    ],
    process: straightenListSyntaxTree,
  },
  "param": {
    rules: [
      [/"([^"\\]|\\[.\n])*"/, "/:/", "type"],
    ],
    process: (syntaxTree) => {
      let children = syntaxTree.children;
      Object.assign(syntaxTree, {
        name: children[0].lexeme,
        type: children[2],
      });
    },
  },
  "type": {
    rules: [
      ["type^(1)", "/\\?/"],
      ["type^(1)", "/=/", "literal!"],
      ["type^(1)"],
    ],
    process: (syntaxTree) => {
      syntaxTree.type = syntaxTree.children[0];
      syntaxTree.isOptional = syntaxTree.children[1] ? true : false;
      syntaxTree.defaultVal = syntaxTree.children[2] || undefined;
    },
  },
  "type^(1)": {
    rules: [
      [/\{/, "type^(2)-list!", /\}/],
      ["type^(2)"],
    ],
    process: (syntaxTree) => {
      syntaxTree.types = (syntaxTree.ruleInd === 0) ?
        syntaxTree.children[1].children :
        [syntaxTree.children[0]];
    },
  },
  "type^(2)-list": {
    rules: [
      ["type^(2)", "/,/", "type^(2)-list!"],
      ["type^(2)"],
    ],
    process: straightenListSyntaxTree,
  },
  "type^(2)": {
    rules: [
      [/\[/, "type^(3)-list", /\]/, "array-type-operator"],
      [/\[/, "type^(3)-list!", /\]/],
      ["type^(3)", "array-type-operator"],
      ["type^(3)"],
    ],
    process: (syntaxTree) => {
      syntaxTree.types = (syntaxTree.ruleInd <= 1) ?
        syntaxTree.children[1].children :
        [syntaxTree.children[0]];
      syntaxTree.arrayLen = (syntaxTree.ruleInd === 0) ?
        syntaxTree.children[3].num :
        (syntaxTree.ruleInd === 2) ?
          syntaxTree.children[1].num :
          0;
    },
  },
  "array-type-operator": {
    rules: [
      [/\[/, "/[1-9][0-9]*/", "/\\]/!"],
      [/\[/, /\]/],
    ],
    process: (syntaxTree) => {
      let numLiteral = (syntaxTree.ruleInd === 0) ?
        syntaxTree.children[1].lexeme :
        null;
      let num = parseInt(numLiteral);

      if (numLiteral !== null && (num.toString !== numLiteral || num === 1)) {
        return [false, `Invalid array length: ${numLiteral}`];
      }

      syntaxTree.num = (numLiteral === null) ? null : num;
    },
  },
  "type^(3)-list": {
    rules: [
      ["type^(3)", "/,/", "type^(3)-list!"],
      ["type^(3)"],
    ],
    process: straightenListSyntaxTree,
  },
  "type^(3)": {
    rules: [
      ["ent-ref"], // A class.
      [/[tuafrjh8dl]|string|bool|int|float/],
      [/object|array|mixed/], // User has to manually type in a parsable
      // literal.
    ],
  },
  "statement-list": {
    rules: [
      ["statement", "statement-list"],
      ["statement"],
    ],
    process: (syntaxTree) => straightenListSyntaxTree(syntaxTree, 0),
  },
  "statement": {
    rules: [
      ["block-statement"],
      ["if-else-statement"],
      ["loop-statement"],
      ["variable-declaration"],
      ["expression", "/;/!"],
      ["/;/"],
    ],
    process: becomeChild,
  },
  "block-statement": {
    rules: [
      [/\{/, "statement-list", /\}/],
    ],
    process: (syntaxTree) => becomeChild(syntaxTree, 1),
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
        "/for/", "/\\(/", "statement", "statement", "expression", "/\\)/",
        "statement",
      ],
    ],
    process: (syntaxTree) => {
      if (syntaxTree.ruleInd === 0) {
        Object.assign(syntaxTree, {
          dec:        undefined,
          cond:       syntaxTree.children[2],
          updateStmt: undefined,
          stmt:       syntaxTree.children[4],
          doFirst:    false,
        });
      } else if (syntaxTree.ruleInd === 1) {
        Object.assign(syntaxTree, {
          dec:        undefined,
          cond:       syntaxTree.children[4],
          updateStmt: undefined,
          stmt:       syntaxTree.children[1],
          doFirst:    true,
        });
      } else {
        Object.assign(syntaxTree, {
          dec:        syntaxTree.children[2],
          cond:       syntaxTree.children[3],
          updateStmt: syntaxTree.children[4],
          stmt:       syntaxTree.children[6],
          doFirst:    false,
        });
      }
    },
  },
  "variable-declaration": {
    rules: [
      ["/var/", /\[/, "identifier-list"," /\\]/!", "/=/", "expression", "/;/"],
      ["/var/", "variable-assignment-list", "/;/"],
      ["/var/", "identifier-list", "/;/"],
    ],
    process: (syntaxTree) => {
      // TODO: Correct...
      if (syntaxTree.ruleInd === 0) {
        Object.assign(syntaxTree, {
          identList: syntaxTree.children[2],
          exp: syntaxTree.children[5],
          isDestruct: true,
        });
      } else {
        Object.assign(syntaxTree, {
          identList: syntaxTree.children[1],
          exp: syntaxTree.children[3],
          isDestruct: false,
        });
      }
    },
  },
  "identifier-list": {
    rules: [
      ["identifier", "/,/", "identifier-list!"],
      ["identifier"],
    ],
    process: straightenListSyntaxTree,
  },
  "identifier": {
    rules: [
      [/[_\$a-zA-Z][_\$a-zA-Z0-9]/],
    ],
    process: (syntaxTree) => {
      Object.assign(syntaxTree, {
        ident: syntaxTree.children[0].lexeme
      });
    },
  },
  "expression": {
    rules: [
      [/\[/, "identifier-list", /\]/,  "/=/", "expression"],
      [
        "identifier", "member-specification*", "assignment-operator",
        "expression^(1)",
      ],
      ["expression^(1)"],
    ],
    process: (syntaxTree) => {
      Object.assign(syntaxTree, {
        ident: syntaxTree.children[0],
        memberSpecList: syntaxTree.children[1],
        exp: syntaxTree.children[3],
      });
    },
  },
  "expression^(1)": {
    rules: [
      ["expression^(1)", /\?/, "expression!", "/:/", "expression"],
      ["expression^(2)"],
    ],
  },
  "expression^(1)": {
    rules: [
      ["or-expression"],
      ["expression^(2)"],
    ],
  },
  "expression^(2)": {
    rules: [
      ["and-expression"],
      ["expression^(3)"],
    ],
    process: becomeChild,
  },
  "expression^(3)": {
    rules: [
      ["bitwise-operator-expression"],
      ["expression^(4)"],
    ],
  },
  "grouped-expression": {
    rules: [
      [/\(/, "expression", /\)/],
    ],
    process: (syntaxTree) => becomeChild(syntaxTree, 1),
  },
};


export const funEntParser = new Parser(
  funEntGrammar,
  "function",
  [
    /"([^"\\]|\\[.\n])*"/,
    /'([^'\\]|\\[.\n])*'/,
    /\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
    /=>|@[\[\{<];?|[,:\[\]\{\}\(\)>\?=]/,
    /[^\s,:\[\]\{\}\(\)>\?='"]+/,
  ],
  /\s+/
);




/* Tests */

// regEntParser.log(regEntParser.parse(
//   `12`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, 13`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!"`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `,`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `@`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `@[`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12,`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12,\[`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!",@[7],_,false`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!",@[7],_,false,`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!",@[7],_,false`, "literal-list"
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"Hello, world!",@[7],_,false`, "literal"
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `"H`, "literal"
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12`, "literal", true
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12`, "literal", true, true
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12`, "literal+", true, true
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12`, "literal-list", true
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12,`, "literal-list", true
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12,@`, "literal-list", true
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, "Hello, @[7]!"`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, "Hello, @[7!"`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, [13, [14,[15 ,  16]]]`
// ));
// // Works.
// regEntParser.log(regEntParser.parse(
//   `12, {"prop": [13]}, 13`
// ));
// // Works.
//
//
// funEntParser.log(funEntParser.parse(
//   'class(' + [
//     '"Name":string',
//     '"Parent class":@[classes]?',
//   ].join(',')
// ));
// // Works.
funEntParser.log(funEntParser.parse(
  'class(' + [
    '"Name":string',
    '"Parent class":@[\'classes\']?',
    // 'Member format?:(f::Function|t::Entity type)',
    '"Member type":string="r"',
    '"Member format":f?',
    '"Description":h?',
  ].join(',') +
  ')=>({' + [
    '"Class":@[\'classes\']',
    '"Name":@{1}',
    '"Parent class":@{2}',
    '"Member type":@{3}',
    '"Member format":@{4}',
    '"Description":@{5}',
  ].join(',') + '})'
));
// Works.


















const specialCharPattern =
  /=>|[,;:"'\/\\\+\-\.\*\?\|&@\(\)\[\]\{\}=<>]/;
const nonSpecialCharsPattern = new RegExp (
  "[^" + specialCharPattern.source.substring(1) + "+"
);


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
    // process: (syntaxTree) => {
    //   let contentArr = syntaxTree.children[0].children;
    //   let children = contentArr;
    //   return [children];
    // },
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
    process: (syntaxTree) => {
      let startTagName = syntaxTree.children[1].lexeme;
      if (/^[xX][mM][lL]/.test(startTagName)) {
        return [null, "Element name cannot start with 'xml'"]
      }

      let ruleInd = syntaxTree.ruleInd;
      if (ruleInd === 0) {
        let endTagName = syntaxTree.children[7].lexeme;
        if (endTagName !== startTagName) {
          return [null,
            "End tag </" + endTagName + "> does not match start tag <" +
            startTagName + ">"
          ];
        }
      }

      Object.assign(syntaxTree, {
        name: startTagName,
        attrMembers: syntaxTree.children[2].children,
        content: (ruleInd === 0) ? syntaxTree.children[4] : undefined,
        isSelfClosing: (ruleInd === 1),
      });
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
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/],
    ],
  },
}

export const xmlParser = new Parser(
  xmlGrammar, "xml-text", xmlLexemePatternArr, xmlWSPattern
);

// // Tests:
// xmlParser.log(xmlParser.parse(
//   `Hello, world!`
// ));
// xmlParser.log(xmlParser.parse(
//   `Hello, <i>world</i>.`
// ));
// xmlParser.log(xmlParser.parse(
//   `Hello, <i>world</wrong>.`
// ));
