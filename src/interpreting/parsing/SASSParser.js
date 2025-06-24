
import {Parser} from "./Parser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
  processPolyadicInfixOperation, processLeftAssocPostfixes,
} from "./processing.js";
import {HTML_ELEMENT_TYPE_REGEX} from "./ScriptParser.js";


const ELEMENT_TYPE_PATTERN = HTML_ELEMENT_TYPE_REGEX.source.slice(1, -1);

const COMBINATOR_REGEX = />|\+|~|(\s+|\/\*([^*]|\*(?!\/))*(\*\/|$))+/;

const ATOMIC_PSEUDO_CLASS_PATTERN =
  "(first-child|last-child)";
// TODO: Continue this list.

const SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN =
  "(is|where|not)";
// TODO: Continue this list.

const INTEGER_DEFINED_PSEUDO_CLASS_PATTERN =
  "(nth-child)";
// TODO: Continue this list.

const PSEUDO_ELEMENT_PATTERN =
  "(before|after|first-line)";
// TODO: Continue this list.

const PROPERTY_PATTERN =
  "(color|background-color)";
// TODO: Continue this list.

const FLAG_PATTERN =
  "([^\\s\\S])";

const BUILT_IN_COLOR_PATTERN =
  "(red|green|blue)";
// TODO: Continue this list.




