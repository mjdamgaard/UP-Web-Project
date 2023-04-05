
/* Some functions to cache and select callback functions */


class FunctionCache {
    public static cache = {};
}


const funKeyPattern = "/^\w+$/";


export function upaFun_isValidFunKey(key) {
    return key.test(funKeyPattern);
}

export function upaFun_assertValidFunKey(key) {
    if (!upaFun_isValidFunKey(key)) {
        throw new Exception(
            "assertValidFunKey(): input is not a valid /^\w+$/ key"
        );
    }
}

// Note that since this function does not have the upaFun_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
export function getCachedFunction(key) {
    upaFun_assertValidFunKey(key)
    return FunctionCache.cache[key];
}

export function upaFun_cacheFunction(funName, key) {
    upaFun_assertValidFunKey(key);
    if (!funName.test("/^[\$\w]+$/")) {
        throw new Exception(
            "cacheFunction(): function name is not a valid /^[\$\w]+$/ string"
        );
    }
    let fullFunName = "upaFun_" + funName;
    if (typeof window[fullFunName] != "function") {
        throw new Exception(
            "cacheFunction(): function " + fullFunName +
                " is not defined yet"
        );
    }
    FunctionCache.cache[key] = window[fullFunName];
}
