



export function lex(str, lexemeRegExArr, wsRegEx) {
  // Construct RegEx of all lexemes and whitespace. 
  let lexemeOrWSRegEx = new RegExp(
    wsRegEx.source + lexemeRegExArr.map(regEx => regEx.source).join("|"), "g"
  );

  // Construct lexer RegEx which also includes an extra final match that
  // greedily matches the rest of the string on failure of the lexemeOrWSRegEx. 
  let lexerRegEx = new RegExp(
    lexemeOrWSRegEx.source + "|" + "[^$]+", "g"
  );

  // Get the initial lexeme array still with whitespace and the potential last
  // failed string in it, then test and throw if the last match is that last
  // failure string.
  let unfilteredLexArr = str.match(lexerRegEx);
  let lastMatch = unfilteredLexArr[unfilteredLexArr.length - 1];
  if (!lexemeOrWSRegEx.test(lastMatch)) {
    let lastIndexOfInvalidLexeme = lastMatch.search(wsRegEx) - 1;
    throw (
      `Lexer error at:
      ${lastMatch.substring(0, 400)}
      ----
      Invalid lexeme:
      ${lastMatch.substring(0, lastIndexOfInvalidLexeme + 1)}
      `
    );
  }

  // If successful, filter out the whitespace from the unfilteredLexArr and
  // return the resulting array of all lexemes.
  let lexArr = unfilteredLexArr.filter(val => !wsRegEx.test(val));
  return lexArr;
}



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
/// literals. These elements are then to be parsed in sequence for the rule to
/// succeed. A production can also potentially be a string with a single
/// nonterminal symbol, instead of an array. The difference between a rule of
/// just "Foo" vs. ["Foo"] is subtle, yet it matters for performance and error
/// reporting. The difference lies in that fact that if a rule of the form
/// ["Foo", ...] fails, the partial list of all the successful elements of the
/// rule are recorded (if it is the longest one so far), and then used for
/// all subsequent rules, allowing them to skip parsing these parts again.
/// So if e.g. only "Foo" succeeds in ["Foo", "Bar"], and the next rule in line
/// is ["Foo", "Baz"], then the latter does not have to parse "Foo" all over
/// again. However, if the rule is simply the string "Foo" alone, then none of
/// its sub-successes will be carried over the the next rule in line. In fact,
/// any previous record of sub-successes will be erased after any such string-
/// typed rule.
/// 
/// In terms of error reporting, the error thrown will contain a 'Expected ...,
/// but encountered ...' message for all failed rules among those that tied
/// with the most successes.
/// </param>
/// <returns>
/// </returns>
export class Parser {
  constructor(grammar) {
    this.grammar = grammar;
  }

}


export class Production {
  constructor(label) {
    this.productions = productions;
  }

}
