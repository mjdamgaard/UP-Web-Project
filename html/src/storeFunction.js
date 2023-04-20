
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
// (20.04.23, 10:18) Maybe I will make/allow another special function to
// initialize storeFunction and upas_storedFunctions locally in a script, and
// then also allow a special "var upas_storeFunction, upas_storedFunctions"
// statement to declare these local variables (and also the statement to then
// call said function to initialize them).. 
