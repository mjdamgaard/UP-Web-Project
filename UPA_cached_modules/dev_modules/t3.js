
/* Some functions to get and ... callback functions */


// Note that since this function does not have the upaFun_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
export function verifyAndGetUPAFunction(funName) {
    if (!funName.test("/^[\$\w]+$/")) {
        throw new Exception(
            "getUPAFunction(): function name is not a valid /^[\$\w]+$/ string"
        );
    }
    let fullFunName = "upaFun_" + funName;
    if (typeof window[fullFunName] != "function") {
        throw new Exception(
            "verifyAndGetUPAFunction(): function " + fullFunName +
                " is not defined yet"
        );
    }
    return window[fullFunName];
}
