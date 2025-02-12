
import {scriptParser} from "../DataParser.js";
import {ScriptInterpreter} from "../ScriptInterpreter.js";




export function runTests() {
  interpreter_tests_01();

}







function interpreter_tests_01() {
  scriptParser.log(scriptParser.parse(
    `2 + 2`,
    "expression"
  )[0]);
}
















function parsing_tests_01() {

  // regEntParser.log(regEntParser.parse(
  //   `12`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12, 13`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `"Hello, world!"`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `,`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `@`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `@[`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12,`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12,\[`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `"Hello, world!",@[7],_,false`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `"Hello, world!",@[7],_,false,`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `"Hello, world!",@[7],_,false`, "literal-list"
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `"Hello, world!",@[7],_,false`, "literal"
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `"H`, "literal"
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12`, "literal", true
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12`, "literal", true, true
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12`, "literal+", true, true
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12`, "literal-list", true
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12,`, "literal-list", true
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12,@`, "literal-list", true
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12, "Hello, @[7]!"`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12, "Hello, @[7!"`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12, [13, [14,[15 ,  16]]]`
  // )[0]);
  // // Works.
  // regEntParser.log(regEntParser.parse(
  //   `12, {"prop": [13]}, 13`
  // )[0]);
  // // Works.


  // scriptParser.log(scriptParser.parse(
  //   '(' + [
  //     '"Name":string',
  //     '"Parent class":@[classes]?',
  //   ].join(',')
  // )[0]);
  // // Works.
  scriptParser.log(scriptParser.parse(
    '(' + [
      '"Name":string',
      '"Parent class":@[\'classes\']?',
      // 'Member format?:(f::Function|t::Entity type)',
      '"Member type":string="r"',
      '"Member format":f?',
      '"Description":h?',
    ].join(',') +
    ')=>({' + [
      '"Class":@[\'classes\']',
      '"Name":@{1}',
      '"Parent class":@{2}',
      '"Member type":@{3}',
      '"Member format":@{4}',
      '"Description":@{5}',
    ].join(',') + '})'
  )[0]);
  // Works.



}