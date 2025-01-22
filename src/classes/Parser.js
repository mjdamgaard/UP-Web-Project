
const ERROR_ECHO_STR_LEN = 400;


const REGULAR_OR_QUANTIFIED_SYM_REGEXP =
  /^[^\?\*\+\{\}\[\]$]+[\?\*\+(\{(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))?\})]?$/;
const REGULAR_SYM_SUBSTR_REGEXP =
  /[^\?\*\+\{\}\[\]$]+/;
const ENDS_IN_QUANTIFIER_REGEXP =
  /[\?\*\+(\{(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))?\})]$/;
const QUANTIFIER_SUBSTR_REGEXP =
  /[\?\*\+(\{(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))?\})]/;
const SUB_PARSER_SYM_REGEXP =
  /^$$?[^$\[\]]+(\[[^\?\*\+\{\}\[\]$]+\])?$/;
const SUB_PARSER_KEY_REGEXP =
  /^[^$\[\]]+$/;
const SUB_PARSER_KEY_SUBSTR_REGEXP =
    /[^$\[\]]+/;
const GRAMMAR_SYM_REGEXP =
  /^[^\?\*\+\{\}\[\]$]+$/;

const NUMBER_SUBSTR_REGEXP =
  /0|[1-9][0-9]*/;










/// <summary>
/// This Parser class takes a associative list (a plain object) of production
/// rules. Its parse() method then checks if an input string can be validated,
/// and return the syntax tree if so.
/// </summary>
/// <param name="grammar">
/// A key-value object where the keys function as the nonterminal symbols of
/// the grammar, and the values are the production rules of the given
/// nonterminal symbol. (See e.g. https://en.wikipedia.org/wiki/Formal_grammar.)
/// 
/// The production rules contained in this parameter are more precisely each an
/// array of rules, where each rule is typically an array containing either
/// nonterminal "symbols" (keys of the grammar parameter), or RexExp objects/
/// literals, other Parser instances, or dyadic arrays containing a Parser
/// instance and a start symbol (startSym) parameter. These elements are then
/// to be parsed in sequence for the rule to succeed.
  // /// A production can also potentially be a string with a single nonterminal
  // /// symbol, instead of an array. The difference between a rule of just "Foo"
  // /// vs. ["Foo"] is subtle, yet it matters for performance and error reporting.
  // /// The difference lies in that fact that
  // *No, one can just make a different nonterminal symbol for that instead.
/// if a rule of the form ["Foo", ...]
/// fails, the partial list of all the successful elements of the rule are
/// recorded (if it is the longest one so far), and then used for all
/// subsequent rules, allowing them to skip parsing these parts again.
/// So if e.g. only "Foo" succeeds in ["Foo", "Bar"], and the next rule in line
/// is ["Foo", "Baz"], then the latter does not have to parse "Foo" all over
/// again. However, if the rule is simply the string "Foo" alone, then none of
/// its sub-successes will be carried over the the next rule in line.
///
/// When a rule succeeds, the rest of the rules of the same nonterminal symbol
/// is also tried afterwards. The rule that is finally chosen is then the one
/// among the successful rules with the greatest amount of elements (and thus
/// the most amount of sub-successes).
/// 
/// In terms of error reporting, the error thrown will contain a 'Expected %s,
/// but encountered %s' message for all failed rules among those that tied
/// with the most amount of sub-successes.
/// </param>
/// <param name="defaultSym">
/// The default (nonterminal) start symbol (key of the grammar object), with
/// which the parsing begins. If none is provided, the first key of the grammar
/// parameter is used instead. By calling Parser.parse(str, startSym) with a
/// second parameter, startSym, this start symbol is used instead. 
/// </param>
/// <returns>
/// On success, Parser.parse(str) returns a syntax tree consisting of nodes of
/// the form {key, i, children}, where key is the nonterminal "symbol" (string)
/// of the given nonterminal symbol, i is the index of the chosen successful
/// rule, and children is an array of the syntax trees of the all the elements
/// contained in the array of the rule.
/// 
/// On failure, Parser.parse(str) returns ParseError object containing.. TODO:
/// Finish this..
/// </returns>

