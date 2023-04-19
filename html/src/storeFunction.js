
// (Here 's' stands for "special function/variable.")
var upas_storedFunctions = {};

function upas_storeFunction(key, fun) {
    if (!/^\w+$/.test(key)) {
        throw (
            "storeFunction(): function key is not a valid " +
            "/^\\w+$/ string"
        );
    }
    upas_storedFunctions["upak_" + key] = fun;
}

// TODO: Allow all scripts to initialize their own new upas_storedFunctions
// at their beginning (after "use strict"). ..(And I also btw now intend to
// allow function expressions for inputs to storeFunction().)
