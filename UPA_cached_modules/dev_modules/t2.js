
/* This module exports the function to initialize new content loaders and
 * make them wait for activation. It also has the side-effect of attaching
 * a variable, upa1_contentSpecs, to the window, for which content
 * loader functions are supposed to be inserted (each with a "content key").
 **/

export class ContentSpec {
    constructor(
        tagName, attributes, htmlTemplate,
        inwardLoadCallbacks, outwardLoadCallbacks
    ) {
        this.tagName = tagName;
        this.attributes = attributes ?? {};
        this.html = htmlTemplate.replaceALL(
            /<<[^a-z_<>"][^<>"]*>>/, function(str) {
                let key = str.slice(2, -2);
                return '<template content-key="' + key + '"></template>';
            });
        this.inwardLoadCallbacks = inwardLoadCallbacks ?? [];
        this.outwardLoadCallbacks = outwardLoadCallbacks ?? [];
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

    addInwardLoadCallback(callback) {
        this.inwardLoadCallbacks.push(callback);
    }
    addOutwardLoadCallback(callback) {
        this.outwardLoadCallbacks.push(callback);
    }
}



/* Function to load content from content spec and replace it as outer HTML */
export function replaceWithContent(jqObj, contentSpecIndex, key) {
    let contentSpec = contentSpecIndex[key];
    let parent = jqObj.parent();
    jqObj.replaceWith(
        '<' + contentSpec.tagName + ' id="RESERVED_TEMPORARY_ID" hidden >' +
        contentSpec.html + '</' + contentSpec.tagName + '>'
    );
    let jqObj = parent.children('#RESERVED_TEMPORARY_ID')
        .removeAttr("id")
        .removeAttr("hidden")
        .attr(contentSpec.attributes);

    let len = contentSpec.inwardLoadCallbacks.length;
    for (let i = 0; i < len; i++) {
        let callback = contentSpec.inwardLoadCallbacks[i];
        callback(jqObj);
    }

    jqObj.find('template[content-key]')
        .each(function() {
            transformSingleContentTemplate($(this), contentSpecIndex);
        });

    let len = contentSpec.outwardLoadCallbacks.length;
    for (let i = 0; i < len; i++) {
        let callback = contentSpec.outwardLoadCallbacks[i];
        callback(jqObj);
    }
}

/* Function to load content from content spec and append it to inner HTML */
export function appendContent(jqObj, contentSpecIndex, key) {
    jqObj.append('<template></template>');
    let newChild = jqObj.children(':last-child');
    replaceWithContent(newChild, contentSpecIndex, key);
}

/* A function to load the selected content template elements */
export function transformContentTemplates(jqObj, contentSpecIndex) {
    jqObj.filter('template[content-key]').each(function() {
        transformSingleContentTemplate($(this), contentSpecIndex);
    });
}
function transformSingleContentTemplate(jqObj, contentSpecIndex) {
    let key = jqObj.attr("content-key");
    replaceWithContent(jqObj, contentSpecIndex, key);
}
