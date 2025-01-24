
const ERROR_ECHO_STR_LEN = 400;


const NONTERMINAL_SYM_REGEXP =
  /^[^\/\?\*\+\{\}\[\]$!]+$/;
const NONTERMINAL_SYM_SUBSTR_REGEXP =
   /[^\/\?\*\+\{\}\[\]$!]+/;
const SUB_PARSER_SYM_REGEXP =
  /^$$?[^\/\?\*\+\{\}\[\]$!]+(\[[^\/\?\*\+\{\}\[\]$!]+\])?$/;
const TRAILING_QUANTIFIER_SUBSTR_REGEXP =
  /[\?\*\+(\{(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))?\})]$/;
const SUB_PARSER_KEY_REGEXP = NONTERMINAL_SYM_REGEXP;
const SUB_PARSER_KEY_SUBSTR_REGEXP = NONTERMINAL_SYM_SUBSTR_REGEXP;
const SQUARE_BRACKET_SUBSTR_REGEXP =
  /\[[^\]]+\]/;

const NUMBER_SUBSTR_REGEXP =
  /0|[1-9][0-9]*/;


export const EOS_ERROR = "End of partial string";







// <summary>
// A Parser class to lex and parse strings with a given grammar, and a given
// array of lexeme patterns plus an optional whitespace pattern, which together
// defines how the string is lexed before the parsing itself.
//
// The main method of this class, used for lexing and parsing (and potentially
// post-processing) a string, is Parser.parseAndProcess().
// 
// The constructor can also take key-value object of other Parser instances,
// which can be used in the grammar rules. (And the Parser.addSubParser()
// method even makes it possible to have parsers that can recursively call each
// other.)
// </summary>
// 
// <param name="grammar">
// A key-value object where the keys function as the nonterminal symbols of
// the grammar, and the values contain the production rules of the given
// nonterminal symbol. (See e.g. https://en.wikipedia.org/wiki/Formal_grammar.)
// 
// The values of the grammar object has to be of the form
// {rules, test?, processes?}, where rules first of all is an array of rules,
// which are each an array of symbols (terminal or nonterminal) symbols to try
// parsing.
// The the optional test() function is a final test in the case of a
// successfully parsed nonterminal symbol, which has the power to fail the
// symbol even if otherwise successful. It does so by returning
// [isSuccess, error?] when called on the resulting syntax tree object, i.e.
// test(syntaxTree) -> [isSuccess, error?].
// The optional process() function is a function that is called at the end
// of a call to the Parser class's main method, parseAndProcess(), regardless
// of whether the whole parsing was successful or not. It can be used in
// particular to restructure the syntax tree before further handling. For
// example, when parsing a list via a rule of the form
// 'List := Elem , List | Elem', the resulting syntax tree will initially be
// of the form List(elem1, ',', List(elem2, ',', List(...(List(elemN))))),
// which one might want to transform into simply List(elem1, elem2, ..., elemN)
// before further handling.
// 
// The symbols inside each rule of the grammar can either be another (or the
// same) nonterminal symbol, or a RegExp pattern beginning and ending in '/',
// with *no* '^' or '$' at the two ends, which succeeds a lexeme if and only if
// the lexeme is fully matched by the pattern. A RegExp instance is also
// accepted instead of a pattern, again with neither '^' nor '$' at the ends.
// The rule symbols can also be of the form
// '$$?<Sub-parser key>(\[Nonterminal symbol\])?', where one or two '$'s
// determines whether the called sub-parser will parse using the same lexeme
// array as its parent is currently parsing, or if it will parse a single
// (compound, possibly big) lexeme as its input string. And the optional
// nonterminal symbol makes it possible to parse another nonterminal symbol
// instead of the sub-parser's default one.
// Furthermore, any rule symbol can also be followed by a RegExp quantifier,
// i.e. '?', '*', '+', or '{<n>,<m>}', which parses a variable number of the
// preceding nonterminal symbol.
// And lastly, any of these rule symbols, quantified or not, can also be
// followed by a '!' at the very end, which tells the parser to parse the
// symbol even if a different symbol has already been successfully parsed at
// the same array index of a previous rule. Otherwise the parser will
// automatically fail a rule symbol if a different symbol has been successfully
// parsed at that same array index.
// 
// The first rule to succeed for a nonterminal symbol will short circuit it,
// such that the subsequent rules will not be tried.
// </param>
// 
// <param name="defaultSym">
// The default (nonterminal) start symbol for the parser.
// </param>

