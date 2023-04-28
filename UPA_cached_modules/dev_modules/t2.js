
/* This module exports the function to initialize new content loaders and
 * make them wait for activation. It also has the side-effect of attaching
 * a variable, upa1_contentLoaderFuns, to the window, for which content
 * loader functions are supposed to be inserted (each with a "content key").
 **/


function upa1_loadContent(jqObj) {
    // get the content key from the jQuery object, its id, and its context data.
    var contentKey = jqObj.attr("content-key");
    var id = jqObj.attr("id");
    var contextData = jqObj.attr("context-data");
    // look up the corresponding content loader function in a global variable
    // called upa1_contentLoaderFuns.
    var clFun = upa1_contentLoaderFuns[contentKey];
    // call the content loader function on the jQuery object and pass the
    // context data as input as well.
    clFun(jqObj, contextData);
    // after the content is loaded, search through the children to find any
    // nested content loaders, give them each unique ids (of the form
    // parentID + uniqueSuffix), and make them each listen for an event to
    // call this function for them as well.
    var idSuffix = 0;
    jqObj.find('[content-key]').each(function() {
        // set the id of the child content loader and increase idSuffix.
        let childID = id + "." + idSuffix.toString();
        $(this).attr("id", childID);
        idSuffix += 1;
        // set a boolean attribute to signal that content is not loaded yet.
        $(this).attr("is-loaded", false);
        // set up an event listener for the child to load its own content.
        $(this).one("load-content", function() {
            // load the inner content of child.
            upa1_loadContent($(this));
            // set boolean attribute to signal that content is loaded.
            $(this).attr("is-loaded", true);
        });
    });
    // trigger the loading of the content all the CL children that does not
    // have the wait attribute.
    jqObj.find('[content-key]:not([wait])').trigger("load-content");
}

// initialize upa1_contentLoaderFuns globally.
window["upa1_contentLoaderFuns"] = [];

// initialize upa1_loadContent globally.
window["upa1_loadContent"] = upa1_loadContent;
