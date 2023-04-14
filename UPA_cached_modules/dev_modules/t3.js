
/* Functions to input ratings and insert terms */

export upaf_rate(userID, subjID, relID, objID, rating) {
    // request that user is authenticated for
    AuthRequestor.authForRate(userID);
    // initialize the input request.
    let data = new InputDataConstructors.RateReqData(
        userID, subjID, relID, objID, rating
    );
    // request inputting the rating and get the result containing an exit code.
    let resObj = JSON.parse($.getJSON("input_handler.php", data).responseText);
    // return the exit code.
    return resObj.exitCode;
}


export upaf_insertSemanticTerm(type, userID, catID, str) {
    // request that user is authenticated for
    AuthRequestor.authForInsert(userID);
    // initialize the input request according to the chosen term type.
    var data;
    switch (type) {
        case "cat":
            data = new InputDataConstructors.CatReqData(userID, catID, str);
            break;
        case "eTerm":
            data = new InputDataConstructors.ETermReqData(userID, catID, str);
            break;
        case "rel":
            data = new InputDataConstructors.RelReqData(userID, catID, str);
            break;
        default:
            throw new Exception(
                "insertSemanticTerm(): invalid type input " +
                "(options are 'cat', 'eTerm' or 'rel')"
            );
    }
    // request insertion of the term and get the result containing the
    // exit code and the "outID," which can be either a new ID or an old ID,
    // depending on whether an identical term already exist in the database. If
    // the exit code is 0, outID is a new ID, and if it is 1, outID is the ID
    // of the existing identical term.
    let resObj = JSON.parse($.getJSON("input_handler.php", data).responseText);
    // return the exit code.
    return [resObj.outID, resObj.exitCode];
}

export upaf_insertCat(userID, superCatID, title) {
    return upaf_insertSemanticTerm("cat", userID, superCatID, title);
}

export upaf_insertETerm(userID, catID, title) {
    return upaf_insertSemanticTerm("eTerm", userID, catID, title);
}

export upaf_insertRel(userID, subjCatID, objNoun) {
    return upaf_insertSemanticTerm("rel", userID, subjCatID, objNoun);
}



export upaf_insertText(userID, str) {
    // request that user is authenticated for
    AuthRequestor.authForInsert(userID);
    // initialize the input request according to the chosen term type.
    var data = new InputDataConstructors.TextReqData(userID, str);
    // request insertion of the text term and get the result co... --"--.
    let resObj = JSON.parse($.getJSON("input_handler.php", data).responseText);
    // return the exit code.
    return [resObj.outID, resObj.exitCode];
}

export upaf_insertBinary(userID, bin) {
    // request that user is authenticated for
    AuthRequestor.authForInsert(userID);
    // initialize the input request according to the chosen term type.
    var data = new InputDataConstructors.BinReqData(userID, bin);
    // request insertion of the binary term and get the result co... --"--.
    let resObj = JSON.parse($.getJSON("input_handler.php", data).responseText);
    // return the exit code.
    return [resObj.outID, resObj.exitCode];
}



// export upaf_insertMultipleETerms(userID, catID, titleArr, n) {
//     // request that user is authenticated for
//     AuthRequestor.authForInsert(userID);
//     // initialize the input request according to the chosen term type.
//     var data = new InputDataConstructors.MultiETermsReqData(
//         userID, catID, titleArr, n
//     );
//     // request insertion of multiple elementary term and get... --"--.
//     $.getJSON("input_handler.php", data);
//     // return nothing.
// }



/* Functions to verify and insert new scripts */

// TODO..








/* Functions to query the semantic database */

// TODO.
