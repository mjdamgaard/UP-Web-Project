


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
  constructor(grammar, defaultSym, lexemePatternArr, wsPattern) {
    this.grammar = grammar;
    // defaultSym is the default (nonterminal) start symbol.
    this.defaultSym = defaultSym;
    // Initialize the lexer.
    this.lexer = new Lexer(lexemePatternArr, wsPattern);
  }


  lexParseAndProcess(str, startSym) {
    // Lex the input string.
    let [syntaxTree, callbackArr] = this.lexAndParseAll(str, startSym);

    // Then process the syntax tree by calling all callbacks (in order of
    // children before parent, and first sibling through last sibling).
    callbackArr.forEach(([callback, node]) => {
      callback(node);
    });

    // Return the now processed syntax tree.
    return syntaxTree;
  }

  lexAndParseAll(str, startSym) {
    // Lex the input string.
    try {
      let [lexArr, strPosArr] = this.lexer.lex(str);
    } catch (error) {
      if (error instanceof LexError) {
        let syntaxTree = {success: false, error: error.msq};
        return [syntaxTree, []];
      }
      // else throw error;
      else this.lexer.lex(str); // Better for debugging.
    }

    // Then parse the resulting lexeme array.
    return parseAll(lexArr, pos, startSym, str, strPosArr);
  }


  parseAll(lexArr, pos = 0, startSym, str, strPosArr) {
    startSym ??= this.defaultSym;

    // Parse the syntax tree, calling a helper method.
    let [syntaxTree, callbackArr, endPos] =
      this.parse(lexArr, pos, startSym, str, strPosArr);


    // If ...
    if (endPos < "TODO...") {
      "...";
    }

    // On success ... Finally call any and all of generated callbacks
    // (children's callbacks are called, in order from first to last, before
    // the parent's). 

    return [syntaxTree, callbackArr];
  }


  parse(lexArr, pos, nonterminalSymbol, str, strPosArr) {
    nonterminalSymbol ??= this.defaultSym;

    // Initialize the array of recorded sub-successes, and an array of the
    // indexes of record holders, and the record index of successful symbols.
    // Also initialize an array of the reported errors, and callback array for
    // post-processing of the syntax tree. 
    var recordedSyntaxTrees = [];
    var recordHolders = [];
    var recordIndex = -1;
    var errors = [];
    var callbackArr = [];

    // Get and parse the rules of the nonterminal symbol, nonterminalSymbol.
    // Also get the test and callback functions for afterwards.
    var successfulRuleIndex = null;
    let {rules, test, callback} = this.grammar[nonterminalSymbol];
    rules.some((rule, ruleInd) => {
      let ruleLen = rule.length;
      let ruleErrors = [];

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

        // If and when these symbols have been successfully skipped, try
        // parsing a new symbol on each iteration. In all these branches,
        // we also make sure to add any new successful parsed syntax tree to
        // recordedSyntaxTrees, and also to increase pos.
        var symSuccess = false;

        // If sym is a Regex, we simply try to parse the next lexeme as that.
        if (sym instanceof RegExp) {
          let nextLexeme = lexArr[pos];
          if (!nextLexeme) {
            symSuccess = false;
          }
          else {
            let match = nextLexeme.match(sym)[0];
            if (match === nextLexeme) {
              // Record the new successful symbol, and increase pos.
              recordedSyntaxTrees.push({
                sym: sym, success: true, children: [match],
              });
              pos++;
              symSuccess = true;
            }
            else {
              // Record terminal symbol error on failure.
              ruleErrors.push(
                // Errors here are of the form [priority, expects, pos].
                [0, sym.toString(), pos]
              );
              symSuccess = false;
            }
          }
        }

        // Else if sym is the reserved empty string symbol, "empty", then
        // succeed the symbol, but without increasing pos.
        else if (sym === "empty") {
          symSuccess = true;
        }

        // Else if sym is a string, treat it as a nonterminalSymbol, and make
        // a recursive call to parse() with nonterminalSymbol = sym.
        else if (typeof sym === "string") {
          let [syntaxTree, childCallbackArr, endPos] =
            this.parse(lexArr, pos, sym, str, strPosArr);
          symSuccess = syntaxTree.success;
          if (symSuccess) {
            // Record the new successful symbol, append the childCallbackArr
            // to callbackArr, and increase pos.
            recordedSyntaxTrees.push(syntaxTree);
            callbackArr = callbackArr.concat(childCallbackArr);
            pos = endPos + 1;
          }
          else {
            // Record contained nonterminal symbol error on failure.
            ruleErrors.push(syntaxTree.error);
          } 
        }

        // Else if sym is an array, treat it as sym := [subSym, qualifier],
        // where qualifier is either '?', '*', '+', '{n}' or '{n,m}', and
        // subSym is the symbol to parse one or several, or zero, times. The
        // qualifier symbols means the same as the do for regular expressions.
        else if (Array.isArray(sym)) {
          let [subSym, qualifier] = sym;

          // First parse as many instances of sybSym as possible in a row,
          // storing the each resulting syntax tree in an array, children, and
          // storing all the child callback arrays as well. Also record the
          // initial value of pos in order to revert to that on failure.
          let children = [];
          let childCallbackArrays = [];
          let initPos = pos;
          var lastError;
          for (let i = 0; true; i++) {
            let [syntaxTree, childCallbackArr, endPos] =
              this.parse(lexArr, pos, subSym, str, strPosArr);
            if (syntaxTree.success) {
              // Add child syntax tree to children and childCallbackArr to
              // childCallbackArrays, and increase pos.
              children.push(syntaxTree);
              childCallbackArrays.push(childCallbackArr);
              pos = endPos + 1;

              // Break already on the first success if '?' is the qualifier. 
              if (qualifier === "?") {
                break;
              }
            }
            else {
              // When finally failing, push the last encountered error to
              // ruleError, only for the sake of error reporting.
              ruleErrors.push(syntaxTree.error);
              break;
            }
          }

          // Once this is done, we can branch out and record the a success
          // depending on the qualifier.
          let len = children.length;
          if (qualifier === "?") {
              symSuccess = true;
          }
          else if (qualifier === "*") {
            symSuccess = true;
          }
          else if (qualifier === "+") {
            symSuccess = true;
          }
          else if (qualifier) {
            symSuccess = true;
          }
          else if (/^\{[1-9][0-9]*(,[1-9][0-9]*)?\}$/.test(qualifier)) {
            // Parse n and m from qualifier := "{n(,m)?}"
            let [n, m] = qualifier.match(/[1-9][0-9]*/g).map(
              val => parseInt(val)
            );
            if (m === undefined) {
              symSuccess = len === n;
            } else {
              symSuccess = n <= len && len <= m;
            }
          }
          else {
            throw (
              `Parser: unrecognized qualifier: "${qualifier}"` 
            );
          }

          // On a success, construct and add the syntax tree with the children
          // array as the children property, and add the child callback arrays
          // to callbackArr. Also increase indexRecord.
          if (symSuccess) {
            recordedSyntaxTrees.push({
              sym: sym, success: true, children: children,
            });
            callbackArr = callbackArr.concat(...childCallbackArrays);
          }
          // Else record error and revert pos to its initial value.
          else {
            pos = initPos;
          }
        }

        // This only leaves the option of sym being of the form sym :=
        // {parser, startSym}, where parser might be another Parser instance
        // (or an object with a similar parse() method).
        else if (typeof sym === "object") {
          let {parser, startSym, subLex} = sym;

          // If subLex is true, parse only a single (possibly big) lexeme, and
          // lex it first.
          if (subLex) {
            let nextLexeme = lexArr[pos];
            if (!nextLexeme) {
              symSuccess = false;
            }
            else {
              let [syntaxTree, childCallbackArr] =
                parser.lexAndParseAll(lexArr, pos, startSym, str, strPosArr);
              symSuccess = syntaxTree.success;
              if (symSuccess) {
                // Record the new successful symbol, append the childCallbackArr
                // to callbackArr, and increase pos.
                recordedSyntaxTrees.push(syntaxTree);
                callbackArr = callbackArr.concat(childCallbackArr);
                pos++;
              }
              else {
                ruleErrors.push(syntaxTree.error)
              }
            }
          }
          // Else let the parser parse as many lexemes as it can, using the
          // same lexeme array. 
          else {
            let [syntaxTree, childCallbackArr, endPos] =
              parser.parse(lexArr, pos, startSym, str, strPosArr);
            symSuccess = syntaxTree.success;
            if (symSuccess) {
              // Record the new successful symbol, append the childCallbackArr
              // to callbackArr, and increase pos.
              recordedSyntaxTrees.push(syntaxTree);
              callbackArr = callbackArr.concat(childCallbackArr);
              pos = endPos + 1;
            }
            else {
              ruleErrors.push(syntaxTree.error)
            }
          }
        }
        else {
          throw (
            `Parser: invalid symbol: "${JSON.stringify(sym)}"` 
          );
        }


        // After all these branches, we do some final handling in the case of
        // a success, and some handling in the case of a failure.
        if (symSuccess) {
          // On success, we check if sym was the last symbol of the rule, and
          // if so, we set ruleSuccess to true, and break out of the some()
          // iteration.
          if (symInd === ruleLen - 1) {
            ruleSuccess = true;
            return true; // Break the some() iteration.
          }
          return false; // Continue the some() iteration.
        }
        else {
          // On failure, we either add the rule's index to recordHolders if
          // symInd ties with the previous recordIndex, or set recordHolders
          // to just the rule's index if symInd is greater than that. Along the
          // rule's index, we also add the expected next sym for the sake of
          // error reporting. 
          if (symInd === recordIndex) {
            recordHolders.push({i: ruleInd, expects: sym});
          } else {
            recordHolders = [{i: ruleInd, expects: sym}];
          }

          // Then we set recordIndex to symInd regardless, and break the
          // iteration.
          recordIndex = symInd;
          return true; // Break the some() iteration.
        }
      });

      // Now that the rule has been parsed either successfully or not, if it
      // was a success, record the rule's index, and break out of the iteration
      // over the rules.
      if (ruleSuccess) {
        successfulRuleIndex = ruleInd;
        return true; // Break the some() iteration.
      }
      // And if it was a failure, push ruleErrors to the errors array, and
      // continue the iteration over the rules.
      else {
        errors.push(ruleErrors);
        return false; // Continue the some() iteration.
      }
    });

    // Now that either one rule has succeeded, or all has failed, handle first
    // the success case.
    if (successfulRuleIndex !== null) {
      // Construct the almost successful syntax tree.
      let syntaxTree = {
        sym: nonterminalSymbol,
        children: recordedSyntaxTrees[successfulRuleIndex],
      }

      // But before the nonterminal symbol succeeds fully, we first need to run
      // the test() function, if one is supplied.
      if (test) {
        let [success, error] = test(syntaxTree);
        syntaxTree.success = success;
        syntaxTree.error = error;
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
      // Else just return the syntaxTree, where syntaxTree error is determined
      // test().
      else {
        return [syntaxTree];
      }
    }

    // If on the other hand all rules failed, we construct and appropriate
    // error message, and return the unsuccessful syntaxTree. 
    else {
      // First we go through all the recordHolders, and pick out the error with
      // the highest priority for each.
      let highestPriorityErrors = recordHolders.map(({i, expects}) => {
        let ruleErrors = errors[i];
        let defaultError = [0, expects, pos];
        let highestPriorityRuleError = ruleErrors.reduce(
          (acc, error) => {
            return (error[0] > acc[0]) ? error : acc;
          },
          defaultError
        );
      });
    }

  }
}





