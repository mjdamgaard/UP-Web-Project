
/* This module exports the function to initialize new content loaders and
 * make them wait for activation. It also has the side-effect of attaching
 * a variable, upa1_contentSpecs, to the window, for which content
 * loader functions are supposed to be inserted (each with a "content key").
 **/

export class ContentSpec {
    constructor(tagName, attributes, htmlTemplate, eventSpecs) {
        this.tagName = tagName;
        this.attributes = attributes ?? {};
        this.html = htmlTemplate.replaceALL(
            /<<[^a-z_<>"][^<>"]*>>/, function(str) {
                let key = str.slice(2, -2);
                return '<template content-key="' + key + '"></template>';
            });
        this.eventSpecs = eventSpecs ?? [];
    }

    set htmlTemplate(htmlTemplate) {
        this.html = htmlTemplate.replaceALL(
            /<<[^a-z_<>][^<>]*>>/, function(str) {
                let key = str.slice(2, -2);
                return '<template content-key="' + key + '"></template>';
            });
    }
    get htmlTemplate() {
        return this.html; // no need to convert back here.
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

    addLoadInwardEvent(handler) {
        this.eventSpecs.push(
            {method:"one", events:"inward", handler:handler}
        );
    }
    addLoadOutwardEvent(handler) {
        this.eventSpecs.push(
            {method:"one", events:"outward", handler:handler}
        );
    }
    addLoadReadyEvent(handler) {
        this.eventSpecs.push(
            {method:"one", events:"ready", handler:handler}
        );
    }
}




/* Function to load content from content spec and replace it as outer HTML */
export function replaceByContent(jqObj, contentSpecIndex, key) {
    // TODO..
}

/* Function to load content from content spec and append it to inner HTML */
export function appendContent(jqObj, contentSpecIndex, key) {
    jqObj.append('<template></template>');
    let newChild = jqObj.children(':last-child');
    replaceByContent(newChild, contentSpecIndex, key);
}

/* A function to load the selected content template elements */
// export function transformContentPlaceholders(jqObj) {
export function loadContent(jqObj, contentSpecIndex) {
    jqObj.filter('template[content-key]').each(function() {
        loadContentOfSingleTemplate($(this), contentSpecIndex);
    });
}
function loadContentOfSingleTemplate(jqObj, contentSpecIndex) {
    let key = jqObj.attr("content-key");
    replaceByContent(jqObj, contentSpecIndex, key);
}
