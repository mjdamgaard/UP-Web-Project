
/* This module exports the function to initialize new content loaders and
 * make them wait for activation. (It will probably also export other functions
 * at some point..)
 **/


export function loadContent(jqObj) {
    // get the content key.
    var contentKey = jqObj.attr("content-key");
    // look up the corresponding content loader function in a global variable
    // called upa1_contentLoaderFunctions.
    var clFun = upa1_contentLoaderFunctions[contentKey];
    // get the context data to pass on to each children.
    var contextData = jqObj.attr("context-data");
    // call the content loader function on the jQuery object and pass the
    // context data as input as well.
    clFun(jqObj, contextData);
    // after the content is loaded, seach through the children to find any
    // nested content loaders and make them each listen for a "activate" event
    // ..

}
