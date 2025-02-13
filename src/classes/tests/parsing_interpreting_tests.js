
import {regEntParser, scriptParser} from "../DataParser.js";
import {ScriptInterpreter} from "../ScriptInterpreter.js";




export function runTests() {
  // regEnt_parsing_tests_01(); // Last tested: (13.02.25, 14:24).
  script_parsing_tests_01();

}












function testParser({
  parser, str, startSym, isPartial, keepLastLexeme,
  expectedIsSuccess, expectedNextPos,
  testMsgPrefix, testKey, logParserOutput, logOnlyFailures,
  additionalTest = () => true,
}) {
  let [syntaxTree, lexArr, strPosArr] = parser.parse(
    str, startSym, isPartial, keepLastLexeme
  );

  expectedNextPos ??= lexArr?.length;
  let isSuccessMsg = "SUCCESS";
  if (
    syntaxTree.isSuccess != expectedIsSuccess ||
    syntaxTree.nextPos !== expectedNextPos
  ) {
    isSuccessMsg = "FAILURE";
  }
  else if (!additionalTest(syntaxTree, lexArr, strPosArr)) {
    isSuccessMsg = "FAILURE";
  }

  if (!logOnlyFailures || isSuccessMsg === "FAILURE") {
    console.log(
      testMsgPrefix + "." + testKey + ": " + isSuccessMsg +
      (logParserOutput ? ":" : "")
    );
    if (logParserOutput) {
      parser.log(syntaxTree);
    }
  }
}




function getMissingMember(testObj, propObj, prefix = "") {
  let ret = undefined;
  Object.entries(propObj).some(([key, propObjVal]) => {
    let testObjVal = testObj[key];
    if (typeof propObjVal === "object" && propObjVal !== null) {
      if (typeof testObjVal === "object" && testObjVal !== null) {
        ret = getMissingMember(testObjVal, propObjVal, prefix + "." + key);
        return (ret !== undefined);
      } else {
        ret = key;
        debugger; // Useful to let this debugger statement remain.
        return true;
      }
    } else {
      ret = (testObjVal === propObjVal) ? undefined : key;
      if (ret !== undefined) debugger; // Useful to let this statement remain.
      return (ret !== undefined);
    }
  });
  return ret;
}






function script_parsing_tests_01() {
  let testMsgPrefix = "regEnt_parsing_tests_01";

  console.log("Running " + testMsgPrefix + ":");

  let defaultParams = {
    parser: scriptParser, str: "", startSym: undefined, isPartial: undefined,
    keepLastLexeme: undefined,
    expectedIsSuccess: true, expectedNextPos: null,
    testMsgPrefix: testMsgPrefix, testKey: "",
    logParserOutput: true, logOnlyFailures: false,
    additionalTest: undefined,
  }
  let params;


  params = Object.assign({}, defaultParams, {
    str: `2 + 2`,
    startSym: "expression",
    expectedIsSuccess: true,
    testKey: "01",
    additionalTest: (syntaxTree) => {
      return (
        syntaxTree.type === "additive-expression" &&
        syntaxTree.children[0].type === "number" &&
        syntaxTree.children[0].lexeme === "2" &&
        syntaxTree.children[1].lexeme === "+" &&
        syntaxTree.children[2].type === "number" &&
        syntaxTree.children[2].lexeme === "2"
      );
    },
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `2 + 2 - 3`,
    startSym: "expression",
    expectedIsSuccess: true,
    testKey: "02",
    additionalTest: (syntaxTree) => {
      return (
        syntaxTree.type === "additive-expression" &&
        syntaxTree.children[0].type === "number" &&
        syntaxTree.children[0].lexeme === "2" &&
        syntaxTree.children[1].lexeme === "+" &&
        syntaxTree.children[2].type === "number" &&
        syntaxTree.children[2].lexeme === "2" &&
        syntaxTree.children[3].lexeme === "-" &&
        syntaxTree.children[4].type === "number" &&
        syntaxTree.children[4].lexeme === "3"
      );
    },
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `2 ** 4 / 5 + 2 - (3) + (2 + 2) || true`,
    startSym: "expression",
    expectedIsSuccess: true,
    testKey: "03",
    additionalTest: (syntaxTree) => {
      return undefined === getMissingMember(syntaxTree, {
        type: "or-expression",
        children: [
          {
            type: "additive-expression",
            children: [
              {
                type: "multiplicative-expression",
                children: [
                  {
                    type: "exponential-expression",
                    root: {type: "number", lexeme: "2"},
                    exp: {type: "number", lexeme: "4"},
                  },
                  {lexeme: "/"},
                  {type: "number", lexeme: "5"},
                ],
              },
              {lexeme: "+"},
              {type: "number", lexeme: "2"},
              {lexeme: "-"},
              {
                type: "grouped-expression",
                exp: {type: "number", lexeme: "3"},
              },
              {lexeme: "+"},
              {
                type: "grouped-expression",
                exp: {
                  type: "additive-expression",
                  children: [
                    {type: "number", lexeme: "2"},
                    {lexeme: "+"},
                    {type: "number", lexeme: "2"},
                  ],
                },
              },
            ],
          },
          {lexeme: "||"},
          {type: "constant", lexeme: "true"},
        ],
      });
    }
  });
  testParser(params);



  console.log("Finished " + testMsgPrefix + ".");
}








