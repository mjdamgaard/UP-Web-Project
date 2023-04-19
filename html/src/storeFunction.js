
// (Here 's' stands for "special function/variable.")
var upas_storedFunctions = {};

function upas_storeFunction(fun, key) {
    if (!/^\w+$/.test(key)) {
        throw (
            "storeFunction(): function key is not a valid " +
            "/^\\w+$/ string"
        );
    }
    upas_storedFunctions["upak_" + key] = fun;
}
