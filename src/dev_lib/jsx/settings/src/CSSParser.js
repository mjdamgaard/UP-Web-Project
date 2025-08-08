
import {Parser} from "../../../../interpreting/parsing/Parser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
  processPolyadicInfixOperation,
} from "../../../../interpreting/parsing/processing.js";
import {HTML_ELEMENT_TYPE_REGEX} from "../../../../interpreting/parsing/ScriptParser.js";


const ELEMENT_TYPE_PATTERN = HTML_ELEMENT_TYPE_REGEX.source.slice(1, -1);

const ATOMIC_PSEUDO_CLASS_PATTERN =
  "(scope|first-child|last-child)";
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
  "(color|background-color|font-style|font-weight)";
// TODO: Continue this list.

const FLAG_PATTERN =
  "([^\\s\\S])";

const BUILT_IN_VALUE_PATTERN =
  "(red|green|blue|italic|bold|oblique|hidden|none|scroll|auto)";
// TODO: Continue this list.

const UNIT_PATTERN =
  "(cm|mm|Q|in|pc|pt|px|em|rem|vh|vw|deg)";
// TODO: Continue this list.



export const cssGrammar = {
  "style-sheet": {
    rules: [
      ["S*", "statement*$"],
    ],
    process: (children) => ({
      type: "style-sheet",
      stmtArr: children[1],
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
      selectorList: children[0],
      decArr: children[3],
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
      ["compound-selector", "non-space-combinator", "selector!"],
      ["compound-selector", "S+", "selector!1"],
      ["compound-selector", "S+"],
      ["compound-selector"],
    ],
    process: processPolyadicInfixOperation,
    params: ["complex-selector", 2]
  },
  "non-space-combinator": {
    rules: [
      [/>|\+|~/, "S*"],
    ],
    process: copyLexemeFromChild,
    params: ["non-space-combinator"],
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
        mainChildren: [children[0], ...(children[1][0]?.mainChildren ?? [])],
        pseudoElement: children[1][0]?.pseudoElement,
      } : {
        type: "compound-selector",
        mainChildren: children[0].mainChildren,
        pseudoElement: children[0].pseudoElement,
      };
    },
  },
  "compound-selector^(1)": {
    rules: [
      ["simple-selector^(1)!1+!1", "pseudo-element!1?"],
      ["pseudo-element"],
    ],
    process: (children, ruleInd) => ({
      type: "compound-selector",
      mainChildren: (ruleInd === 0) ? children[0] : [],
      pseudoElement: (ruleInd === 0) ? children[1][0] : children[0],
    }),
  },
  "simple-selector^(1)": {
    rules: [
      ["class-selector"],
      ["pseudo-class-selector"],
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
      [/\./, /[a-z_][a-z0-9_\-]*/],
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
        "/;/", "S*"
      ],
      [
        "/" + PROPERTY_PATTERN + "/", "S*", "/:/", "S*", "value!1+", "/;/",
        "S*"
      ],
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
      ["dimension"],
      ["number"],
      ["string"],
      ["hex-color"],
      ["built-in-value"],
    ],
    process: copyFromChild,
  },
  "string": {
    rules: [
      [/"([^"\\]|\\[.\n])*"/, "S*"],
      [/'([^'\\]|\\[.\n])*'/, "S*"],
    ],
    process: (children) => {
      let jsonString;
      try {
        jsonString = JSON.stringify(JSON.parse(children[0]));
      } catch (_) {
        return "Invalid string";
      }
      return {
        type: "string",
        lexeme: jsonString,
      }
    },
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
  "hex-color": {
    rules: [
      ["/#/", "/([0-9a-fA-F]{2}){3,4}/", "S*"],
    ],
    process: (children) => ({
      type: "hex-color",
      value: children[0] + children[1],
    }),
  },
  "dimension": {
    rules: [
      [
        "/\\-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][\\-\\+]?(0|[1-9][0-9]*))?" +
        UNIT_PATTERN + "/", "S*"
      ],
    ],
    process: (children) => ({
      type: "dimension",
      value: children[0] + children[1],
    }),
    params: ["dimension"],
  },
  "built-in-value": {
    rules: [
      ["/" + BUILT_IN_VALUE_PATTERN + "/", "S*"],
    ],
    process: copyLexemeFromChild,
    params: ["built-in-value"],
  },
  "at-rule": {
    rules: [
      ["at-media-rule"],
      // ["at-container-rule"],
      // ["at-layer-rule"],
    ],
    process: copyFromChild,
  },
  "at-media-rule": {
    rules: [
      [/[^\s\S]/],
    ],
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
        /[a-zA-Z0-9_\-]+/,
        /((?<=\s)\-)?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/,
        /\|\||::|[.,:;\[\]{}()<>?=+\-*|^&!%/#]/,
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