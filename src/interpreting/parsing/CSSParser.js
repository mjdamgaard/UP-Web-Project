
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



export const sassGrammar = {
  "style-sheet": {
    rules: [
      ["ruleset*$"], // TODO: Extend.
    ],
    process: (children) => ({
      type: "style-sheet",
      children: children,
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
      ["compound-selector", "combinator", "complex-selector!"],
      ["compound-selector"],
    ],
    process: processPolyadicInfixOperation,
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
      ["property", "/:/!", "value", "flag", "/;/!"],
      ["property", "/:/!", "value", "/;/"],
    ],
    process: (children) => ({
      type: "member",
      propName: children[0].name,
      value: children[2],
      flagName: children[3]?.name,
    }),
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
        /(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
        /\+=|\-=|\*=|\/=|&&=|\|\|=|\?\?=/,
        /&&|\|\||\?\?|\+\+|\-\-|\*\*/,
        /\?\.|\.\.\.|=>|\/>|<\//,
        /===|==|!==|!=|<=|>=/,
        /[\.,:;\[\]\{\}\(\)<>\?=\+\-\*\|\^&!%\/]/,
        /[_\$a-zA-Z0-9]+/,
      ],
      /\s+|\/\/.*\n\s*|\/\*([^\*]|\*(?!\/))*(\*\/\s*|$)/
    );
  }

}



export const sassParser = new SASSParser();

export default {sassParser};