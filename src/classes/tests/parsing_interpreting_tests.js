
import {regEntParser, scriptParser} from "../DataParser.js";
import {ScriptInterpreter} from "../ScriptInterpreter.js";




export function runTests() {
  regEnt_parsing_tests_01();
  // interpreter_tests_01();

}







function script_parsing_tests_01() {
  scriptParser.log(scriptParser.parse(
    `2 + 2`,
    "expression"
  )[0]);
}











function testParser({
  parser, str, startSym, isPartial, keepLastLexeme,
  expectedIsSuccess, expectedNextPos,
  testMsgPrefix, testKey, logParserOutput, logOnlyFailures,
}) {
  let [syntaxTree, lexArr] = parser.parse(
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




function regEnt_parsing_tests_01() {
  let testMsgPrefix = "regEnt_parsing_tests_01";

  console.log("Running " + testMsgPrefix + ":");

  let defaultParams = {
    parser: regEntParser, str: "", startSym: undefined, isPartial: undefined,
    keepLastLexeme: undefined,
    expectedIsSuccess: true, expectedNextPos: null,
    testMsgPrefix: testMsgPrefix, testKey: "",
    logParserOutput: true, logOnlyFailures: true,
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