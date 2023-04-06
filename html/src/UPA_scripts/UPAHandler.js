
import {
    parseModuleScript
} from "./parsing/script.js";




export const UPAHandler {

    parseModule: function(script) {
        // var ret = false;
        // try {
        //     ret = parseModuleScript(script);
        // } catch (exception) {}
        return parseModuleScript(script);
    }

}










//
