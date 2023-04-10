
/* Some JS numeric function wrappers */

export function upaf_toString(num) {
    return num.toString();
}

export function upaf_toExponential(num) {
    return num.toExponential();
}

export function upaf_toFixed(num) {
    return num.toFixed();
}

export function upaf_toPrecision(num) {
    return num.toPrecision();
}

export function upaf_isInteger(num) {
    return num.isInteger();
}

export function upaf_isSafeInteger(num) {
    return num.isSafeInteger();
}

export function upaf_isInfinite(num) {
    return num.isInfinite();
}

export function upaf_isNaN(num) {
    return num.isNaN();
}


export function upaf_E() {
    return Math.E;
}

export function upaf_PI() {
    return Math.PI;
}

export function upaf_SQRT2() {
    return Math.SQRT2;
}

export function upaf_SQRT1_2() {
    return Math.SQRT1_2;
}

export function upaf_LN2() {
    return Math.LN2;
}

export function upaf_LN10() {
    return Math.LN10;
}

export function upaf_LOG2E() {
    return Math.LOG2E;
}

export function upaf_LOG10E() {
    return Math.LOG10E;
}


export function upaf_round(num) {
    return Math.round(num);
}

export function upaf_ceil(num) {
    return Math.ceil(num);
}

export function upaf_floor(num) {
    return Math.floor(num);
}

export function upaf_trunc(num) {
    return Math.trunc(num);
}

export function upaf_abs(num) {
    return Math.abs(num);
}

export function upaf_sqrt(num) {
    return Math.sqrt(num);
}

export function upaf_exp(num) {
    return Math.exp(num);
}

export function upaf_sin(num) {
    return Math.sin(num);
}

export function upaf_cos(num) {
    return Math.cos(num);
}

export function upaf_tan(num) {
    return Math.tan(num);
}

export function upaf_asin(num) {
    return Math.asin(num);
}

export function upaf_acos(num) {
    return Math.acos(num);
}

export function upaf_atan(num) {
    return Math.atan(num);
}


export function upaf_math(methodName, num1, num2) {
    switch (methodName) {
        case "E":
        case "PI":
        case "SQRT2":
        case "SQRT1_2":
        case "LN2":
        case "LN10":
        case "LOG2E":
        case "LOG10E":
            return Math[methodName];
            break;
        case "abs":
        case "acos":
        case "acosh":
        case "asin":
        case "asinh":
        case "atan":
        case "atanh":
        case "cbrt":
        case "ceil":
        case "clz32":
        case "cos":
        case "cosh":
        case "exp":
        case "expm1":
        case "floor":
        case "fround":
        case "log":
        case "log1p":
        case "log10":
        case "log2":
        case "max":
        case "min":
        case "random":
        case "round":
        case "sign":
        case "sin":
        case "sinh":
        case "sqrt":
        case "tan":
        case "tanh":
        case "trunc":
            return Math[methodName](num1);
            break;
        case "pow":
        case "atan2":
        case "hypot":
        case "imul":
            return Math[methodName](num1, num2);
            break;
        default:
            throw new Exception(
                "math(): method name not recognized"
            );
    }
}

export function upaf_numberMethod(methodName, num) {
    switch (methodName) {
        case "toString":
        case "toExponential":
        case "toFixed":
        case "toPrecision":
        case "isInteger":
        case "isSafeInteger":
        case "isInfinite":
        case "isNaN":
            return num[methodName]();
        default:
            throw new Exception(
                "numberMethods(): method name not recognized"
            );
    }
}







/* Some JS string method wrappers */

// TODO: make these.






/* Some JS array method wrappers */

// TODO: make these.
