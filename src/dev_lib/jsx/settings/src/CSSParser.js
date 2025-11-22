
import {Parser} from "../../../../interpreting/parsing/Parser.js";
import {
  straightenListSyntaxTree, copyFromChild, copyLexemeFromChild,
  processPolyadicInfixOperation,
} from "../../../../interpreting/parsing/processing.js";



const ELEMENT_TYPE_PATTERN = "[a-z]+";

const ATOMIC_PSEUDO_CLASS_PATTERN = "[a-z][a-z\\-]*";

const SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN =
  "(is|where|not)";

const RELATIVE_SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN =
  "(has)";

const INTEGER_DEFINED_PSEUDO_CLASS_PATTERN = "nth-(last-)?(child|of-type)";

const PSEUDO_ELEMENT_PATTERN = "[a-z][a-z\\-]*";

const FLAG_PATTERN =
  "([^\\s\\S])";


const PROPERTY_PATTERN = "[a-z\\-]+";

const BUILT_IN_VALUE_PATTERN = "[a-z\\-]+";


const UNIT_PATTERN = "(%|[a-z]+)";


const FUNCTION_NAME_PATTERN =
  "(abs|acos|asin|atan|atan2|blur|brightness|calc|circle|clamp|color-mix|" +
  "color|conic-gradient|contrast|cos|counters?|cubic-bezier|drop-shadow|" +
  "ellipse|exp|fit-content|grayscale|hsl|hue-rotate|hwb|hypot|inset|" +
  "invert|lab|lch|light-dark|linear-gradient|linear|log|matrix|matrix3d|" +
  "max|min|minmax|mod|oklab|oklch|opacity|path|perspective|polygon|pow|" +
  "radial-gradient|ray|rect|rem|repeat|" +
  "repeating-(conic|linear|radial)-gradient|rgba?|" +
  "rotate(3d|X|Y|Z)?|scale(3d|X|Y|Z)?|skew[XYZ]?|translate(3d|X|Y|Z)?|" +
  "round|saturate|scroll|sepia|shape|sign|sin|sqrt|steps|tan|view|xywh)";


