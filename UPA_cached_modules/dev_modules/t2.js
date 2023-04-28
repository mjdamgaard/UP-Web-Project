
/* This module exports the function to initialize new content loaders and
 * make them wait for activation. It also has the side-effect of attaching
 * a variable, upa1_contentSpecs, to the window, for which content
 * loader functions are supposed to be inserted (each with a "content key").
 **/

export class ContentManager {
    contructor(contentKey, cmParent, idArr) {
        this.contentKey = contentKey;
        this.cmParent = cmParent;
        this.idArr = idArr;
        this.cmChildren = [];
        this.cmChildrenCount = 0;
    }

    get jqObj() {
        return $(
            '#' + this.idArr[0] +
            '> [cm-sibling-index="' +
                this.idArr.slice(1).join('"] > [cm-sibling-index="') +
            ']'
        );
    }

    loadAndAppendContent(jqObj) {
        let contentSpecs = upa1_contentSpecs[this.contentKey];
        let tagName = childContentSpecs[0];
        let attributes = childContentSpecs[1];
        let contents = childContentSpecs[2];

        jqObj.append("<" + tagName "></" + tagName + ">");
        let newContentContainer = jqObj.children(':last-child')
            .attr("id", this.idArr.join("."))
            .attr("cm-sibling-index", this.idArr[this.idArr.length - 1])
            .attr(attributes);

        let contentsLen = contents.length;
        for (let i = 0; i < contentsLen; i++) {
            // if contents[i] starts with "html:", assume that the rest is
            // HTML to be appended to the input jQuery object.
            if (contents[i].substring(0, 5) === "html:") {
                newContentContainer.append(contents.substring(5));
            // else assume that it is a content key to contruct a new
            // ContentManager child with.
            } else {
                // initialize a new ContentManager instance as a "child" of
                // this one.
                let cmChildIDArr = this.idArr.concat([this.cmChildrenCount]);
                let cmChild = new ContentManager(contents[i], this, childIDArr);
                this.cmChildren.push(cmChild);
                this.cmChildrenCount++;
                // call its loadAndAppendContent() method to load its content
                // and append it to newContentContainer.
                cmChild.loadAndAppendContent(newContentContainer);
            }
        }
    }

    applyCallbacks() {
        // TODO..
    }
}

function upa1_loadContent(jqObj) {
    // get the content key from the jQuery object, its id, and its context data.
    var contentKey = jqObj.attr("content-key");
    var id = jqObj.attr("id");
    var contextData = jqObj.attr("context-data");
    // look up the corresponding content loader function in a global variable
    // called upa1_contentSpecs.
    var clFun = upa1_contentSpecs[contentKey];
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
        // set up an event listener for the child to load its own content.
        $(this).one("load-content", function() {
            // load the inner content of child.
            upa1_loadContent($(this));
            // set boolean attribute to signal that content is loaded.
            $(this).attr("is-loaded", "true");
        });
    });
    // trigger the loading of the content all the CL children that does not
    // have the wait attribute.
    jqObj.find('[content-key]:not([wait])').trigger("load-content");
}

// initialize upa1_contentSpecs globally.
window["upa1_contentSpecs"] = [];

// initialize upa1_loadContent globally.
window["upa1_loadContent"] = upa1_loadContent;
