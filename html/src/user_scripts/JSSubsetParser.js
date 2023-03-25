
function initialScriptStructure(script) {
    return initialScriptStructureHelper(script, 0);
}

function initialScriptStructureHelper(script, level) {
    // throw exception if parentheses level is to high.
    if (level > 10000) {
        throw new Exception("JSSubsetParser: too many nested parentheses");
    }
    // split the script
    let splitScript = script.split("(", 2);

}

export class JSSubsetParser {


}










//