function regEnt_parsing_tests_01() {
  let testMsgPrefix = "regEnt_parsing_tests_01";

  console.log("Running " + testMsgPrefix + ":");

  let defaultParams = {
    parser: regEntParser, str: "", startSym: undefined, isPartial: undefined,
    keepLastLexeme: undefined,
    expectedIsSuccess: true, expectedNextPos: null,
    testMsgPrefix: testMsgPrefix, testKey: "",
    logParserOutput: true, logOnlyFailures: true,
    additionalTest: undefined,
  }
  let params;


  params = Object.assign({}, defaultParams, {
    str: `12`,
    expectedIsSuccess: true,
    testKey: "01"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12, 13`,
    expectedIsSuccess: true,
    testKey: "02"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `"Hello, world!"`,
    expectedIsSuccess: true,
    testKey: "03"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `,`,
    expectedIsSuccess: false, expectedNextPos: 0,
    testKey: "04"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `@`,
    expectedIsSuccess: false, expectedNextPos: undefined, // Lexer error,
    testKey: "05"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `@[`,
    expectedIsSuccess: false, expectedNextPos: 1,
    testKey: "06"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12,`,
    expectedIsSuccess: false, expectedNextPos: 2,
    testKey: "07"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12,[`,
    expectedIsSuccess: false, expectedNextPos: 3,
    testKey: "08"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `"Hello, world!",@[7],_,false`,
    expectedIsSuccess: true, expectedNextPos: 9,
    testKey: "09"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `"Hello, world!",@[7],_,false,`,
    expectedIsSuccess: false, expectedNextPos: 10,
    testKey: "10"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `"Hello, world!",@[7],_,false`,
    startSym: "literal-list",
    expectedIsSuccess: true, expectedNextPos: 9,
    testKey: "11"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `"Hello, world!",@[7],_,false`,
    startSym: "literal",
    expectedIsSuccess: false, expectedNextPos: 1,
    testKey: "12"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `"H`,
    startSym: "literal",
    expectedIsSuccess: false, expectedNextPos: 0,
    testKey: "13"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12`,
    startSym: "literal",
    expectedIsSuccess: true, expectedNextPos: 1,
    testKey: "14"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12`,
    startSym: "literal",
    isPartial: true, keepLastLexeme: false,
    expectedIsSuccess: false, expectedNextPos: 0,
    testKey: "15"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12`,
    startSym: "literal",
    isPartial: true, keepLastLexeme: true,
    expectedIsSuccess: false, expectedNextPos: 1,
    testKey: "16"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12`,
    startSym: "literal+",
    isPartial: true, keepLastLexeme: true,
    expectedIsSuccess: false, expectedNextPos: 1,
    testKey: "17"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12`,
    isPartial: true, keepLastLexeme: false,
    expectedIsSuccess: false, expectedNextPos: 0,
    testKey: "18"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12`,
    isPartial: true, keepLastLexeme: true,
    expectedIsSuccess: false, expectedNextPos: 1,
    testKey: "19"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12,`,
    isPartial: true, keepLastLexeme: false,
    expectedIsSuccess: false, expectedNextPos: 1,
    testKey: "20"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12,@`,
    isPartial: true, keepLastLexeme: false,
    expectedIsSuccess: false, expectedNextPos: 2,
    testKey: "21"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12, "Hello", @[7]!`,
    expectedIsSuccess: false, expectedNextPos: undefined, // Lexer error.
    testKey: "22"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12, [13, [14,[15 ,  16]]]`,
    expectedIsSuccess: true,
    testKey: "23"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12, {"prop": [13]}, 13`,
    expectedIsSuccess: true,
    testKey: "24"
  });
  testParser(params);


  console.log("Finished " + testMsgPrefix + ".");
}