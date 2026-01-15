
const ERROR_ECHO_STR_LEN = 400;

const NONTERMINAL_SYM_REGEXP =
  /^[^/?*+{}$!]+$/;
const NONTERMINAL_SYM_SUBSTR_REGEXP =
   /[^/?*+{}$!]+/;
const TRAILING_QUANTIFIER_SUBSTR_REGEXP =
  /(![1-9][0-9]*)?([?*+]\$?|\{(0|[1-9][0-9]*)(,(0|[1-9][0-9]*))?\}\$?)$/;
const TRAILING_DOD_OP_SUBSTR_REGEXP =
  /!(0|[1-9][0-9]*)?$/;
const LEADING_POS_DOD_OP_SUBSTR_REGEXP =
  /^![1-9][0-9]*/;
const TRAILING_DOD_OP_REGEXP = /![1-9][0-9]*$/;

const NUMBER_SUBSTR_REGEXP_G =
  /0|[1-9][0-9]*/g;


export const EOS_ERROR = "End of partial string";




// <summary>
// A Parser class to parse strings according to a given grammar, and a given
// set of lexicons defining the lexeme and whitespace patterns.
//
// The main method of this class is Parser.parse(str, startSym?) used for
// lexing and parsing (and potentially processing) a string.
// </summary>
// 
// <param name="grammar">
// A key-value object where the keys function as the nonterminal symbols of
// the grammar, and the values contain the production rules of the given
// nonterminal symbol. (See e.g. https://en.wikipedia.org/wiki/Formal_grammar.)
// 
// The values of the grammar object has to be of the form
// {rules, process?, params?, lexicon?}, where 'rules' first of all is an array
// of rules, which are each an array of symbols (terminal or nonterminal) to
// parse.
// Also, 'process' is an optional function to process the syntaxTree on a
// success, which will be explained below. And params is an optional input
// array that is appended to process()'s other inputs.
// Lastly, 'lexicon' is a string which, if defined, changes the so-called
// "lexicon" for the duration of the given nonterminal symbol to the one
// in the 'lexicons' object of the same key, where the 'lexicons' object is
// another argument of Parser.constructor(), explained below.
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

