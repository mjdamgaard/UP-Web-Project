import { error } from "jquery";

const ERROR_ECHO_STR_LEN = 400;


const NONTERMINAL_SYM_REGEXP =
  /^[^\/\?\*\+\{\}\$!]+$/;
const NONTERMINAL_SYM_SUBSTR_REGEXP =
   /[^\/\?\*\+\{\}\$!]+/;
const TRAILING_QUANTIFIER_SUBSTR_REGEXP =
  /([\?\*\+]\$?|\{(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))?\}\$?)$/;
const TRAILING_DOD_OP_SUBSTR_REGEXP =
  /!(0|[1-9][0-9]*)?$/;

const NUMBER_SUBSTR_REGEXP_G =
  /0|[1-9][0-9]*/g;


export const EOS_ERROR = "End of partial string";







// <summary>
// A Parser class to lex and parse strings with a given grammar, and a given
// array of lexeme patterns plus an optional whitespace pattern, which together
// defines how the string is lexed before the parsing itself.
//
// The main method of this class is Parser.parse(str, startSym?, isPartial?),
// used for lexing and parsing (and potentially processing) a string.
// </summary>
// 
// <param name="grammar">
// A key-value object where the keys function as the nonterminal symbols of
// the grammar, and the values contain the production rules of the given
// nonterminal symbol. (See e.g. https://en.wikipedia.org/wiki/Formal_grammar.)
// 
// The values of the grammar object has to be of the form
// {rules, process?}, where rules first of all is an array of rules, which are
// each an array of symbols (terminal or nonterminal) to try parsing.
// The the optional process(syntaxTree) function can process and reformat the
// syntax tree node right after it has been successfully parsed, and also
// potentially perform a test on it, which can turn a success into a failure.
// The latter is done by returning [isSuccess = true, error], where the node
// fails silently if isSuccess is defined and falsy, and fails with an error
// that aborts the parsing if error is a non-empty error message string.
// 
// The symbols inside each rule of the grammar can either be another (or the
// same) nonterminal symbol, or a RegExp pattern beginning and ending in '/',
// with *no* '^' or '$' at the two ends, which succeeds a lexeme if and only if
// the lexeme is fully matched by the pattern. A RegExp instance is also
// accepted instead of a pattern, again with neither '^' nor '$' at the ends.
// Furthermore, any rule symbol can also be followed by a RegExp quantifier,
// i.e. '?', '*', '+', or '{<n>,<m>}', which parses a variable number of the
// preceding nonterminal symbol.
// And lastly, any of these rule symbols, quantified or not, can also be
// followed by a '!<n>?' at the very end, which tells the parser that if it
// reaches this symbol in the rule, and manages to parse n lexemes within it,
// then no other rules should by tried after the current one. Note also that
// '!' is equivalent to "!0", meaning that the rule will always be "do or die"
// from there once this symbol is reached.
// 
// The first rule to succeed for a nonterminal symbol will short-circuit it,
// such that the subsequent rules will not be tried.
// </param>
// 
// <param name="defaultSym">
// The default (nonterminal) start symbol for the parser.
// </param>
// 
// <param name="lexemePatternArr">
// An array of lexeme pattern, which are tried in order from the first to the
// last when constructing the lexeme array.
// </param>
// 
// <param name="wsPattern">
// A pattern of what the parser considers "whitespace" (might also include
// comments) when lexing the string. This whitespace pattern will be tried
// first thing whenever a new lexeme is lexed.
// </param>
export class Parser {
  constructor(grammar, defaultSym, lexemePatternArr, wsPattern) {
    this.grammar = grammar;
    this.defaultSym = defaultSym;

    // Initialize the lexer.
    this.lexer = new Lexer(lexemePatternArr, wsPattern);
    
    // preprocess all the regular expressions or patterns appearing in grammar.
    this.regularExpressions = {};
    this.#validateAndPreprocess();
  }