// <param name="lexemePatternArr">
// An array of lexeme pattern, which are tried in order from the first to the
// last when constructing the lexeme array.
// </param>

// <param name="wsPattern">
// A pattern of what the parser considers "whitespace" (might also include
// comments) when lexing the string. This whitespace pattern will be tried
// first thing whenever a new lexeme is lexed.
// </param>

// <param name="subParsers">
// A plain object containing so-called sub-parsers, which can be used in the
// rules of the grammar (via rule symbols that starts with '$' or '$$',
// followed by the sub-parser's key). The keys of this plain object is the keys
// of the given sub-parsers, by which they are referenced in the rule.
// (If wanting to call sub-parsers recursively, use the Parser.addSubParser()
// method instead.) 
// </param>
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
      // First validate the nonterminal symbol.
      if (!NONTERMINAL_SYM_REGEXP.test(sym)) {
        throw `Parser: Nonterminal symbols cannot any of the special \
          characters '/?*+{}[]$!'. Received "${sym}".`;
      }
      // Then go through each rule symbol and process patterns and RegExps.
      let rulesNum = rules.length;
      for (let i = 0; i < rulesNum; i++) {
        let rule = rules[i];
        let ruleLen = rule.length;
        for (let j = 0; j < ruleLen; j++) {
          let ruleSym = rule[j];

          // If a symbol is an instance of RegExp replace it with the
          // corresponding pattern in grammar (as a side-effect transmuting
          // this input in the constructor), and store the RegExp in
          // this.regularExpressions.
          if (ruleSym instanceof RegExp) {
            let newSym = ruleSym.source;
            rule[j] = newSym;
            this.regularExpressions[newSym] = new RegExp(
              "^(" + ruleSym.source + ")$"
            );
            break;
          }

          // Else assume that it is string, and first remove any optional "!"
          // (always valid) at the end of it, before validating and
          // preprocessing the remainder.
          if (ruleSym.at(-1) === "!") {
            ruleSym = ruleSym.slice(0, -1);
          }

          // Then remove any optional RegExp quantifier at the end, which is
          // also allowed for all symbols.
          let quantifierArr = ruleSym.match(TRAILING_QUANTIFIER_SUBSTR_REGEXP);
          if (quantifierArr) {
            ruleSym = ruleSym.slice(0, -quantifierArr[0].length);
          }

          // If a symbol in a rule is a pattern beginning and ending with "/",
          // construct and store a corresponding RegExp instance in
          // this.regularExpressions.
          if (ruleSym.at(0) === "/" && ruleSym.at(-1) === "/") {
            this.regularExpressions[newSym] = new RegExp(
              "^(" + ruleSym.slice(1, -1) + ")$"
            );
          }

          // If the symbol is a sub-parser symbol, validate it.
          else if (ruleSym.at(0) === "$") {
            if (!SUB_PARSER_SYM_REGEXP.test(ruleSym)) {
              throw `Parser: Sub-parser keys cannot any of the special \
                characters '/?*+{}[]$!'. Received "${ruleSym}".`;
            }
          }

          // Else validate it as either a regular symbol or a quantified
          // symbol.
          else {
            if (!NONTERMINAL_SYM_SUBSTR_REGEXP.test(ruleSym)) {
              throw `Parser: Invalid symbol: "${ruleSym}"`;
            }
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



// <summary>
// The main method of this Parser class, used for lexing and parsing (and
// potentially post-processing) a string.
// </summary>
// 
// <param name="str">
// The input string to be lexed and parsed.
// </param>
// 
// <param name="startSym">
// An optional start symbol, i.e. the nonterminal symbol that the whole input
// string should be parsed as. If undefined or null, the default start symbol,
// defaultSym, will be used. 
// </param>
// 
// <param name="isPartial">
// An optional boolean flag, with a default value of false, that if set to true
// will make the parsing end with an "End of partial string" error *the moment*
// the parser touches the end of the input string. Note that the syntax tree
// will still be still be returned, however, even if always unsuccessful. This
// option can thus be used to partially parse an incomplete string, otherwise
// of the grammar in its complete form, and then only use the successfully
// parsed part of it.
// </param>
// 
// <returns>
// A syntax tree consisting of nodes of the form
// {sym, isSuccess, error?, children?, ruleInd? lexeme?}, where sym the
// nonterminal symbol or the rule symbol of the node, isSuccess (bool) tells
// if the node was successfully parsed or not, children is an array of the
// node's child nodes (which on failure will be those of the rule that reached
// the furthest in the string, and also include the last failed node), ruleInd
// is the index of the rule that the children was obtained from in the given
// "rules" array in the case of a nonterminal symbol that has more than one
// rule, and lexeme is the matched lexeme in case of a pattern symbol.
// </returns>
  parseAndProcess(str, startSym, isPartial = false) {
    // Lex and parse the input string. 
    let syntaxTree = this.parse(str, startSym, isPartial);

    // Then process the syntax tree by calling all process() callbacks (in
    // order of children before parents, and first sibling through last
    // sibling).
    this.process(syntaxTree);

    // Return the now processed syntax tree.
    return syntaxTree;
  }


  process(syntaxTree) {
    // Process the children first.
    if (syntaxTree.children) {
      syntaxTree.children.forEach(this.process);
    }

    // Then process this syntax tree, and delete the given callback property
    // afterwards.
    if (syntaxTree.process) {
      syntaxTree.process(syntaxTree);
      delete syntaxTree.process;
    }

    // Also always delete the no longer needed pos and nextPos properties.
    delete syntaxTree.pos;
    delete syntaxTree.nextPos;
  }


  parse(str, startSym, isPartial = false) {
    // Lex the input string.
    let lexArr, strPosArr;
    try {
      [lexArr, strPosArr] = this.lexer.lex(str, isPartial);
    } catch (error) {
      if (error instanceof LexError) {
        let syntaxTree = {isSuccess: false, error: error.msq};
        return syntaxTree;
      }
      // Else throw error;
      else this.lexer.lex(str, isPartial); // Better for debugging.
    }

    // Then parse the resulting lexeme array.
    let syntaxTree = this.parseLexArr(
      lexArr, pos, startSym, str, strPosArr
    );

    // If the input string was not fully parsed, make sure that isSuccess is
    // set to false, and set an appropriate error for the syntax tree.
    if (syntaxTree.nextPos !== strPosArr.length) {
      // If the syntax tree was otherwise successful, meaning that only a part
      // of the string was parsed, construct an error saying so. 
      if (syntaxTree.isSuccess) {
        // (We could parse column and line number here, but let's not, at least
        // not for now. *Or maybe let us, after all, so a possible TODO here..)
        syntaxTree.isSuccess = false;
        syntaxTree.error = `Parsing error "Incomplete parsing" after:
          ${str.substring(strPos - ERROR_ECHO_STR_LEN - 1, strPos - 1)}
          ----
          Expected an empty string, but got:
          ${str.substring(strPos, strPos + Math.floor(ERROR_ECHO_STR_LEN/4))}
        `;
      }
      // Else extract an appropriate error from the syntax tree, via a call to
      // #getErrorAndFailedNode().
      else {
        syntaxTree.isSuccess = false;
        let [error, failedNode] = this.#getErrorAndFailedNode(syntaxTree);
        error ??= `Failed symbol ${failedNode.sym}`;

        if (error !== EOS_ERROR) {
          let strPos = strPosArr[failedNode.nextPos] ?? str.length - 1;
          syntaxTree.error = `Parsing error "${error}" after:
            ${str.substring(strPos - ERROR_ECHO_STR_LEN - 1, strPos - 1)}
            ----
            Expected ${failedNode.sym}, but got:
            ${str.substring(strPos, strPos + Math.floor(ERROR_ECHO_STR_LEN/4))}
          `;
        }
      }
    }
  
    // Then return the resulting syntax tree.
    return syntaxTree;
  }



  #getErrorAndFailedNode(syntaxTree) {
    // If the syntax tree has an error set, and has children, get the last
    // (assumed failed) child's error, and the last failed symbol, and return
    // this. (Note that a node will have no children if none of the rules
    // advanced the position.)
    if (!syntaxTree.error && syntaxTree.children && syntaxTree.children[0]) {
      let lastChild = syntaxTree.children.at(-1);
      return this.#getErrorAndFailedNode(lastChild);
    }

    // Else simply return this (final, failed) syntax tree's error (perhaps
    // undefined), as well as its nonterminal symbol.
    return [syntaxTree.error || undefined, syntaxTree];
  }




  parseLexArr(lexArr, pos, nonterminalSymbol) {
    nonterminalSymbol ??= this.defaultSym;

    // Parse the rules of the nonterminal symbol.
    let {rules, test, process} = this.grammar[nonterminalSymbol];
    let syntaxTree = this.#parseRules(lexArr, pos, rules);

    // If a syntax tree was parsed successfully, run the optional test()
    // function if there in order to finally succeed or fail it. 
    if (syntaxTree.isSuccess) {
      if (test) {
        let [isSuccess, error] = test(syntaxTree);
        syntaxTree.isSuccess = isSuccess;
        syntaxTree.error = error || undefined;
      }
    }

    // Append the optional post-processing callback to the syntax tree if one
    // is provided.
    syntaxTree.process = process || undefined;

    return syntaxTree;
  }




  #parseRules(lexArr, pos, rules) {
    // Initialize an array of arrays for each rule symbol index, j, each
    // supposed contain all recorded successful symbols for that j.
    let successfulSymbols = [];
    // Initialize an array of objects for each rule symbol index, j, each
    // supposed contain all recorded successful syntax trees, and with the
    // corresponding successful symbol as the key.
    let successfulSyntaxTrees = [];
    // Initialize a variable holding the record nextPos obtaining in a (failed)
    // rule so far, and also one holding the index of the "record rule" that
    // obtained it. Initialize recordRuleNextPos to pos such that rules are
    // not recorded if they do not advance the position
    let recordRuleNextPos = pos;
    let recordRuleInd;
    // Initialize and array containing all children of the "record rule," also
    // including the last, failed one.
    let recordRuleChildren;

    // Loop through all rules until a success is encountered, and keep track of
    // the "record" all the while, i.e. of the rule that got the furthest.
    let rulesNum = rules.length;
    let ruleSuccess = true;
    for (let i = 0; i < rulesNum; i++) {
      let rule = rules[i];
      let ruleLen = rule.length;

      let ruleChildren = [];
      let nextPos = pos;
      for (let j = 0; j < ruleLen; j++) {
        let childSyntaxTree;
        let ruleSym = rule[j];

        // If the rule symbol ends with "!", we remove it and instead record
        // a boolean, parseAgain, telling us to try parsing a symbol even if
        // a previous different symbol has succeeded with the same j. 
        let parseAgain = false;
        if (ruleSym.at(-1) === "!") {
          ruleSym = ruleSym.slice(0, -1);
          parseAgain = true;
        }

        // If there is no previous successes, or the parseAgain has (just) been
        // set to true, try parsing the symbol.
        let prevSuccesses = successfulSymbols[j];
        if (!prevSuccesses || parseAgain) {
          childSyntaxTree = this.#parseRuleSymbol(lexArr, nextPos, ruleSym);
          if (childSyntaxTree.isSuccess) {
            // Record the new success.
            ruleChildren.push(childSyntaxTree);
            nextPos = childSyntaxTree.nextPos;
            successfulSymbols[j] ??= [];
            successfulSymbols[j].push(ruleSym);
            successfulSyntaxTrees[j] ??= {};
            successfulSyntaxTrees[j][ruleSym] = childSyntaxTree;
          }
          else {
            // Store the failed child at the end of the children array.
            ruleChildren.push(childSyntaxTree);

            // If a parsing failed with error = EOS_ERROR, abort the parsing
            // immediately, propagating this error outwards.
            if (childSyntaxTree.error === EOS_ERROR) {
              syntaxTree = {
                sym: sym, isSuccess: false, error: EOS_ERROR,
                ruleInd: (rulesNum) ? i : undefined,
                children: ruleChildren,
                pos: pos, nextPos: nextPos,
              };
              return syntaxTree;
            }
          }
        }

        // Else we simply check whether there is a previous success with the
        // same symbol, and succeed or fail depending on that.
        else if (prevSuccesses.includes(ruleSym)) {
          // If there was matching success, we also push the same child to
          // this rule's ruleChildren array.
          childSyntaxTree = successfulSyntaxTrees[j][ruleSym];
          ruleChildren.push(childSyntaxTree);
          nextPos = childSyntaxTree.nextPos;
          continue;
        }
        else {
          ruleSuccess = false;
          break;
        }
      }

      // After a rule has either succeeded or failed, we respectively either
      // return the successful syntax tree, skipping all subsequent rules, or
      // we record the failed rule if and only if it breaks the previous record
      // for the largest nextPos reached. 
      if (ruleSuccess) {
        syntaxTree = {
          sym: sym, isSuccess: true,
          ruleInd: (rulesNum) ? i : undefined,
          children: ruleChildren,
          pos: pos, nextPos: nextPos,
        };
        return syntaxTree;
      }
      else if (nextPos > recordRuleNextPos) {
        recordRuleNextPos = nextPos;
        recordRuleInd = i;
        recordRuleChildren = ruleChildren;
      }
    }

    // If the for loop ends, meaning that all rules failed, we return a failed
    // syntax tree containing the children of the "record rule."
    syntaxTree = {
      sym: sym, isSuccess: false,
      ruleInd: (rulesNum) ? recordRuleInd || undefined : undefined,
      children: recordRuleChildren || undefined,
      pos: pos, nextPos: pos,
    };
    return syntaxTree;
  }




  #parseRuleSymbol(lexArr, pos, sym) {
    let nextLexeme = lexArr[pos];
    let syntaxTree;

    // If sym ends in either '?', '*', '+', '{n}' or '{n,m}', try parsing an
    // appropriate number of instances of the symbol preceding the quantifier.
    let quantifierArr = sym.match(TRAILING_QUANTIFIER_SUBSTR_REGEXP);
    if (quantifierArr) {
      let quantifier = quantifierArr[0];
      let subSym = sym.slice(0, -quantifier.length);

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
            sym: sym, isSuccess: true, children: children,
            pos: pos, nextPos: nextPos,
          };
          break;
        }

        // Else parse a new child.
        let childSyntaxTree = this.#parseRuleSymbol(lexArr, pos, subSym);
        if (childSyntaxTree.isSuccess) {
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
              sym: sym, isSuccess: true, children: children,
              pos: pos, nextPos: nextPos,
            };
            break;
          }
          else {
            syntaxTree = {
              sym: sym, isSuccess: false, children: children,
              pos: pos, nextPos: nextPos,
              // (Note that on failure, nextPos is supposed to be where the
              // error occurred.)
            };
            break;
          }
        }
      }
    }

    // Else if EOS is reached, which is located at the end of the lexArr if
    // and only if isPartial is true, fail the rule with an "EOS" error,
    else if (nextLexeme === EOS) {
      syntaxTree = {
        sym: sym, isSuccess: false, error: EOS_ERROR,
        pos: pos, nextPos: pos,
        // Note that on failure, nextPos is supposed to be where the error
        // occurred. 
      };
    }

    // Else if sym is a pattern, simply try to parse the next lexeme as that.
    else if (sym.at(0) === "/" && sym.at(-1) === "/") {
      if (!nextLexeme) {
        syntaxTree = {
          sym: sym, isSuccess: false,
          pos: pos, nextPos: pos,
          // (Note that on failure, nextPos is supposed to be where the error
          // occurred.)
        };
      }
      else {
        let regExp = this.regularExpressions[sym];
        if (regExp.test(nextLexeme)) {
          syntaxTree = {
            sym: sym, isSuccess: true, lexeme: [nextLexeme],
            pos: pos, nextPos: pos + 1,
          };
        }
        else {
          syntaxTree = {
            sym: sym, isSuccess: false,
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
      let startSym = (sym.match(SQUARE_BRACKET_SUBSTR_REGEXP) ?? ["[]"])[0]
        .slice(1, -1) ||
        undefined;
      let subLex = (sym.at(1) === "$");

      // If subLex is true, parse only a single (possibly big) lexeme, and
      // lex it first.
      if (subLex) {
        if (!nextLexeme) {
          syntaxTree = {
            sym: sym, isSuccess: false,
            pos: pos, nextPos: pos,
          };
        }
        else {
          syntaxTree = subParser.parse(nextLexeme, startSym, false);
        }
      }
      // Else let the parser parse as many lexemes as it can, using the
      // same lexeme array. 
      else {
        syntaxTree = subParser.parseLexArr(lexArr, pos, startSym);
      }
    }

    // Else treat sym as a non-terminal symbol, and make a recursive call to
    // parse() with nonterminalSymbol = sym.
    else {
      syntaxTree = this.parseLexArr(lexArr, pos, sym);
    }

    return syntaxTree;
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
      // it the end-of-partial-string constant.
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