// The the optional process(children, ruleInd, ...params) function can process
// the syntax tree node right after it has been successfully parsed, and also
// potentially perform a test on it, which can turn a success into a failure.
// If process() returns an object, syntaxTree.res will be set to that object.
// syntaxTree.res.type will also automatically be set to the nonterminal symbol
// if it has not already been set by process. If it process() returns false
// (exactly), the symbol is marked as failed, but other symbols can be tried in
// its place. And if process() returns a string, the overall parsing halts
// there and returns a failed syntax tree immediately.
// The inputs of process() is (children, syntaxTree), where children is an
// array of preprocessed children, where all nonterminal symbol children are
// replaced with there syntaxTree.res object, all terminal symbol children are
// replaced with their parsed lexeme, and all quantified symbols are replaced
// with an array of similarly preprocessed children. And the ruleInd input is
// the index of the rule that succeeded.
// 
// The first rule to succeed for a nonterminal symbol will short-circuit it,
// such that the subsequent rules will not be tried.
// </param>
// 
// <param name="defaultSym">
// The default (nonterminal) start symbol for the parser.
// </param>
// 
// <param name="lexicons">
// An key-value object where the values are 'lexicon' objects of the form
// {lexemes, whitespace?}. Here, 'lexemes' is an array of lexeme patterns
// (strings or RegExes) for the language, and 'whitespace' is the whitespace
// pattern of the language. If 'whitespace' is undefined, no whitespace will
// be removed automatically when the string is lexed. 
// </param>
// 
// <param name="startLexiconKey">
// The key to the initial lexicon to use from the 'lexicons' when the parsing
// begins, unless of course the start symbol declares another lexicon key.
// </param>
export class Parser {
  constructor(grammar, defaultSym, lexicons, startLexiconKey) {
    this.grammar = grammar;
    this.defaultSym = defaultSym;
    this.lexicons = lexicons;
    this.startLexiconKey = startLexiconKey;
    
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
  // <returns>
  // [syntaxTree, lexArr, strPosArr], where syntaxTree is a syntax tree
  // consisting of nodes of the form
  // {sym, isSuccess, error?, children?, ruleInd? lexeme?, pos?, nextPos, res?},
  // where sym is the nonterminal symbol or the rule symbol of the node,
  // isSuccess (bool) tells if the node was successfully parsed or not,
  // children is an array of the node's child nodes (which on failure will be
  // those of the rule that reached the furthest in the string, and also
  // include the last failed node),
  // ruleInd, in the case of a nonterminal symbol that has more than one rule,
  // is the index in the given rules array from which the children was obtained,
  // and lexeme is the matched lexeme in case of a pattern symbol. The returned
  // pos is the index position of the first lexeme of the parsed nonterminal
  // symbol, and nextPos is the index of the last lexeme plus 1. And lastly,
  // res is the returned object from the optional process() function.
  // </returns>
  parse(str, startSym = this.defaultSym) {
    // Initialize a Lexer instance to lex the string.
    let lexer = new Lexer(str, this.lexicons, this.startLexiconKey);

    // Then parse the resulting lexeme array.
    let syntaxTree = this.parseRuleSymbol(lexer, 0, startSym);
    let {lexArr, strPosArr} = lexer;

    // If the input string was not fully parsed, but the syntax tree was
    // otherwise successful, meaning that only a part of the string was parsed,
    // construct an error saying so.
    if (
      syntaxTree.isSuccess && lexer.getNextLexeme(syntaxTree.nextPos) !== EOS
    ) {
      syntaxTree.isSuccess = false;
      let strPos = strPosArr[syntaxTree.nextPos] ?? str.length;
      let subStr = str.substring(0, strPos);
      let [ln, col] = getLnAndCol(subStr);
      syntaxTree.error = new SyntaxError(
        'Incomplete parsing after \n`' +
        subStr.substring(strPos - ERROR_ECHO_STR_LEN) +
        "` \nExpected an empty string, but got: `" +
        str.substring(strPos, strPos + Math.floor(ERROR_ECHO_STR_LEN/4)) + "`",
        ln, col
      );
    }
    // Else extract an appropriate error from the syntax tree, via a call to
    // #getErrorAndFailedSymbols().
    else if (!syntaxTree.isSuccess) {
      let [error, failedNodeSymbol, expectedSymbols] =
        this.#getErrorAndFailedSymbols(syntaxTree);
      if (error) {
        let strPos = strPosArr[syntaxTree.nextPos - 1] ?? str.length;
        let subStr = str.substring(0, strPos);
        let [ln, col] = getLnAndCol(subStr);
        syntaxTree.error = new SyntaxError(
          'Error after `\n' + subStr.substring(strPos - ERROR_ECHO_STR_LEN) +
          '\n`.\nError: ' + error,
          ln, col
        );
      } else {
        let strPos = strPosArr[syntaxTree.nextPos] ?? str.length;
        let subStr = str.substring(0, strPos);
        let [ln, col] = getLnAndCol(subStr);
        syntaxTree.error = new SyntaxError(
          `Failed symbol '${failedNodeSymbol}' after \n\`` +
          subStr.substring(strPos - ERROR_ECHO_STR_LEN) +
          `\` \n■\nExpected symbol(s) ${expectedSymbols}, but got \`` +
          str.substring(strPos, strPos + Math.floor(ERROR_ECHO_STR_LEN/4)) +
          "`",
          ln, col
        );
      }
    }
  
    // Then return the resulting syntax tree, along with lexArr and strPosArr.
    return [syntaxTree, lexArr, strPosArr];
  }



  #getErrorAndFailedSymbols(syntaxTree) {
    let children = syntaxTree.children;

    // If the node has an error set, simply return that.
    if (syntaxTree.error) {
      return [syntaxTree.error];
    }

    // Else if node has a quantified symbol, call this function recursively on
    // the last, failed child.
    let failedChild = children.at(-1);
    if (TRAILING_QUANTIFIER_SUBSTR_REGEXP.test(syntaxTree.sym)) {
      return this.#getErrorAndFailedSymbols(failedChild);
    }

    // Else if the last failed symbol is a nonterminal or quantified symbol
    // which managed to advance the position (meaning that its nextPos is
    // greater than the previous sibling, and greater than the parent's
    // position, pos), then call this function recursively to get the error and
    // failed node from that.
    let prevPos = children.at(-2)?.nextPos ?? syntaxTree.pos;
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
        (acc, sym, ind) => acc && this.#compareUntilLastBang(
          (children[ind] ?? {}).sym, sym
        ),
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

