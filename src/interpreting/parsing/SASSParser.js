
import {Parser} from "./Parser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
  processPolyadicInfixOperation, processLeftAssocPostfixes,
} from "./processing.js";


const ELEMENT_TYPE_PATTERN =
  "(div|span|h1|h2|h3|h4|h5|h6|button)";
// TODO: Continue this list.

const COMBINATOR_REGEX = />|\+|~/;

const ATOMIC_PSEUDO_CLASS_PATTERN =
  "(first-child|last-child)";
// TODO: Continue this list.

const SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN =
  "(has|is)";
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

// const STRING_ONLY_PROPERTY_PATTERN =
//   "(content)";

const FLAG_PATTERN =
  "([^\\s\\S])";
// TODO: Continue this list.

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
      ["variable", "/:/", "value", "/;/"],
    ],
    process: (children) => ({
      type: "variable-declaration",
      ident: children[0].ident,
      value: children[2],
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
    process: copyFromChild,
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
        children: [children[0], ...children[1]],
      } : {
        type: "compound-selector",
        children: children[0],
      };
    },
  },
  "compound-selector^(1)": {
    rules: [
      ["simple-selector!1+"],
    ],
    process: (children) => ({
      type: "compound-selector",
      children: children[0],
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
  "class-selector": {
    rules: [
      // [/\.\-?[a-zA-Z_][a-zA-Z0-9_\-]*/],
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
        /\(/, "selector", /\)/
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
      ["/" + PROPERTY_PATTERN + "/", "/:/", "value!1+", "flag", "/;/!"],
      ["/" + PROPERTY_PATTERN + "/", "/:/", "value!1+", "/;/"],
      // ["/" + STRING_ONLY_PROPERTY_PATTERN + "/", "/:/", "string", "/;/"],
    ],
    process: (children) => ({
      type: "member",
      propName: children[0],
      valueArr: children[2],
      flagName: children[3]?.name,
    }),
  },
  "flag": {
    rules: [
      ["/!" + FLAG_PATTERN + "/"],
    ],
    process: () => ({
      type: "flag",
      lexeme: children[0],
    }),
  },
  "value": {
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
        /(\-|#)?(0|[1-9][0-9]*)(\.[0-9]+)?(%|[a-zA-Z]+)?/,
        /\|\|/,
        /(::|[.:!#])?[a-zA-Z_][a-zA-Z0-9_\-]*/,
        /[.,:;\[\]{}()<>?=+\-*|^&!%/#]/,
      ],
      /\s+|\/\*([^*]|\*(?!\/))*(\*\/\s*|$)/
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