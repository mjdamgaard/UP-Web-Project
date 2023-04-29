
/* This module exports the function to initialize new content loaders and
 * make them wait for activation. It also has the side-effect of attaching
 * a variable, upa1_contentSpecs, to the window, for which content
 * loader functions are supposed to be inserted (each with a "content key").
 **/

export class ContentSpec {
    contructor(tagName, attributes, htmlTemplate, eventSpecs) {
        this.tagName = tagName;
        this.attributes = attributes ?? {};
        this.htmlTemplate = htmlTemplate;
        this.eventSpecs = eventSpecs ?? [];
    }

    addOnEvent(events, handler) {
        this.eventSpecs.push(
            {method:"on", events:events, handler:handler}
        );
    }

    addOneEvent(events, handler) {
        this.eventSpecs.push(
            {method:"one", events:events, handler:handler}
        );
    }
}

/* Helper function to load the full HTML content from specification, where all
 * "<< <Content Key> >>" occurances are replaces with their corresponding
 * <template> tag variant.
 **/
function loadAndAppendHTML(jqObj, contentSpec) {

}

/* The function to load and append content from content specification */
export function loadAndAppendContent(jqObj, contentSpec) {

}

/* A function to load contents of all inner content template elements */
export function loadInnerContentTemplates(jqObj) {

}


// function loadAndAppendContent(jqObj, contentSpec) {
//     // get the content key from the jQuery object, its id, and its context data.
//     var contentKey = jqObj.attr("content-key");
//     var id = jqObj.attr("id");
//     var contextData = jqObj.attr("context-data");
//     // look up the corresponding content loader function in a global variable
//     // called upa1_contentSpecs.
//     var clFun = upa1_contentSpecs[contentKey];
//     // call the content loader function on the jQuery object and pass the
//     // context data as input as well.
//     clFun(jqObj, contextData);
//     // after the content is loaded, search through the children to find any
//     // nested content loaders, give them each unique ids (of the form
//     // parentID + uniqueSuffix), and make them each listen for an event to
//     // call this function for them as well.
//     var idSuffix = 0;
//     jqObj.find('[content-key]').each(function() {
//         // set the id of the child content loader and increase idSuffix.
//         let childID = id + "." + idSuffix.toString();
//         $(this).attr("id", childID);
//         idSuffix += 1;
//         // set up an event listener for the child to load its own content.
//         $(this).one("load-content", function() {
//             // load the inner content of child.
//             loadContent($(this));
//             // set boolean attribute to signal that content is loaded.
//             $(this).attr("is-loaded", "true");
//         });
//     });
//     // trigger the loading of the content all the CL children that does not
//     // have the wait attribute.
//     jqObj.find('[content-key]:not([wait])').trigger("load-content");
// }
