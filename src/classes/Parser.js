


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
/// <param name="startSym">
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
  constructor(grammar, startSym, lexemePatternArr, wsPattern) {
    this.grammar = grammar;
    // startSym is the default (nonterminal) start symbol.
    this.startSym = startSym;
    // Initialize the lexer.
    this.lexer = new Lexer(lexemePatternArr, wsPattern);
  }

  parse(str, startSym) {
    let ntSym = startSym ?? this.startSym;

    // Lex the input string.
    let [lexArr, strPosArr] = this.lexer.lex(str);

    // Parse the syntax tree, calling a helper method.
    let [syntaxTree, endPos, callbackArr] = this.parseNonterminalSymbol(
      ntSym, lexArr, 0, str, strPosArr
    );


    // If ...
    if (endPos < "TODO...") {
      "...";
    }

    // On success ... Finally call any and all of generated callbacks
    // (children's callbacks are called, in order from first to last, before
    // the parent's). 
    callbackArr.forEach(callback => {
      callback();
    });
  }

  parseNonterminalSymbol(ntSym, lexArr, pos, str, strPosArr) {
    // Initialize the array of recorded sub-successes, and an array of the
    // indexes of record holders, and the record successful index. Also
    // initialize a callback array. 
    var recordedSyntaxTrees = [];
    var recordHolders = [];
    var recordIndex = -1;

    // Get and parse the rules of the nonterminal symbol, ntSym. Also get the
    // test and callback functions for afterwards.
    let {rules, test, callback} = this.grammar[ntSym];
    rules.forEach((rule, ruleInd) => {
      // Parse as many symbols of the rule as possible.
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
        // parsing a new symbol on each iteration.
        var success = false;
        if (sym instanceof RegExp) {
          let nextLexeme = lexArr[pos];
          if (!nextLexeme) {
            success = false;
          }
          let match = nextLexeme.match(sym)[0];
          if (match === nextLexeme) {
            // Record the new successful symbol, and increase pos and
            // recordIndex.
            recordedSyntaxTrees.push({sym: sym, success: true});
            recordIndex++;
            pos++;
            success = true;
          }
          else {
            success = false;
          }
        }
        else if (typeof sym === "string") {
          let [syntaxTree, endPos, callbackArr] = this.parseNonterminalSymbol(
            sym, lexArr, pos, str, strPosArr
          );
          if (syntaxTree.success) {
            // Record the new successful symbol, and increase pos and
            // recordIndex.
            recordedSyntaxTrees.push({
              sym: sym, success: true, tree: syntaxTree,
            });
            recordIndex++;
            pos = endPos + 1;
            success = true;
          }
        }

        // Handle a successfully parsed symbol.
        if (success) {
          // If symInd === recordIndex + 1, erase any previous record holders,
          // as they are outmatched by this rule.
          if (symInd === recordIndex + 1) {
            recordHolders = [];
          }
          // ...
          return false; // Continue the some() iteration.
        }
        // Handle a failed symbol.
        else {
          // ...
          if (symInd === recordIndex) {
            recordHolders.push({i: ruleInd, expects: sym});
          } else {
            recordHolders = [{i: ruleInd, expects: sym}];
          }
          // ...
          return true; // Break the some() iteration.
        }
      });
    });

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
      throw (
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