  #validateAndPreprocess() {
    Object.entries(this.grammar).forEach(([sym, {rules}]) => {
      // First validate the nonterminal symbol.
      if (!NONTERMINAL_SYM_REGEXP.test(sym)) {
        throw "Parser: Nonterminal symbols cannot contain any of the " +
          "special characters '/?*+{}$!'. Received \"" + sym + '".';
      }
      // Then go through each rule symbol and process patterns and RegExps.
      let rulesNum = rules.length;
      if (!(rulesNum > 0)) throw "Parser: rules array cannot be empty.";
      for (let i = 0; i < rulesNum; i++) {
        let rule = rules[i];
        let ruleLen = rule.length;
        if (!(ruleLen > 0)) throw "Parser: rule cannot be an empty array.";
        for (let j = 0; j < ruleLen; j++) {
          let ruleSym = rule[j];

          // If a symbol is an instance of RegExp replace it with the
          // corresponding pattern in grammar (as a side-effect transmuting
          // this input in the constructor), and store the RegExp in
          // this.regularExpressions.
          if (ruleSym instanceof RegExp) {
            let newSym = "/" + ruleSym.source + "/";
            rule[j] = newSym;
            this.regularExpressions[newSym] = new RegExp(
              "^(" + ruleSym.source + ")$"
            );
            continue;
          }

          // Else assume that it is string, and first remove any optional do-
          // or-die operator at the end, before validating and reprocessing
          // the remainder.
          let doOrDieOpArr = ruleSym.match(TRAILING_DOD_OP_SUBSTR_REGEXP);
          if (doOrDieOpArr) {
            ruleSym = ruleSym.slice(0, -doOrDieOpArr[0].length);
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
            this.regularExpressions[ruleSym] = new RegExp(
              "^(" + ruleSym.slice(1, -1) + ")$"
            );
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




  // <summary>
  // The main method of this Parser class, used for lexing and parsing (and
  // potentially processing) a string.
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
  // An optional boolean flag, with a default value of false, that if set to
  // true will make the parsing end with an "End of partial string" error
  // *the moment* the parser touches the end of the input string. Note that
  // the syntax tree will still be still be returned, however, even if always
  // unsuccessful. This option can thus be used to partially parse an
  // incomplete string, otherwise of the grammar in its complete form, and
  // then only use the successfully parsed part of it.
  // </param>
  // 
  // <returns>
  // [syntaxTree, lexArr, strPosArr], where syntaxTree is a syntax tree
  // consisting of nodes of the form
  // {sym, isSuccess, error?, children?, ruleInd? lexeme?, pos?, nextPos},
  // where sym is the nonterminal symbol or the rule symbol of the node,
  // isSuccess (bool) tells if the node was successfully parsed or not,
  // children is an array of the node's child nodes (which on failure will be
  // those of the rule that reached the furthest in the string, and also
  // include the last failed node),
  // ruleInd, in the case of a nonterminal symbol that has more than one rule,
  // is the index in the given rules array from which the children was obtained,
  // and lexeme is the matched lexeme in case of a pattern symbol.
  // Also the returned pos is the index position of the first lexeme of the
  // parsed nonterminal symbol, and nextPos is the index of the last lexeme
  // plus 1.
  // </returns>
  parse(str, startSym, isPartial = false, keepLastLexeme = false) {
    startSym ??= this.defaultSym;

    // Lex the input string.
    let lexArr, strPosArr;
    try {
      [lexArr, strPosArr] = this.lexer.lex(str, isPartial, keepLastLexeme);
    } catch (error) {
      if (error instanceof LexError) {
        let syntaxTree = {isSuccess: false, error: error.msg};
        return syntaxTree;
      }
      // Else throw error;
      else this.lexer.lex(str, isPartial, keepLastLexeme); // For debugging.
    }

    // Then parse the resulting lexeme array.
    let syntaxTree = this.parseRuleSymbol(lexArr, 0, startSym);

    // If the input string was not fully parsed, but the syntax tree was
    // otherwise successful, meaning that only a part of the string was parsed,
    // construct an error saying so. 
    if (syntaxTree.isSuccess && syntaxTree.nextPos !== strPosArr.length) {
      // (We could parse column and line number here, but let's not, at least
      // not for now. *Or maybe let us, after all, so a possible TODO here..)
      syntaxTree.isSuccess = false;
      let strPos = strPosArr[syntaxTree.nextPos] ?? str.length;
      syntaxTree.error = 'Incomplete parsing after:\n' +
        str.substring(0, strPos).substring(strPos - ERROR_ECHO_STR_LEN) +
        "\n--------\n" +
        "Expected an empty string, but got:\n" +
        str.substring(strPos, strPos + Math.floor(ERROR_ECHO_STR_LEN/4));
    }
    // Else extract an appropriate error from the syntax tree, via a call to
    // #getErrorAndFailedSymbols().
    else if (!syntaxTree.isSuccess) {
      let [error, failedNodeSymbol, expectedSymbols] =
        this.#getErrorAndFailedSymbols(syntaxTree);
      if (error) {
        let strPos = strPosArr[syntaxTree.nextPos - 1] ?? str.length;
        syntaxTree.error = 'Error after:\n' +
          str.substring(0, strPos).substring(strPos - ERROR_ECHO_STR_LEN) +
          "\n--------\n" +
          'Error:\n  ' + error.replaceAll("\n", "\n  ");
        syntaxTree.lexArr = lexArr;
      } else {
        let strPos = strPosArr[syntaxTree.nextPos] ?? str.length;
        syntaxTree.error = `Failed symbol '${failedNodeSymbol}' after:\n` +
          str.substring(0, strPos).substring(strPos - ERROR_ECHO_STR_LEN) +
          "\n--------\n" +
          `Expected symbol(s) ${expectedSymbols}, but got:\n` +
          str.substring(strPos, strPos + Math.floor(ERROR_ECHO_STR_LEN/4));
      }
    }
  
    // Then return the resulting syntax tree, along with lexArr and strPosArr.
    return [syntaxTree, lexArr, strPosArr];
  }



  #getErrorAndFailedSymbols(syntaxTree, pos = 0) {
    let children = syntaxTree.children;

    // If the node has an error set, simply return that.
    if (syntaxTree.error) {
      return [syntaxTree.error];
    }

    // Else if node has a quantified symbol, which means that the minimum
    // number of instances was not parsed (or the end of string was not
    // reached), call this function recursively on the last, failed child.
    let failedChild = children.at(-1);
    if (TRAILING_QUANTIFIER_SUBSTR_REGEXP.test(syntaxTree.sym)) {
      return this.#getErrorAndFailedSymbols(failedChild);
    }

    // Else if the last failed symbol is a nonterminal or quantified symbol
    // which managed to advance the position (meaning that its nextPos is
    // greater than the previous sibling, and greater than the parent's
    // position, pos), then call this function recursively to get the error and
    // failed node from that.
    let prevPos = (children.at(-2) || {nextPos: pos}).nextPos;
    if (failedChild.nextPos > prevPos) {
      return this.#getErrorAndFailedSymbols(failedChild);
    }

    // Else get all the symbols that was one of the expected ones at that point
    // where the parsing reached, and return those, along with the symbol of
    // the current node, and an undefined error.
    let rules = this.grammar[syntaxTree.sym].rules;
    let childrenLen = children.length;
    let failedSymArr = [];
    rules.forEach(rule => {
      if (rule.length < childrenLen) return;
      let partialRule = rule.slice(0, childrenLen - 1);
      let isAlmostSuccessful = partialRule.reduce(
        (acc, sym, ind) => acc && (children[ind] ?? {}).sym === sym,
        true
      );
      if (isAlmostSuccessful) {
        failedSymArr.push(rule[childrenLen - 1]);
      }
    });
    failedSymArr = [...new Set([...failedSymArr])];
    if (failedSymArr.length === 1) {
      return [undefined, syntaxTree.sym, `'${failedSymArr[0]}'`];
    } else {
      let joinedSymbols = failedSymArr.join("' or '");
      return [undefined, syntaxTree.sym, `'${joinedSymbols}'`];;
    }
  }




  parseLexArr(lexArr, pos = 0, nonterminalSymbol, triedSymbols = []) {
    nonterminalSymbol ??= this.defaultSym;

    // Parse the rules of the nonterminal symbol.
    let {rules, process} = this.grammar[nonterminalSymbol] ||
      (() => {
        throw "Parser.parseLexArr(): Undefined nonterminal symbol: \"" +
          nonterminalSymbol + '"';
      })();
    let syntaxTree = this.parseRules(
      lexArr, pos, rules, nonterminalSymbol, triedSymbols
    );
    syntaxTree.pos = pos;

    // If a syntax tree was parsed successfully, run the optional process()
    // function if there in order to test and process it.
    if (syntaxTree.isSuccess) {
      if (process) {
        let nextPos = syntaxTree.nextPos;
        let sym = syntaxTree.sym;

        // Process the would-be successful syntax tree.
        let [isSuccess = true, error] = process(syntaxTree) || [];

        // Make sure that pos, nextPos and sym isn't changed by the user (as
        // they are used for error reporting).
        syntaxTree.nextPos = nextPos;
        syntaxTree.sym = sym;
        syntaxTree.pos = pos;

        // Set error and isSuccess depending on the returned values, and also
        // reset nextPos on an error.
        syntaxTree.isSuccess = isSuccess && !error;
        if (error) {
          syntaxTree.error = error;
          syntaxTree.nextPos = pos;
        }
      }
    }

    return syntaxTree;
  }




  parseRules(lexArr, pos, rules, sym, triedSymbols = []) {
    // Initialize a variable holding the index of the "record rule," which is
    // the most recent rule who broke or tied with the record of having the
    // largest nextPos (after a failure). 
    let recordRuleInd;
    // Initialize an array containing all children of the "record rule," also
    // including the last, failed one.
    let recordRuleChildren;
    // Initialize a doOrDie variable, that is set to true if a symbol ending in
    // '!<n>?' advances the pos with n or more lexemes, and which will then
    // mean that no more rules will be tried after the current one.
    let doOrDie = false;
    // Initialize an array of all failed first symbols, used for skipping
    // already tried symbols, even if they are not part of the "record rule."
    // Also initialize an array with the corresponding failed nodes. 
    let failedFirstSymbols = [];
    let failedFirstNodes = [];

    // Loop through all rules until a success is encountered, and keep track of
    // the "record" all the while, i.e. of the rule that got the furthest.
    let rulesNum = rules.length;
    for (let i = 0; i < rulesNum; i++) {
      let rule = rules[i];
      let ruleLen = rule.length;
      let nextPos = pos;
      let lookUpPrevSuccess = true;

      let ruleChildren = [];
      let ruleSuccess = false;
      for (let j = 0; j < ruleLen; j++) {
        let childSyntaxTree;
        let ruleSym = rule[j];
        let ruleSymPos = nextPos;

        // If the rule symbol ends with '!<n>?' (where '!' is equivalent to
        // '!0'), we parse n as the doOrDieLevel, which is the minimum
        // increment of pos that can be reached by the symbol before doOrDie is
        // set to true. (As an example, a rule symbol of "if-statement!1",
        // where "if-statement" is a nonterminal symbol always starting with
        // "if" as the first lexeme, will mark the rule as do-or-die if "if"
        // was successfully parsed within this rule symbol.)
        let doOrDieLevel = Infinity;
        let doOrDieOpArr = ruleSym.match(TRAILING_DOD_OP_SUBSTR_REGEXP);
        if (doOrDieOpArr) {
          doOrDieLevel = parseInt(doOrDieOpArr[0].substring(1)) || 0;
          ruleSym = ruleSym.slice(0, -doOrDieOpArr[0].length);
        }

        // If the j is 0 and ruleSym is one of the previously failed first
        // symbols, break the rule parsing and copy the previously failed node
        // to ruleChildren.
        let failedSymbolIndex = failedFirstSymbols.indexOf(ruleSym);
        if (j === 0 && failedSymbolIndex !== -1) {
          ruleChildren.push(failedFirstNodes[failedSymbolIndex]);
          ruleSuccess = false;
          break;
        }

        // Else we at first we try to copy as many successes from the "record
        // rule" until a symbol is reached that doesn't match the one in
        // recordRuleChildren at the same position.
        if (lookUpPrevSuccess && recordRuleChildren) {
          let prevChildSyntaxTree = recordRuleChildren[j];
          if (prevChildSyntaxTree.sym === ruleSym) {
            if (prevChildSyntaxTree.isSuccess) {
              // Add the previous success to ruleChildren and increase nextPos.
              ruleChildren.push(prevChildSyntaxTree);
              nextPos = prevChildSyntaxTree.nextPos;
              // If it was the last rule symbol, succeed the rule. Else continue
              // to the next rule symbol.
              if (j === ruleLen - 1) {
                ruleSuccess = true;
                break;
              } else {
                continue;
              }
            }
            else {
              // Also add the child in case of a failure in case the rule ties
              // with the previous record.
              ruleChildren.push(prevChildSyntaxTree);
              ruleSuccess = false;
              break;
            }
          }
          // When a symbol is reached that doesn't match the corresponding one
          // in the "rule record", we start parsing the rule symbols from there,
          // setting lookUpPrevSuccess = false for the remainder of the rule.
          else {
            lookUpPrevSuccess = false;
          }
        }

        // After this initial skipping of previously recorded matching
        // successes, First of all try parsing the rule symbol.
        childSyntaxTree = this.parseRuleSymbol(
          lexArr, nextPos, ruleSym, (j === 0) ? triedSymbols : []
        );

        // First set doOrDie depending how how far nextPos got, regardless
        // of whether the rule symbol succeeded or not.
        if (nextPos - ruleSymPos >= doOrDieLevel) {
          doOrDie = true;
        }

        // If the symbol is successful, record the successful child and
        // continue to the next rule symbol.
        if (childSyntaxTree.isSuccess) {
          // Add the successful child to ruleChildren and increase nextPos.
          ruleChildren.push(childSyntaxTree);
          nextPos = childSyntaxTree.nextPos;
          // If it was the last rule symbol, succeed the rule. Else continue
          // to the next rule symbol.
          if (j === ruleLen - 1) {
            ruleSuccess = true;
            break;
          } else {
            continue;
          }
        }
        
        // Else if failed, store the failed child at the end of the children
        // array, first of all.
        ruleChildren.push(childSyntaxTree);
        // And if j is 0, push the failed symbol to failedFirstSymbols.
        if (j === 0) {
          failedFirstSymbols.push(ruleSym);
          failedFirstNodes.push(childSyntaxTree);
        }

        // And if the child failed with an error, abort the parsing immediately,
        // propagating this error all the way out to the root.
        if (childSyntaxTree.error) {
          let syntaxTree = {
            sym: sym, isSuccess: false, error: childSyntaxTree.error,
            ruleInd: (rulesNum) ? i : undefined,
            children: ruleChildren,
            nextPos: childSyntaxTree.nextPos,
          };
          return syntaxTree;
        }

        // Else simply fail this current rule and continue to the next one.
        ruleSuccess = false;
        break;
      }

      // After a rule has either succeeded or failed, we respectively either
      // return the successful syntax tree, skipping all subsequent rules, or
      // we record the failed rule if it breaks or ties with the previous
      // record for the largest nextPos reached. 
      if (ruleSuccess) {
        let syntaxTree = {
          sym: sym, isSuccess: true,
          ruleInd: (rulesNum) ? i : undefined,
          children: ruleChildren,
          nextPos: nextPos,
        };
        return syntaxTree;
      }
      else if (
        !recordRuleChildren || nextPos >= recordRuleChildren.at(-1).nextPos
      ) {
        recordRuleInd = i;
        recordRuleChildren = ruleChildren;
      }

      // Break the parsing if doOrDie is true, or else continue to the next
      // rule.
      if (doOrDie) {
        break;
      } else {
        continue;
      }
    }

    // If the for loop ends, meaning that all rules failed, we return a failed
    // syntax tree containing the children of the "record rule."
    let syntaxTree = {
      sym: sym, isSuccess: false,
      ruleInd: (rulesNum) ? recordRuleInd || undefined : undefined,
      children: recordRuleChildren || undefined,
      nextPos: recordRuleChildren.at(-1).nextPos,
    };
    return syntaxTree;
  }




  parseRuleSymbol(lexArr, pos, sym, triedSymbols = []) {
    let nextLexeme = lexArr[pos];

    // Before anything else, check  that sym hasn't already been tried at this
    // position in order to prevent infinite recursion.
    if (triedSymbols.includes(sym)) {
      throw "Parser: Infinite recursion detected. Symbol: \"" + sym + '". ' +
        "Symbols tried in same place: \"" + triedSymbols.join('","') + '"';
    } else {
      triedSymbols.push(sym);
    }

    // If sym ends in either '?', '*', '+', '{n}' or '{n,m}', try parsing an
    // appropriate number of instances of the symbol preceding the quantifier.
    let quantifierArr = sym.match(TRAILING_QUANTIFIER_SUBSTR_REGEXP);
    if (quantifierArr) {
      let quantifier = quantifierArr[0];
      let subSym = sym.slice(0, -quantifier.length);

      // If the quantifier ends in '$', set failIfEOSIsNotReached = true, and
      // remove it from the symbol for further handling.
      let failIfEOSIsNotReached = (quantifier.at(-1) === "$");
      if (failIfEOSIsNotReached) {
        quantifier = quantifier.slice(0, -1);
      }

      // Parse n and m from quantifier := "{n(,m)?}", and then set max and
      // min based on those, and on the quantifier in general. 
      let [n, m] = (quantifier.match(NUMBER_SUBSTR_REGEXP_G) ?? []).map(
        val => parseInt(val)
      );
      let max = m ?? n ?? (quantifier === "?") ? 1 : Infinity;
      let min = n ?? (quantifier === "+") ? 1 : 0;

      // Then parse as many instances of sybSym as possible in a row,
      // storing the each resulting syntax tree in an array, children.
      let children = [];
      let nextPos = pos;
      for (let i = 0; true; i++) {
        // Break if max is reached, and construct a successful syntax tree.
        if (i + 1 > max) {
          return {
            sym: sym, isSuccess: true, children: children,
            nextPos: nextPos,
          };
        }

        // Else parse a new child.
        let childSyntaxTree = this.parseRuleSymbol(
          lexArr, nextPos, subSym, (i === 0) ? triedSymbols : []
        );

        // If an error was raised, abort parsing here immediately.
        if (childSyntaxTree.error) {
          children.push(childSyntaxTree);
          return {
            sym: sym, isSuccess: false, error: childSyntaxTree.error,
            children: children,
            nextPos: childSyntaxTree.nextPos,
          };
        }
        // Else on success, add child syntax tree to children and increase pos.
        if (childSyntaxTree.isSuccess) {
          children.push(childSyntaxTree);
          nextPos = childSyntaxTree.nextPos;
        }
        // If and when failing, mark a success or failure depending on
        // whether min was reached or not, or whether or not the boolean
        // failIfEOSIsNotReached is true or not.
        else {
          if (i >= min && !(failIfEOSIsNotReached && lexArr[nextPos])) {
            return {
              sym: sym, isSuccess: true, children: children,
              nextPos: nextPos,
            };
          }
          else {
            children.push(childSyntaxTree);
            return {
              sym: sym, isSuccess: false, children: children,
              nextPos: childSyntaxTree.nextPos,
            };
          }
        }
      }
    }

    // Else if EOS is reached, which is located at the end of the lexArr if
    // and only if isPartial is true, fail the rule with an "EOS" error,
    if (nextLexeme === EOS) {
      return {
        sym: sym, isSuccess: false, error: EOS_ERROR,
        nextPos: pos,
      };
    }

    // Else if sym is a pattern, simply try to parse the next lexeme as that.
    if (sym.at(0) === "/" && sym.at(-1) === "/") {
      if (!nextLexeme) {
        return {
          sym: sym, isSuccess: false,
          nextPos: pos,
        };
      }
      else {
        let regExp = this.regularExpressions[sym];
        if (regExp.test(nextLexeme)) {
          return {
            sym: sym, isSuccess: true, lexeme: nextLexeme,
            nextPos: pos + 1,
          };
        }
        else {
          return {
            sym: sym, isSuccess: false,
            nextPos: pos,
          };
        }
      }
    }

    // Else treat sym as a non-terminal symbol, and make a recursive call to
    // parse() with nonterminalSymbol = sym.
    return this.parseLexArr(lexArr, pos, sym, triedSymbols);
  }



  log(syntaxTree) {
    console.log(syntaxTree);
    (syntaxTree.error || "").split("\n").forEach(val => console.log(val));
  }
}









export class Lexer {
  constructor(lexemePatternArr, wsPattern) {
    // Whitespace RegEx.
    this.wsRegEx = (wsPattern instanceof RegExp) ? wsPattern :
      wsPattern ? new RegExp(wsPattern) :
      /[^\s\S]/;
    this.onlyWSRegEx = new RegExp("^(" + this.wsRegEx.source + ")$");
    this.hasWhitespace = wsPattern ? true : false;
    // RegEx of all lexemes and whitespace. 
    this.lexemeOrWSRegEx = new RegExp(
      this.wsRegEx.source + "|" +
      lexemePatternArr.map(
        pattern => (pattern instanceof RegExp) ? pattern.source :
          pattern.slice(1, -1)
      ).join("|")
    );
    // Lexer RegEx which also includes an extra final match that
    // greedily matches the rest of the string on failure of the
    // lexemeOrWSRegEx. 
    this.lexerRegEx = new RegExp(
      this.lexemeOrWSRegEx.source + "|" + "[^$]+",
      "g"
    );
  }


  lex(str, isPartial = false, keepLastLexeme = false) {
    // Get the initial lexeme array still with whitespace and the potential last
    // failed string in it, then test and throw if the last match is that last
    // failure string.
    let unfilteredLexArr = str.match(this.lexerRegEx)
      .filter(val => val !== "");

    // Construct an array of the positions in str of each of the element in
    // unfilteredLexArr.
    var strPos = 0;
    let unfilteredStrPosArr = unfilteredLexArr.map(elem => {
      let ret = strPos;
      strPos += elem.length;
      return ret;
    })

    // Check that the last lexeme isn't the greedy "[^$]+" one, unless
    // isPartial = true, in which case change it for the EOS constant. 
    let lastMatch = unfilteredLexArr.at(-1);
    if (!this.lexemeOrWSRegEx.test(lastMatch)) {
      if (!isPartial) {
        let prevStr = unfilteredLexArr.slice(0, -1).join("");
        throw new LexError(
          "Lexer error after: \n" +
          prevStr.slice(-ERROR_ECHO_STR_LEN) +
          "\n--------\n" +
          "Invalid lexeme at:\n" +
          lastMatch.substring(0, Math.floor(ERROR_ECHO_STR_LEN/4))
        );
      } else {
        unfilteredLexArr[unfilteredLexArr.length - 1] = EOS;
      }
    }
    // If isPartial is true, but the last match is not the greedy one, append
    // EOS at the end of the lexeme array instead.
    else if (isPartial) {
      if (keepLastLexeme) {
        unfilteredLexArr[unfilteredLexArr.length] = EOS;
        unfilteredStrPosArr.push(str.length);
      } else {
        unfilteredLexArr[unfilteredLexArr.length - 1] = EOS;
      }
    }
  
    // If successful, filter out the whitespace from the unfilteredLexArr
    // and the corresponding positions in strPosArr, and return these two
    // filtered arrays
    let lexArr, strPosArr;
    if (this.hasWhitespace) {
      lexArr = unfilteredLexArr.filter((val, ind) => {
        let isWhitespace = this.onlyWSRegEx.test(val);
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

const EOS = {enumName: "EOS"};
