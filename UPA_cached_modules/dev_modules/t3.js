
/* Functions to input ratings and insert terms */

export upaf_uploadRating(userID, subjID, relID, objID, rating) {
    // initialize the input request.
    let data = new InputDataConstructors.RateReqData(
        userID, subjID, relID, objID, rating
    );
    // request that user is authenticated/authorized for uploading
    // non-protected ratings.
    AuthRequestor.authForRate(userID, relID);
    // request inputting the rating and get the result containing an exit code.
    let res = JSON.parse($.getJSON("input_handler.php", data).responseText);
    // return the exit code.
    return res[1];
}

export upaf_uploadProtectedRating(userID, subjID, relID, objID, rating) {
    // initialize the input request.
    let data = new InputDataConstructors.RateReqData(
        userID, subjID, relID, objID, rating
    );
    // request that user is authenticated/authorized for uploading protected
    // ratings.
    AuthRequestor.authForProtectedRate(userID, relID);
    // construct a data HTML element and append it to #protectedRatingBuffer.
    let html = $("<data></data>").attr(data);
    $('#protectedRatingBuffer').append(html);
}


export upaf_uploadSemanticTerm(type, userID, catID, str) {
    // request that user is authenticated/authorized for sementic term uploads.
    AuthRequestor.authForTermInsert(userID);
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
            throw (
                "insertSemanticTerm(): invalid type input " +
                "(options are 'cat', 'eTerm' or 'rel')"
            );
    }
    // request insertion of the term and get the result containing the
    // exit code and the "outID," which can be either a new ID or an old ID,
    // depending on whether an identical term already exist in the database. If
    // the exit code is 0, outID is a new ID, and if it is 1, outID is the ID
    // of the existing identical term.
    let res = JSON.parse($.getJSON("input_handler.php", data).responseText);
    // return [outID, exit code].
    return res;
}

export upaf_uploadCat(userID, superCatID, title) {
    return upaf_uploadSemanticTerm("cat", userID, superCatID, title);
}

export upaf_uploadETerm(userID, catID, title) {
    return upaf_uploadSemanticTerm("eTerm", userID, catID, title);
}

export upaf_uploadRel(userID, subjCatID, objNoun) {
    return upaf_uploadSemanticTerm("rel", userID, subjCatID, objNoun);
}



export upaf_uploadText(userID, str) {
    // request that user is authenticated/authorized for term uploads.
    AuthRequestor.authForTextInsert(userID, str.length);
    // initialize the input request according to the chosen term type.
    var data = new InputDataConstructors.TextReqData(userID, str);
    // request insertion of the text term and get the result co... --"--.
    let res = JSON.parse($.getJSON("input_handler.php", data).responseText);
    // return [outID, exit code].
    return res;
}

export upaf_uploadBinary(userID, bin) {
    // request that user is authenticated/authorized for
    AuthRequestor.authForBinaryInsert(userID, bin.length);
    // initialize the input request according to the chosen term type.
    var data = new InputDataConstructors.BinReqData(userID, bin);
    // request insertion of the binary term and get the result co... --"--.
    let res = JSON.parse($.getJSON("input_handler.php", data).responseText);
    // return [outID, exit code].
    return res;
}







/* Functions to query the semantic database */

export upaf_querySet(setID, ratMin, ratMax, maxNum, offset, isAscending) {
    let data = new QueryDataConstructors.SetReqData(
        setID, ratMin, ratMax, maxNum, offset, isAscending
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return multidimensional array with columns: (ratingVal, objID).
    return res;
}

export upaf_querySetInfo(setID) {
    let data = new QueryDataConstructors.SetInfoReqData(
        setID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return array with elements: (userID, subjID, relID, elemNum).
    return res;
}

export upaf_querySetInfoFromSecKey(userID, subjID, relID) {
    let data = new QueryDataConstructors.SetInfoSecKeyReqData(
        userID, subjID, relID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return array with elements: (setID, elemNum).
    return res;
}


export upaf_queryRating(objID, setID) {
    let data = new QueryDataConstructors.RatReqData(
        objID, setID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return ratingVal.
    return res[0];
}

export upaf_queryCatDef(catID) {
    let data = new QueryDataConstructors.CatDefReqData(
        catID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return array with elements: (catTitle, superCatID).
    return res;
}

export upaf_queryETermDef(eTermID) {
    let data = new QueryDataConstructors.ETermDefReqData(
        eTermID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return array with elements: (eTermTitle, catID).
    return res;
}

export upaf_queryRelDef(relID) {
    let data = new QueryDataConstructors.RelDefReqData(
        relID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return array with elements: (objNoun, subjCatID).
    return res;
}

export upaf_querySuperCatDefs(catID) {
    let data = new QueryDataConstructors.SuperCatsReqData(
        catID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return multidimensional array with columns: (catTitle, superCatID).
    return res;
}

export upaf_queryText(textID) {
    let data = new QueryDataConstructors.TextReqData(
        textID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return text.
    return res[0];
}

export upaf_queryBinary(binID) {
    let data = new QueryDataConstructors.BinaryReqData(
        binID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return binary.
    return res[0];
}

export upaf_queryKeywordString(kwsID) {
    let data = new QueryDataConstructors.KeywordStrReqData(
        kwsID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return keyword string.
    return res[0];
}

export upaf_queryKeywordString(patID) {
    let data = new QueryDataConstructors.PatternReqData(
        patID
    );
    let res = JSON.parse($.getJSON("query_handler.php", data).responseText);
    // return pattern string.
    return res[0];
}

// TODO: Add more query requests.








/* Functions to verify and insert new scripts */

// TODO..