export const sassGrammar = {
  "style-sheet": {
    rules: [
      ["statement*$"],
    ],
    process: (children) => ({
      type: "style-sheet",
      stmtArr: children,
    }),
  },
  "statement": {
    rules: [
      ["variable-declaration"],
      ["ruleset"],
    ],
    process: copyFromChild,
  },
  "variable-declaration": {
    rules: [
      ["variable", "/:/", "value", "/!default/", "/;/"],
      ["variable", "/:/", "value", "/;/"],
    ],
    process: (children, ruleInd) => ({
      type: "variable-declaration",
      ident: children[0].ident,
      value: children[2],
      isAdjustable: ruleInd === 0,
    }),
  },
  "variable": {
    rules: [
      [/\$[a-zA-Z][a-zA-Z0-9\-]*/],
    ],
    process: (children) => ({
      type: "ruleset",
      ident: children[0].substring(1),
      lexeme: undefined,
    }),
  },
  "ruleset": {
    rules: [
      ["selector-list", /\{/, "nested-statement!1+", /\}/],
    ],
    process: (children) => ({
      type: "ruleset",
      selectorArr: children[0],
      nestedStmtArr: children[2],
    }),
  },
  "selector-list": {
    rules: [
      ["selector", "/,/", "selector-list!1"],
      ["selector"],
    ],
    process: straightenListSyntaxTree,
    params: ["selector-list"],
  },
  "selector": {
    rules: [
      ["complex-selector", "pseudo-element"],
      ["complex-selector"],
    ],
    process: (children) => ({
      type: "selector",
      complexSelector: children[0],
      pseudoElement: children[1],
    }),
  },
  "pseudo-element": {
    rules: [
      ["/::" + PSEUDO_ELEMENT_PATTERN + "/"],
    ],
    process: (children) => ({
      type: "pseudo-element",
      lexeme: children[0],
    }),
  },
  "relative-complex-selector": {
    rules: [
      ["/&/", "combinator?", "complex-selector"],
      ["/&/"],
      ["complex-selector"],
    ],
    process: (children, ruleInd) => ({
      type: "relative-complex-selector",
      children: (ruleInd === 2) ? children[0].children :
        [children[0], children[1], ...children[2].children],
    }),
  },
  "complex-selector": {
    rules: [
      ["compound-selector", "combinator?", "complex-selector"],
      ["compound-selector"],
    ],
    process: processPolyadicInfixOperation,
    params: ["complex-selector"],
  },
  "combinator": {
    rules: [
      [COMBINATOR_REGEX],
    ],
    process: copyLexemeFromChild,
  },
  "compound-selector": {
    rules: [
      ["universal-selector", "compound-selector^(1)!1?"],
      ["type-selector",      "compound-selector^(1)!1?"],
      ["compound-selector^(1)"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd <= 1) ? {
        type: "compound-selector",
        children: [children[0], ...children[1].children],
      } : {
        type: "compound-selector",
        children: children[0].children,
      };
    },
  },
  "compound-selector^(1)": {
    rules: [
      ["simple-selector!1+"],
    ],
    process: (children) => ({
      type: "compound-selector",
      children: children[0].children,
    }),
  },
  "simple-selector": {
    rules: [
      ["class-selector"],
      ["pseudo-class-selector"],
      ["id-selector"],
    ],
    process: copyFromChild,
  },
  "whitespace": {
    rules: [
      [/(\s+|\/\*([^*]|\*(?!\/))*(\*\/|$))+/],
    ],
  },
  "class-selector": {
    rules: [
      [/\.[a-zA-Z][a-zA-Z0-9_\-]*/],
    ],
    process: (children) => ({
      type: "class-selector",
      className: children[0].substring(1),
    }),
  },
  "pseudo-class-selector": {
    rules: [
      ["/:" + ATOMIC_PSEUDO_CLASS_PATTERN + "/"],
      [
        "/:" + SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN + "/",
        /\(/, "selector-list", /\)/
      ],
      [
        "/:" + INTEGER_DEFINED_PSEUDO_CLASS_PATTERN + "/",
        /\(/, "integer", /\)/
      ],
    ],
    process: (children) => ({
      type: "pseudo-class-selector",
      lexeme: children[0],
      argument: children[2],
    }),
  },
  "id-selector": {
    rules: [
      [/#[a-zA-Z][a-zA-Z0-9_\-]*/],
    ],
    process: copyLexemeFromChild,
    params: ["id-selector"],
  },
  "universal-selector": {
    rules: [
      [/\*/],
    ],
    process: copyLexemeFromChild,
    params: ["universal-selector"],
  },
  "type-selector": {
    rules: [
      ["/" + ELEMENT_TYPE_PATTERN + "/"],
    ],
    process: copyLexemeFromChild,
    params: ["type-selector"],
  },
  "nested-statement": {
    rules: [
      ["variable-declaration"],
      ["member"],
    ],
    process: copyFromChild,
  },
  "member": {
    rules: [
      [
        "/" + PROPERTY_PATTERN + "/", "whitespace?", "/:/", "value!1+",
        "flag", "/;/!"
      ],
      ["/" + PROPERTY_PATTERN + "/", "whitespace?", "/:/", "value!1+", "/;/"],
    ],
    process: (children) => ({
      type: "member",
      propName: children[0],
      valueArr: children[3],
      flagName: children[4]?.name,
    }),
  },
  "flag": {
    rules: [
      ["/!" + FLAG_PATTERN + "/"],
    ],
    process: (children) => ({
      type: "flag",
      lexeme: children[0],
    }),
  },
  "value": {
    rules: [
      ["whitespace?", "value^(1)"],
    ],
    process: (children) => children[1],
  },
  "value^(1)": {
    rules: [
      ["variable"],
      ["string"],
      ["number"],
      ["color"],
      ["length"],
    ],
    process: copyFromChild,
  },
  "string": {
    rules: [
      [/"([^"\\]|\\[.\n])*"/],
      [/'([^'\\]|\\[.\n])*'/],
    ],
    process: copyLexemeFromChild,
    params: ["string"],
  },
  "number": {
    rules: [
      ["integer"],
      ["float"],
    ],
    process: copyFromChild,
  },
  "integer": {
    rules: [
      ["/0|[1-9][0-9]*/"],
    ],
    process: copyLexemeFromChild,
    params: ["integer"],
  },
  "float": {
    rules: [
      [/(0|[1-9][0-9]*)(\.[0-9]+)?/],
    ],
    process: copyLexemeFromChild,
    params: ["float"],
  },
  "color": {
    rules: [
      ["hex-color"],
      ["built-in-color"],
    ],
    process: copyFromChild,
  },
  "hex-color": {
    rules: [
      ["/#([0-9a-fA-F]{2}){3,4}/"],
    ],
    process: copyLexemeFromChild,
    params: ["hex-color"],
  },
  "built-in-color": {
    rules: [
      ["/" + BUILT_IN_COLOR_PATTERN + "/"],
    ],
    process: copyLexemeFromChild,
    params: ["built-in-color"],
  },
  "length": {
    rules: [
      [/\-?(0|[1-9][0-9]*)(\.[0-9]+)?(cm|mm|Q|in|pc|pt|px|em|rem|vh|vw)/],
    ],
    process: copyLexemeFromChild,
    params: ["length"],
    // process: (children) => {
    //   let [ , numLexeme, unit] = /([\-0-9.]+)([a-zA-Z]*)/.exec(children[0]);
    //   return {
    //     type: "length",
    //     numLexeme: numLexeme,
    //     unit: unit,
    //   };
    // },
  },
};



export class SASSParser extends Parser {
  constructor() {
    super(
      sassGrammar,
      "style-sheet",
      [
        /"([^"\\]|\\[.\n])*"/,
        /'([^'\\]|\\[.\n])*'/,
        /((?<=\s)\-|#)?(0|[1-9][0-9]*)(\.[0-9]+)?(%|[a-zA-Z]+)?/,
        /\|\|/,
        /(::|[.:#])[a-zA-Z_][a-zA-Z0-9_\-]*/,
        /((?<=\s)!)?[a-zA-Z_][a-zA-Z0-9_\-]*/,
        /[.,:;\[\]{}()<>?=+\-*|^&!%/#]/,
        /(\s+|\/\*([^*]|\*(?!\/))*(\*\/|$))+(?=[.:#])/
      ],
      /(\s+|\/\*([^*]|\*(?!\/))*(\*\/|$))+/
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



export const sassParser = new SASSParser();

export default {sassParser};