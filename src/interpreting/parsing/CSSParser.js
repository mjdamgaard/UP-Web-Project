
import {Parser} from "./Parser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
  processPolyadicInfixOperation, processLeftAssocPostfixes,
} from "./processing.js";
import {HTML_ELEMENT_TYPE_REGEX} from "./ScriptParser.js";


const ELEMENT_TYPE_PATTERN = HTML_ELEMENT_TYPE_REGEX.source.slice(1, -1);

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

const BUILT_IN_VALUE_PATTERN =
  "(red|green|blue|hidden|none|scroll|auto)";
// TODO: Continue this list.




export const cssGrammar = {
  "style-sheet": {
    rules: [
      ["S*", "statement*$"],
    ],
    process: (children) => ({
      type: "style-sheet",
      stmtArr: children,
    }),
  },
  "statement": {
    rules: [
      ["ruleset"],
      ["at-rule"],
    ],
    process: copyFromChild,
  },
  "ruleset": {
    rules: [
      ["selector-list", /\{/, "S*", "declaration!1+", /\}/, "S*"],
    ],
    process: (children) => ({
      type: "ruleset",
      selectorArr: children[0],
      stmtArr: children[2],
    }),
  },
  "selector-list": {
    rules: [
      ["selector", "/,/", "S*", "selector-list!1"],
      ["selector"],
    ],
    process: straightenListSyntaxTree,
    params: ["selector-list"],
  },
  "selector": {
    rules: [
      ["compound-selector", "combinator", "selector!"],
      ["compound-selector", "S+", "selector!1"],
      ["compound-selector", "S+"],
      ["compound-selector"],
    ],
    process: processPolyadicInfixOperation,
    params: ["complex-selector", 2]
  },
  "combinator": {
    rules: [
      [/>|\+|~/, "S*"],
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
      ["pseudo-element"],
      // ["id-selector"],
    ],
    process: copyFromChild,
  },
  "S": {
    rules: [
      [/[ \t\r\n\f]+/],
    ],
  },
  "class-selector": {
    rules: [
      [/\./, /[a-z][a-z0-9\-]*/],
    ],
    process: (children) => ({
      type: "class-selector",
      className: children[1],
    }),
  },
  "pseudo-class-selector": {
    rules: [
      ["/:/", "/" + ATOMIC_PSEUDO_CLASS_PATTERN + "/"],
      [
        "/:/", "/" + SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN + "/",
        /\(/, "S*", "selector-list", /\)/
      ],
      [
        "/:/", "/" + INTEGER_DEFINED_PSEUDO_CLASS_PATTERN + "/",
        /\(/, "S*", "integer", /\)/
      ],
    ],
    process: (children) => ({
      type: "pseudo-class-selector",
      lexeme: children[1],
      argument: children[4],
    }),
  },
  "pseudo-element": {
    rules: [
      ["/::/", "/" + PSEUDO_ELEMENT_PATTERN + "/"],
    ],
    process: (children) => ({
      type: "pseudo-element",
      lexeme: children[1],
    }),
  },
  "id-selector": {
    rules: [
      [/#[a-z][a-z0-9\-]*/],
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
  "declaration": {
    rules: [
      [
        "/" + PROPERTY_PATTERN + "/", "S*", "/:/", "S*", "value!1+", "flag!1",
        "/;/"
      ],
      ["/" + PROPERTY_PATTERN + "/", "S*", "/:/", "S*", "value!1+", "/;/"],
    ],
    process: (children) => ({
      type: "declaration",
      propName: children[0],
      valueArr: children[4],
      flagName: children[5]?.name,
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
      ["string"],
      ["number"],
      ["color"],
      ["length"],
      ["built-in-value"],
    ],
    process: copyFromChild,
  },
  "string": {
    rules: [
      [/"([^"\\]|\\[.\n])*"/, "S*"],
      [/'([^'\\]|\\[.\n])*'/, "S*"],
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
      ["/0|[1-9][0-9]*/", "S*"],
    ],
    process: copyLexemeFromChild,
    params: ["integer"],
  },
  "float": {
    rules: [
      [/(0|[1-9][0-9]*)(\.[0-9]+)?/, "S*"],
    ],
    process: copyLexemeFromChild,
    params: ["float"],
  },
  "color": {
    rules: [
      ["hex-color"],
    ],
    process: copyFromChild,
  },
  "hex-color": {
    rules: [
      ["/#/", "/([0-9a-fA-F]{2}){3,4}/", "S*"],
    ],
    process: (children) => ({
      type: "hex-color",
      value: children[0] + children[1],
    }),
  },
  "length": {
    rules: [
      [
        /\-?(0|[1-9][0-9]*)(\.[0-9]+)?/, /(cm|mm|Q|in|pc|pt|px|em|rem|vh|vw)/,
        "S*"
      ],
    ],
    process: (children) => ({
      type: "length",
      value: children[0] + children[1],
    }),
    params: ["length"],
  },
  "built-in-value": {
    rules: [
      ["/" + BUILT_IN_VALUE_PATTERN + "/"],
    ],
    process: copyLexemeFromChild,
    params: ["built-in-value"],
  },
  "at-rule": {
    rules: [
      // ["at-media-rule"],
      // ["at-container-rule"],
      // ["at-layer-rule"],
    ],
    process: copyFromChild,
  },
};



export class CSSParser extends Parser {
  constructor() {
    super(
      cssGrammar,
      "style-sheet",
      [
        /"([^"\\]|\\[.\n])*"/,
        /'([^'\\]|\\[.\n])*'/,
        /-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
        /((?<=\s)\-|#)?(0|[1-9][0-9]*)(\.[0-9]+)?(%|[a-zA-Z]+)?/,
        /\|\||::|[.,:;\[\]{}()<>?=+\-*|^&!%/#]/,
        /[a-zA-Z0-9_\-]+/,
        /[ \t\r\n\f]+/
      ],
      /\/\*([^*]|\*(?!\/))*(\*\/|$)/
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



export const cssParser = new CSSParser();

export default {cssParser};