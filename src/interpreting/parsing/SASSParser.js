
import {Parser} from "./Parser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
  processPolyadicInfixOperation, processLeftAssocPostfixes,
} from "./processing.js";


const ELEMENT_TYPE_PATTERN =
  "(div|span|h1|h2|h3|h4|h5|h6|button)";
// TODO: Continue this list.

const ATOMIC_PSEUDO_CLASS_PATTERN =
  "(first-child|last-child)";
// TODO: Continue this list.

const SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN =
  "(has|is)";
// TODO: Continue this list.

const INTEGER_DEFINED_PSEUDO_CLASS_PATTERN =
  "(nth-child)";
// TODO: Continue this list.

const PROPERTY_PATTERN =
  "(color|background-color)";
// TODO: Continue this list.

const FLAG_PATTERN =
  "([^\\s\\S])";
// TODO: Continue this list.

const BUILT_IN_COLOR_PATTERN =
  "(red|green|blue)";
// TODO: Continue this list.




export const sassGrammar = {
  "style-sheet": {
    rules: [
      ["ruleset*$"], // TODO: Extend.
    ],
    process: (children) => ({
      type: "style-sheet",
      atUseRuleArr: [],
      stmtArr: children,
    }),
  },
  "ruleset": {
    rules: [
      ["selector-list", /\{/, "member!1+", /\}/],
    ],
    process: (children) => ({
      type: "ruleset",
      selectorArr: children[0],
      memberArr: children[2],
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
  "complex-selector": {
    rules: [
      ["compound-selector", "combinator?", "complex-selector"],
      ["compound-selector"],
    ],
    process: processPolyadicInfixOperation,
  },
  "combinator": {
    rules: [
      [/>|\+|~/],
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
      classname: children[0].substring(1),
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
      classname: children[0].substring(1),
      argument: children[2],
    }),
  },
  "id-selector": {
    rules: [
      [/#[a-zA-Z][a-zA-Z0-9_\-]*/],
    ],
    process: (children) => ({
      type: "id-selector",
      name: children[0].substring(1),
    }),
  },
  "universal-selector": {
    rules: [
      [/\*/],
    ],
    process: () => ({
      type: "universal-selector",
    }),
  },
  "type-selector": {
    rules: [
      ["/" + ELEMENT_TYPE_PATTERN + "/"],
    ],
    process: (children) => ({
      type: "type-selector",
      name: children[0],
    }),
  },
  "member": {
    rules: [
      ["property", "/:/!", "value!1+", "flag", "/;/!"],
      ["property", "/:/!", "value!1+", "/;/"],
    ],
    process: (children) => ({
      type: "member",
      propName: children[0].name,
      valArr: children[2],
      flagName: children[3]?.name,
    }),
  },
  "property": {
    rules: [
      ["/" + PROPERTY_PATTERN + "/"],
    ],
    process: () => ({
      type: "property",
      name: children[0],
    }),
  },
  "flag": {
    rules: [
      ["/!" + FLAG_PATTERN + "/"],
    ],
    process: () => ({
      type: "flag",
      name: children[0].substring(1),
    }),
  },
  "value": {
    rules: [
      ["number"],
      ["color"],
      ["length"],
    ],
    process: copyFromChild,
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
    process: (children) => ({
      type: "hex-color",
      hexStr: children[0].substring(1),
    }),
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
    process: (children) => {
      let [ , numLexeme, unit] = /([\-0-9.]+)([a-zA-Z]*)/.exec(children[0]);
      return {
        type: "length",
        numLexeme: numLexeme,
        unit: unit,
      };
    },
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