export class Parser {
  constructor(grammar, defaultSym, lexemePatternArr, wsPattern, subParsers) {
    wsPattern ||= //;
    this.grammar = grammar;
    this.subParsers = subParsers ?? {};
    // defaultSym is the default (nonterminal) start symbol.
    this.defaultSym = defaultSym;
    // Initialize the lexer.
    this.lexer = new Lexer(lexemePatternArr, wsPattern);
    
    // preprocess all the regular expressions or patterns appearing in grammar.
    this.regularExpressions = {};
    this.#validateAndPreprocess();
  }

  #validateAndPreprocess() {
    Object.entries(grammar).forEach(([sym, {rules}]) => {
      // First validate the grammar symbol.
      if (!GRAMMAR_SYM_REGEXP.test(sym)) {
        throw "Parser: Grammar symbols cannot contain '?*+{}[]$' characters.";
      }
      // Then go through each rule symbol and process patterns and RegExps.
      let rulesNum = rules.length;
      for (let i = 0; i < rulesNum; i++) {
        let rule = rules[i];
        let ruleLen = rule.length;
        for (let j = 0; j < ruleLen; j++) {
          let ruleSym = rule[j];

          // If a symbol in a rule is a pattern beginning and ending with "/",
          // construct and store a corresponding RegExp instance in
          // this.regularExpressions.
          if (typeof ruleSym === "string") {
            if (ruleSym.at(0) === "/" && ruleSym.at(-1) === "/") {
              this.regularExpressions[ruleSym] = new RegExp(ruleSym);
            }

            // If the symbol is a sub-parser symbol, we also validate it here.
            else if (ruleSym.at(0) === "$") {
              if (!SUB_PARSER_SYM_REGEXP.test(sym)) {
                throw `Parser: Invalid sub-parser symbol: "${sym}"`;
              }
            }

            // Else validate it as either a regular symbol or a quantified
            // symbol.
            else {
              if (!REGULAR_OR_QUANTIFIED_SYM_REGEXP.test(sym)) {
                throw `Parser: Invalid symbol: "${sym}"`;
              }
            }
          }

          // If a symbol an RegExp on the other hand replace it with the
          // corresponding pattern in grammar (as a side-effect transmuting
          // this input in the constructor), and store the RegExp in
          // this.regularExpressions.
          else if (ruleSym instanceof RegExp) {
            let newSym = ruleSym.source;
            rule[j] = newSym;
            this.regularExpressions[newSym] = ruleSym;
          }
        }
      }
    });
  }

  addSubParser(key, parser) {
    if (!SUB_PARSER_KEY_REGEXP.test(key)) {
      throw "Parser.addSubParser(): key cannot contain '[', ']', or '$'.";
    }
    this.subParsers[key] = parser;
  }



  lexParseAndProcess(str, startSym, isPartial = false) {
    // Lex the input string.
    let [syntaxTree, callbackArr] = this.lexAndParseAll (
      str, startSym, isPartial
    );

    // Then process the syntax tree by calling all callbacks (in order of
    // children before parent, and first sibling through last sibling).
    callbackArr.forEach(([callback, node]) => {
      callback(node);
    });

    // Return the now processed syntax tree.
    return syntaxTree;
  }

  lexAndParseAll(str, startSym, isPartial = false) {
    // Lex the input string.
    let lexArr, strPosArr;
    try {
      [lexArr, strPosArr] = this.lexer.lex(str, isPartial);
    } catch (error) {
      if (error instanceof LexError) {
        let syntaxTree = {success: false, error: error.msq};
        return [syntaxTree, []];
      }
      // Else throw error;
      else this.lexer.lex(str, isPartial); // Better for debugging.
    }

    // Then parse the resulting lexeme array.
    return parseAll(lexArr, pos, startSym, str, strPosArr);
  }


  parseAll(lexArr, pos = 0, startSym, str, strPosArr) {
    startSym ??= this.defaultSym;

    // Parse the syntax tree, calling a helper method.
    let [syntaxTree, callbackArr, endPos] =
      this.parse(lexArr, pos, startSym, str, strPosArr);


    // If only a part of the string was parsed, return the same syntax tree
    // but unsuccessful, and with an appropriate error set.
    if (endPos < lexArr.length + 1) {
      syntaxTree = {
        ...syntaxTree,
        success: false,
        error: "Parser.parseAll(): Only part of the input string was parsed." +
          " The parsing ended right before:\n" +
          str.substring(strPosArr[endPos + 1]).substring(0, ERROR_ECHO_STR_LEN),
      };
      return [syntaxTree, [], endPos];
    }

    // On success ... Finally call any and all of generated callbacks
    // (children's callbacks are called, in order from first to last, before
    // the parent's). 

    return [syntaxTree, callbackArr];
  }


  parse(lexArr, pos, nonterminalSymbol, str, strPosArr) {
    nonterminalSymbol ??= this.defaultSym;

    // Initialize the array of recorded sub-successes, and the record index of
    // successful symbols. Also initialize the reported error on failure, and
    // a callback array for post-processing of the syntax tree. 
    var recordedSyntaxTrees = [];
    var recordIndex = -1;
    var error = [[], -1, -1]; // [expectedSymbols, priority, endPos].
    var callbackArr = [];

    // Get and parse the rules of the nonterminal symbol, nonterminalSymbol.
    // Also get the test and callback functions for afterwards.
    var successfulRuleIndex = null;
    let {rules, test, callback} = this.grammar[nonterminalSymbol];
    rules.some((rule, ruleInd) => {});

    // ...

    // Now that either one rule has succeeded, or all has failed, handle first
    // the success case.
    if (successfulRuleIndex !== null) {
      // Construct the almost successful syntax tree.
      let syntaxTree = {
        sym: nonterminalSymbol,
        ruleInd: successfulRuleIndex,
        children: recordedSyntaxTrees[successfulRuleIndex],
      }

      // But before the nonterminal symbol succeeds fully, we first need to run
      // the test() function, if one is supplied.
      if (test) {
        let [testIsSuccessful, testError] = test(syntaxTree);
        syntaxTree.success = testIsSuccessful;
        syntaxTree.error = testError;
      }

      // If any test succeeded, and the nonterminal symbol is now successful,
      // append the callback() function to callbackArr, if one is provided,
      // together with syntaxTree to use as its input. Then return the
      // syntaxTree, the callbackArr, and pos as the outgoing endPos.
      if (syntaxTree.success) {
        if (callback) {
          callbackArr.push([callback, syntaxTree]);
        }
        return [syntaxTree, callbackArr, pos];
      }
      // Else return the syntaxTree, where syntaxTree error is determined by
      // test().
      else {
        return [syntaxTree, [], pos];
      }
    }

    // If on the other hand all rules failed, we return an syntax tree with
    // an appropriate error, given how far we got.
    else {
      // Construct the appropriate error.
      let [expectedSymbols, , endPos] = error;
      let strPos = strPosArr[endPos];
      msg = `Parsing error after:
        ${str.substring(Math.max(strPos - ERROR_ECHO_STR_LEN, 0), strPos)}
        ----
        Expected ${expectedSymbols.join(" or ")}, but got:
        ${lexArr[endPos]}.
      `;

      // Construct and return the failed syntax tree, along with endPos
      let syntaxTree = {
        sym: nonterminalSymbol,
        success: false,
        error: msg,
        ruleInd: recordIndex,
        children: recordedSyntaxTrees[recordIndex],
      }
      return [syntaxTree, [], endPos];
    }
  }



  #parseRules(lexArr, pos, rules) {
    for (let i = 0; i < rulesNum; i++) {
      let rule = rules[i];
      let ruleLen = rule.length;
      for (let j = 0; j < ruleLen; j++) {
        let ruleSym = rule[j];
        // ...
      }
    }

    // ----

    // Parse as many symbols of the rule as possible, and if the rule succeeds
    // completely, set ruleSuccess as true.
    var ruleSuccess = false;
    rule.some((sym, symInd) => {
      let ruleLen = rule.length;

      // Parse as many symbols of the rule as possible, and if the rule succeeds
      // completely, set ruleSuccess as true.
      var ruleSuccess = false;
      rule.some((sym, symInd) => {
        // Skip past the symbols that have already been parsed, and fail the
        // rule if a symbol doesn't match the one that has already been parsed. 
        if (symInd <= recordIndex) {
          if (sym === recordedSyntaxTrees[symInd].sym) {
            return false; // Continue the some() iteration.
          } else {
            return true; // Break the some() iteration.
          }
        }

        this.#parseRuleSymbol(lexArr, pos, sym);
      });
    });


    // Now that the rule has been parsed either successfully or not, if it
    // was a success, record the rule's index, and break out of the iteration
    // over the rules, or else we continue iteration over the rules.
    if (ruleSuccess) {
      if (ruleSuccess === EOS) {
        successfulRuleIndex = ruleInd; // ...
      }
      successfulRuleIndex = ruleInd;
      return true; // Break the some() iteration (over the rules).
    }
    else {
      return false; // Continue the some() iteration (over the rules).
    }
  }



  #parseRuleSymbol(lexArr, pos, sym) {
    let nextLexeme = lexArr[pos];
    let syntaxTree;

    // If sym is the reserved empty string symbol, "", then succeed
    // the symbol, but without increasing nextPos.
    if (sym === "") {
      syntaxTree = {
        sym: sym, success: true,
        pos: pos, nextPos: pos,
      };
    }

    // Else if EOS is reached, which is located at the end of the lexArr if
    // and only if isPartial is true, fail the rule with an "EOS" error,
    else if (nextLexeme === EOS) {
      syntaxTree = {
        sym: sym, success: false, error: "EOS",
        pos: pos, nextPos: pos,
        // Note that on failure, nextPos is supposed to be where the error
        // occurred. 
      };
    }

    // Else if sym is a pattern, simply try to parse the next lexeme as that.
    else if (sym.at(0) === "/" && sym.at(-1) === "/") {
      if (!nextLexeme) {
        syntaxTree = {
          sym: sym, success: false,
          pos: pos, nextPos: pos,
          // (Note that on failure, nextPos is supposed to be where the error
          // occurred.)
        };
      }
      else {
        let regExp = this.regularExpressions[sym];
        let match = (nextLexeme.match(regExp) ?? [])[0];
        if (match === nextLexeme) {
          syntaxTree = {
            sym: sym, success: true, children: [match],
            pos: pos, nextPos: pos + 1,
          };
        }
        else {
          syntaxTree = {
            sym: sym, success: false,
            pos: pos, nextPos: pos,
          };
        }
      }
    }

    // Else if sym is on the form '$$?<ParserKey>(\[<StartSym>\])?',
    // continue parsing with the given sub-parser instead, either with its
    // default start symbol, or another start symbol if '\[<StartSym>\]' is
    // there. Also, if there are two leading '$'s instead of one, parse only
    // a single compound (possibly big) lexeme with the sub-parser, using that
    // parser's own lexer to "sub-lex" this compound lexeme.
    else if (sym.at(0) === "$") {
      let parserKey = sym.match(SUB_PARSER_KEY_SUBSTR_REGEXP)[0];
      let subParser = this.subParsers[parserKey];
      let startSym = ( sym.match(/\[[^\]]+\]/) ?? ["[]"] )[0].slice(1, -1);
      let subLex = (sym.at(1) === "$");

      // If subLex is true, parse only a single (possibly big) lexeme, and
      // lex it first.
      if (subLex) {
        if (!nextLexeme) {
          syntaxTree = {
            sym: sym, success: false,
            pos: pos, nextPos: pos,
          };
        }
        else {
          syntaxTree = subParser.lexAndParseAll(nextLexeme, startSym, false);
        }
      }
      // Else let the parser parse as many lexemes as it can, using the
      // same lexeme array. 
      else {
        syntaxTree = subParser.parse(lexArr, pos, startSym);
      }
    }

    // Else if sym ends in either '?', '*', '+', '{n}' or '{n,m}', parse an
    // appropriate number of the same symbol.
    else if (ENDS_IN_QUANTIFIER_REGEXP.test(sym)) {
      let subSym = sym.match(REGULAR_SYM_SUBSTR_REGEXP)[0];
      let quantifier = sym.match(QUANTIFIER_SUBSTR_REGEXP)[0];

      // Parse n and m from quantifier := "{n(,m)?}", and then set max and
      // min based on those, and on the quantifier in general. 
      let [n, m] = (quantifier.match(NUMBER_SUBSTR_REGEXP) ?? []).map(
        val => parseInt(val)
      );
      let max = m ?? n ?? (quantifier === "?") ? 1 : null;
      let min = n ?? (quantifier === "+") ? 1 : 0;

      // Then parse as many instances of sybSym as possible in a row,
      // storing the each resulting syntax tree in an array, children.
      let children = [];
      let nextPos = pos;
      for (let i = 0; true; i++) {
        // Break if max is reached, and construct a successful syntax tree.
        if (i + 1 > max) {
          syntaxTree = {
            sym: sym, success: true, children: children,
            pos: pos, nextPos: nextPos,
          };
          break;
        }

        // Else parse a new child.
        let childSyntaxTree = this.parse(lexArr, pos, subSym);
        if (childSyntaxTree.success) {
          // Add child syntax tree to children and increase pos.
          children.push(childSyntaxTree);
          nextPos = childSyntaxTree.nextPos;
        }
        else {
          // If and when failing, mark a success or failure depending on
          // whether min was reached or not. Note that nextPos is at this
          // point the next position after the last successful child, not the
          // the current failed one. 
          if (i + 1 >= min) {
            syntaxTree = {
              sym: sym, success: true, children: children,
              pos: pos, nextPos: nextPos,
            };
            break;
          }
          else {
            syntaxTree = {
              sym: sym, success: false, children: children,
              pos: pos, nextPos: nextPos,
              // (Note that on failure, nextPos is supposed to be where the
              // error occurred.)
            };
            break;
          }
        }
      }
    }

    // Else treat sym as a non-terminal symbol, and make a recursive call to
    // parse() with nonterminalSymbol = sym.
    else {
      syntaxTree = this.parse(lexArr, pos, sym);
    }
  }
}