  #compareUntilLastBang(sym1, sym2) {
    if (!sym1) return false;
    return sym1.replace(TRAILING_DOD_OP_REGEXP, "") ===
      sym2.replace(TRAILING_DOD_OP_REGEXP, "");
  }




  parseNTSymbol(lexer, pos = 0, nonterminalSymbol, triedSymbols = []) {
    // Before anything else, check that symbol hasn't already been tried at
    // this position in order to prevent infinite recursion.
    if (triedSymbols.includes(nonterminalSymbol)) {
      throw "Parser: Infinite recursion detected. Symbol: \"" +
      nonterminalSymbol + '". Symbols tried in same place: "' +
      triedSymbols.join('","') + '"';
    } else {
      triedSymbols = [nonterminalSymbol, ...triedSymbols];
    }

    // Get the properties of the nonterminal symbol in the grammar.
    let {rules, process, params = [], lexicon: lexiconKey} =
      this.grammar[nonterminalSymbol] ?? {};
    if (!rules) throw (
      "Parser.parseNTSymbol(): Undefined nonterminal symbol: \"" +
      nonterminalSymbol + '"'
    );

    // If the 'lexicon' property is defined, change the lexicon of the lexer.
    let prevLexiconKey;
    if (lexiconKey) {
      prevLexiconKey = lexer.changeLexicon(lexiconKey, pos);
    }

    // Parse the rules of the nonterminal symbol.
    let syntaxTree = this.parseRules(
      lexer, pos, rules, nonterminalSymbol, triedSymbols
    );
    syntaxTree.pos = pos;

    // If a syntax tree was parsed successfully, run the optional process()
    // function if there in order to test and process it.
    if (syntaxTree.isSuccess) {
      if (process) {
        // Process the would-be successful syntax tree.
        let preprocessedChildren = this.getPreprocessedChildren(syntaxTree);
        let res = process(preprocessedChildren, syntaxTree.ruleInd, ...params);

        // Set res, isSuccess, or error depending on the returned values, and
        // also reset nextPos on a failure.
        let resType = typeof res;
        if (resType === "object") {
          syntaxTree.res = res;
        }
        else if (resType === "boolean") {
          syntaxTree.isSuccess = res;
          if (!res) syntaxTree.nextPos = pos;
        }
        else if (resType === "string") {
          syntaxTree.isSuccess = false;
          syntaxTree.error = res;
          syntaxTree.nextPos = pos;
        }
        // Else if resType is e.g. "undefined", do nothing.
      }
    }

    // Finally, if the lexicon was changed for this rule, change it back before
    // continuing, and with either the previous or the new position as the
    // input to changeLexicon() depending on whether the rule succeeded or not.
    if (lexiconKey) {
      let nextLexemePos = syntaxTree.isSuccess ? syntaxTree.nextPos : pos;
      lexer.changeLexicon(prevLexiconKey, nextLexemePos);
    }

    return syntaxTree;
  }


  getPreprocessedChildren(syntaxTree) {
    // For each quantified symbol child, return an array of the res property
    // (set by the process() function) of all the children. For all terminal
    // symbol children, extract the lexeme. And for all terminal symbols,
    // simply extract the res property.
    return syntaxTree.children.map(child => {
      if (TRAILING_QUANTIFIER_SUBSTR_REGEXP.test(child.sym)) {
        return child.children.map(val => val.res ?? val.lexeme);
      } else if (child.sym.at(0) === "/" && child.sym.at(-1) === "/") {
        return child.lexeme;
      } else {
        return child.res;
      }
    });
  }






  parseRules(lexer, pos, rules, sym, triedSymbols = []) {
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
                if (nextPos - ruleSymPos >= doOrDieLevel) {
                  doOrDie = true;
                }
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
          lexer, nextPos, ruleSym, (nextPos === pos) ? triedSymbols : []
        );
        nextPos = childSyntaxTree.nextPos;

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




  parseRuleSymbol(lexer, pos, sym, triedSymbols = []) {
    let nextLexeme = lexer.getNextLexeme(pos);

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

      // If the quantifier has a prefix of the form '!n', set doOrDieLevel = n,
      // meaning that is a symbol fails with n or more lexemes successfully
      // parsed, fail the whole quantified symbol.
      let doOrDieLevel = Infinity;
      let doOrDiePrefixArr = quantifier.match(LEADING_POS_DOD_OP_SUBSTR_REGEXP);
      if (doOrDiePrefixArr) {
        let doOrDiePrefix = doOrDiePrefixArr[0];
        doOrDieLevel = parseInt(doOrDiePrefix.substring(1));
        quantifier = quantifier.substring(doOrDiePrefix.length);
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
          lexer, nextPos, subSym, (i === 0) ? triedSymbols : []
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
          if (
            i >= min &&
            !(failIfEOSIsNotReached && lexer.getNextLexeme(nextPos) !== EOS) &&
            childSyntaxTree.nextPos - nextPos < doOrDieLevel
          ) {
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

    // Else if sym is a pattern, simply try to parse the next lexeme as that.
    if (sym.at(0) === "/" && sym.at(-1) === "/") {
      if (!nextLexeme || nextLexeme === EOS || nextLexeme === FAILED_LEXEME) {
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
    return this.parseNTSymbol(lexer, pos, sym, triedSymbols);
  }

}









export class Lexer {
  constructor(str, lexicons, startLexiconKey) {
    this.str = str;
    this.lexerRegExes = {};
    Object.entries(lexicons).forEach(
      ([key, {lexemes, whitespace = /[^\s\S]/}]) => {
        let wsPattern = (whitespace instanceof RegExp) ? whitespace.source :
          whitespace;
        this.lexerRegExes[key] = new RegExp(
          "(" + wsPattern + ")*" + "(?<lexeme>(" +
            lexemes.map(pattern => (
              (pattern instanceof RegExp) ? pattern.source :
                pattern.slice(1, -1)
            )).join("|") +
          ")?)",
          "g"
        );
      }
    );
    this.curLexiconKey = startLexiconKey;
    this.curLexerRegEx = this.lexerRegExes[startLexiconKey];
    this.lexArr = [];
    this.strPosArr = [];
    this.nextStrPos = 0;
  }

  /* Public read-only properties:
   * this.lexArr
   * this.strPosArr
  **/

  getNextLexeme(nextPos) {
    let lexeme = this.lexArr[nextPos];
    if (lexeme) {
      return lexeme;
    }
    else {
      let {0: match, groups} = this.curLexerRegEx.exec(this.str);
      lexeme = groups.lexeme;
      this.nextStrPos = this.curLexerRegEx.lastIndex;
      this.strPosArr[nextPos] = this.nextStrPos - lexeme.length;
      if (!lexeme) {
        if (this.nextStrPos + match.length >= this.str.length) {
          return this.lexArr[nextPos] = EOS;
        } else {
          return this.lexArr[nextPos] = FAILED_LEXEME;
        }
      }
      else {
        return this.lexArr[nextPos] = lexeme;
      }
    }
  }

  changeLexicon(key, nextPos) {
    let prevKey = this.curLexiconKey;
    if (key === prevKey) {
      return key;
    }
    else if (nextPos > this.lexArr.length) {
      throw "Lexer.changeLexicon(): nextPos - 1 must not be greater than " +
        "the last index of this.lexArr";
    }

    // Change the current lexicon, and make sure to set the lastIndex of its
    // regex and this.nextStrPos to the position right after the lexeme at
    // lexArr[nextPos - 1], or to 0 if nextPos == 0.
    this.curLexiconKey = key;
    this.curLexerRegEx = this.lexerRegExes[key];
    if (!this.curLexerRegEx) {
      throw "Lexer.changeLexicon(): Unrecognized key";
    }
    this.curLexerRegEx.lastIndex = this.nextStrPos = (nextPos <= 0) ? 0 :
      this.strPosArr[nextPos - 1] + this.lexArr[nextPos - 1].length;

    // Also chop off lexArr and strPosArr such that nextPos - 1 is now the last
    // index.
    this.lexArr = this.lexArr.slice(0, nextPos);
    this.strPosArr = this.strPosArr.slice(0, nextPos);

    // Return the previous lexiconKey;
    return prevKey;
  }
}




const EOS = Symbol("EOS");
const FAILED_LEXEME = Symbol("failed-lexeme");


export class SyntaxError {
  constructor(msg, ln, col) {
    this.msg = msg;
    this.ln = ln;
    this.col = col;
  }
}



export function getExtendedErrorMsg(err) {
  if (err instanceof SyntaxError) {
    return `SyntaxError at Ln ${err.ln}, Col ${err.col}: "${err.msg}"`;
  }
  else {
    throw "getExtendedErrorMsg(): Unrecognized error"
  }
}




export function getLnAndCol(str) {
  let lineArr = str.match(/.*(\n|$)/g).filter(val => val !== "");
  if (lineArr.length === 0) {
    lineArr = [""];
  }
  let ln = lineArr.length;
  let col = lineArr.at(-1).length + 1;
  return [ln, col];
}




export {Parser as default};
