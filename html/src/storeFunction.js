

// With upas_getStoreFunction I then intend to allow a definition of
// a upas_storeFunction() in the begining of a script, namely by a statement
// of the form
// "const upas_storeFunction = upas_getStoreFunction();",
// and then I will also allow statements of the form
// "upas_storeFunction(<Exp>, <FunIdent>);".
// (Here 's' in "upas_" stands for "special function.")

function upas_getStoreFunction() {
    var storedFunctions = {};
    return function(key, fun) {
        if (!/^\w+$/.test(key)) {
            throw (
                "storeFunction(): function key is not a valid " +
                "/^\\w+$/ string"
            );
        }
        storedFunctions["upak_" + key] = fun;
    }
}