export class Lexer {
  constructor(lexemePatternArr, wsPattern) {
    // Whitespace RegEx.
    this.wsRegEx = (wsPattern instanceof RegExp) ? wsPattern :
      wsPattern ? new RegExp(wsPattern) :
      /[^a[^a]]/;
    // RegEx of all lexemes and whitespace. 
    this.lexemeOrWSRegEx = new RegExp(
      wsRegEx.source + "|" +
      lexemePatternArr.map(
        pattern => (pattern instanceof RegExp) ? pattern : new RegExp(pattern)
      ).join("|")
    );
    // Lexer RegEx which also includes an extra final match that
    // greedily matches the rest of the string on failure of the
    // lexemeOrWSRegEx. 
    this.lexerRegEx = new RegExp(lexemeOrWSRegEx.source + "|" + "[^$]+", "g");
  }


  lex(str, isPartial = false) {
    // Get the initial lexeme array still with whitespace and the potential last
    // failed string in it, then test and throw if the last match is that last
    // failure string.
    let unfilteredLexArr = str.match(this.lexerRegEx);
    if (isPartial) {
      // If str is only a partial string, remove the last lexeme, and replace
      // it the end-of-string constant.
      unfilteredLexArr[unfilteredLexArr - 1] = EOS;
    }  else {
      // Else check that the last lexeme isn't the greedy "[^$]+" one.
      let lastMatch = unfilteredLexArr.at(-1);
      if (!this.lexemeOrWSRegEx.test(lastMatch)) {
        let lastIndexOfInvalidLexeme = lastMatch.search(this.wsRegEx) - 1;
        throw new LexError(
          `Lexer error at:
          ${lastMatch.substring(0, ERROR_ECHO_STR_LEN)}
          ----
          Invalid lexeme:
          ${lastMatch.substring(0, lastIndexOfInvalidLexeme + 1)}
          `
        );
      }
    }

    // Construct an array of the positions in str of each of the element in
    // unfilteredLexArr.
    var strPos = 0;
    let unfilteredStrPosArr = unfilteredLexArr.map(elem => {
      let ret = strPos;
      strPos += elem.length;
      return ret;
    })
  
    // If successful, filter out the whitespace from the unfilteredLexArr
    // and the corresponding positions in strPosArr, and return these two
    // filtered arrays
    let lexArr, strPosArr;
    if (wsPattern) {
      lexArr = unfilteredLexArr.filter((val, ind) => {
        let isWhitespace = wsRegEx.test(val);
        if (isWhitespace) {
          unfilteredStrPosArr[ind] = null;
        }
        return !isWhitespace;
      });
      strPosArr = unfilteredStrPosArr.filter(val => val !== null);
    }
    else {
      lexArr = unfilteredLexArr;
      strPosArr = unfilteredStrPosArr;
    }

    return [lexArr, strPosArr];
  }
}


class LexError {
  constructor(msg) {
    this.msg = msg;
  }
}

const EOS = {};
