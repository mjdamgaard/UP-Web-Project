
var storedFunctions {};

function storeFunction(fun, key) {
    if (!/^\w+$/.test(key)) {
        throw (
            "storeFunction(): function key is not a valid " +
            "/^\\w+$/ string"
        );
    }
    storedFunctions["upaf_" + key] = fun;
}
