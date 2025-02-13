
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
  exceptedIsSuccess, expectedNextPos,
  testMsgPrefix, testKey, logParserOutput,
}) {
  let [syntaxTree, lexArr, strPosArr] = parser.parse(
    str, startSym, isPartial, keepLastLexeme
  );

  expectedNextPos ??= lexArr.length;
  let isSuccessMsg = "SUCCESS";
  if (
    syntaxTree.isSuccess != exceptedIsSuccess ||
    syntaxTree.nextPos !== expectedNextPos
  ) {
    isSuccessMsg = "FAILURE";
  }

  console.log(
    testMsgPrefix + testKey + ": " + isSuccessMsg +
    (logParserOutput ? ":" : "")
  );
  if (logParserOutput) {
    parser.log(syntaxTree);
  }
}




function regEnt_parsing_tests_01() {
  let defaultParams = {
    parser: regEntParser, str: "", startSym: undefined, isPartial: undefined,
    keepLastLexeme: undefined,
    exceptedIsSuccess: true, expectedNextPos: null,
    testMsgPrefix: "regEnt_parsing_tests_01.", testKey: "",
    logParserOutput: true,
  }
  let params;


  params = Object.assign({}, defaultParams, {
    str: `12`,
    exceptedIsSuccess: true,
    testKey: "01"
  });
  testParser(params);

  params = Object.assign({}, defaultParams, {
    str: `12, 13`,
    exceptedIsSuccess: true,
    testKey: "02"
  });
  testParser(params);
  regEntParser.log(regEntParser.parse(
    `12`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12, 13`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `"Hello, world!"`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `,`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `@`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `@[`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12,`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12,\[`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `"Hello, world!",@[7],_,false`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `"Hello, world!",@[7],_,false,`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `"Hello, world!",@[7],_,false`, "literal-list"
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `"Hello, world!",@[7],_,false`, "literal"
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `"H`, "literal"
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12`, "literal", true
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12`, "literal", true, true
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12`, "literal+", true, true
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12`, "literal-list", true
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12,`, "literal-list", true
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12,@`, "literal-list", true
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12, "Hello, @[7]!"`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12, "Hello, @[7!"`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12, [13, [14,[15 ,  16]]]`
  )[0]);
  // Works.
  regEntParser.log(regEntParser.parse(
    `12, {"prop": [13]}, 13`
  )[0]);
  // Works.



}