export class Lexer {
  constructor(lexemePatternArr, wsPattern) {
    // Whitespace RegEx.
    this.wsRegEx = (wsPattern instanceof RegExp) ? wsPattern :
      new RegExp(wsPattern);
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


  lex(str) {
    // Get the initial lexeme array still with whitespace and the potential last
    // failed string in it, then test and throw if the last match is that last
    // failure string.
    let unfilteredLexArr = str.match(this.lexerRegEx);
    let lastMatch = unfilteredLexArr.at(-1);
    if (!this.lexemeOrWSRegEx.test(lastMatch)) {
      let lastIndexOfInvalidLexeme = lastMatch.search(this.wsRegEx) - 1;
      throw new LexError(
        `Lexer error at:
        ${lastMatch.substring(0, 800)}
        ----
        Invalid lexeme:
        ${lastMatch.substring(0, lastIndexOfInvalidLexeme + 1)}
        `
      );
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
    let lexArr = unfilteredLexArr.filter((val, ind) => {
      let isWhitespace = wsRegEx.test(val);
      if (isWhitespace) {
        unfilteredStrPosArr[ind] = null;
      }
      return !isWhitespace;
    });
    let strPosArr = unfilteredStrPosArr.filter(val => val !== null);
    return [lexArr, strPosArr];
  }
}


class LexError {
  constructor(msg) {
    this.msg = msg;
  }
}