export const cssGrammar = {
  "style-sheet": {
    rules: [
      ["S*", "statement!1*"],
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
  "relative-selector-list": {
    rules: [
      ["relative-selector", "/,/", "S*", "relative-selector-list!1"],
      ["relative-selector"],
    ],
    process: straightenListSyntaxTree,
    params: ["relative-selector-list"],
  },
  "relative-selector": {
    rules: [
      ["non-space-combinator", "selector!"],
      ["selector"],
    ],
    process: (children, ruleInd) => ({
      type: "relative-selector",
      combinator: (ruleInd === 0) ? children[0] : undefined,
      selector: (ruleInd === 0) ? children[1] : children[0],
    }),
  },
  "non-space-combinator": {
    rules: [
      ["S*", />|\+|~/, "S*"],
    ],
    process: copyLexemeFromChild,
    params: ["non-space-combinator", 1],
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
      [
        "/:/", "/" + SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN + "/!1",
        /\(/, "S*", "selector-list", /\)/
      ],
      [
        "/:/", "/" + RELATIVE_SELECTOR_DEFINED_PSEUDO_CLASS_PATTERN + "/!1",
        /\(/, "S*", "relative-selector-list", /\)/
      ],
      [
        "/:/", "/" + INTEGER_DEFINED_PSEUDO_CLASS_PATTERN + "/!1",
        /\(/, "S*", "integer", /\)/
      ],
      ["/:/", "/" + ATOMIC_PSEUDO_CLASS_PATTERN + "/"],
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
      // [
      //   "/" + PROPERTY_PATTERN + "/", "S*", "/:/", "S*", "value!1+", "flag!1",
      //   "/;/", "S*"
      // ],
      [
        "/" + PROPERTY_PATTERN + "/", "S*", "/:/", "S*", "value!1+", "/;/",
        "S*"
      ],
    ],
    process: (children) => ({
      type: "declaration",
      propName: children[0],
      valueArr: children[4],
      // flagName: children[5]?.name,
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
      ["function-call"],
      ["ratio"],
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
      [/(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/, "S*"],
    ],
    process: copyLexemeFromChild,
    params: ["float"],
  },
  "ratio": {
    rules: [
      [
        /(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/, "S*", /\//,
        "S*!", /(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?/, "S*"
      ],
    ],
    process: (children) => ({
      type: "ratio",
      value: children[0] + " / " + children[4],
    }),
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
  "function-call": {
    rules: [
      ["/" + FUNCTION_NAME_PATTERN + "/", /\(/, "value-or-operator!1*", /\)/],
    ],
    process: (children) => ({
      type: "function-call",
      ident: children[0],
      valOrOpArr: children[2],
    }),
  },
  "value-or-operator": {
    rules: [
      ["value"],
      [/[,+\-*/]/, "S*"],
    ],
    process: (children, ruleInd) => {
      return (ruleInd === 0) ? copyFromChild(children, ruleInd) : {
        type: "operator",
        lexeme: children[0],
      };
    },
  },
  "at-rule": {
    rules: [
      ["at-container-rule"],
      ["at-keyframes-rule"],
      // TODO: Implement:
      // ["at-media-rule"], // (Only implement a subset of this.)
      // ["at-supports-rule"],
    ],
    process: copyFromChild,
  },
  "at-container-rule": {
    rules: [
      [
        "/@container/", "S*", "identifier?", "style-feature-list?",
        /\{/, "style-sheet", /\}/, "S*"
      ],
    ],
    process: (children) => ({
      type: "at-rule",
      atKeyword: "@container",
      params: children[2].concat(children[3][0]?.children ?? []),
      content: children[5],
    }),
  },
  "identifier": {
    rules: [
      [/[a-z][a-z\-]*/, "S*"],
    ],
    process: (children) => ({
      type: "identifier",
      lexeme: children[0],
    }),
  },
  "style-feature-list": {
    rules: [
      ["/not/", "S*", "style-feature"],
      ["style-feature", "style-feature-list-tail"],
      ["style-feature",],
    ],
    process: (children, ruleInd) => ({
      type: "style-feature-list",
      children: (ruleInd === 0) ? [children[0], children[2]] :
        (ruleInd === 1) ? [children[0], ...children[1].children] :
        [children[0]],
    }),
  },
  "style-feature-list-tail": {
    rules: [
      ["/and|or/", "S*", "style-feature", "style-feature-list-tail"],
      ["/and|or/", "S*", "style-feature"],
    ],
    process: (children, ruleInd) => ({
      type: "style-feature-list-tail",
      children: (ruleInd === 0) ? [
        children[0], children[2], ...children[1].children
      ] : [
        children[0], children[2],
      ],
    }),
  },
  "style-feature": {
    rules: [
      [
        /\(/, "/" + PROPERTY_PATTERN + "/", "S*", "/:|<|<=|>|>=/", "S*",
        "value", "S*", /\)/, "S*"
      ],
      [
        /\(/, "value", "S*", "/<|<=/", "S*", "/" + PROPERTY_PATTERN + "/",
        "S*", "/<|<=/", "S*", "value", "S*", /\)/, "S*"
      ],
    ],
    process: (children, ruleInd) => (
      (ruleInd === 0) ? {
      type: "style-feature",
      subType: "relation",
      property: children[1],
      operator: children[3],
      value: children[5],
    } : {
      type: "style-feature",
      subType: "range",
      loVal: children[1],
      loOp: children[3],
      property: children[5],
      hiOp: children[7],
      hiVal: children[9],

    }),
  },
  "at-keyframes-rule": {
    rules: [
      [
        "/@keyframes/", "S*", "identifier?", /\{/, "S*", "keyframes-content",
        /\}/, "S*"
      ],
    ],
    process: (children) => ({
      type: "at-rule",
      atKeyword: "@keyframes",
      params: children[2],
      content: children[5],
    }),
  },
  "keyframes-content": {
    rules: [
      ["keyframes-statement!1*"],
    ],
    process: (children) => ({
      type: "keyframes-content",
      stmtArr: children[0],
    }),
  },
  "keyframes-statement": {
    rules: [
      [/to|from|(0|100|[1-9][0-9])%/, /\{/, "S*", "declaration!1*", /\}/, "S*"],
      [/to|from|(0|100|[1-9][0-9])%/, "/,/", "S*"],
    ],
    process: (children, ruleInd) => ({
      type: "ruleset",
      offset: children[0],
      decArr: (ruleInd === 0) ? children[3] : undefined,
    }),
  },
  // "at-media-rule": {
  //   rules: [
  //     [
  //       "/@media/", "S+", "media-query!1+", "S*", /\{/,
  //       "style-sheet", /\}/, "S*"
  //     ],
  //   ],
  //   process: (children) => ({
  //     type: "at-media-rule",
  //     params: children[2],
  //     content: children[5],
  //   }),
  // },
};



export class CSSParser extends Parser {
  constructor() {
    super(
      cssGrammar,
      "style-sheet",
      [
        /"([^"\\]|\\[.\n])*"/,
        /'([^'\\]|\\[.\n])*'/,
/((?<=\s)\-)?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][\-\+]?(0|[1-9][0-9]*))?[%a-zA-Z0-9_\-]*/,
        /@?[a-zA-Z0-9_\-]+/,
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