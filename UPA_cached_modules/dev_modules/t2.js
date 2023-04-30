
/* This module ...
 **/

export class ContentLoader {
    constructor(
        // these first two variables should not be undefined/null.
        contentKey, htmlTemplate,
        dataModifierFun,
        inwardCallbacks, outwardCallbacks,
        childLoaders, depGroups
    ) {
        this.contentKey = contentKey;
        // this.tagName = tagName;
        // this.attributes = attributes ?? {};
        this.html = this.convertHTMLTemplate(htmlTemplate);
        this.dataModifierFun = dataModifierFun ?? (
            function(data) {
                return data;
            }
        );
        this.inwardCallbacks = inwardCallbacks ?? [];
        this.outwardCallbacks = outwardCallbacks ?? [];
        this.childLoaders = childLoaders ?? [];
        this.depGroups = depGroups ?? [];
    }

    set htmlTemplate(htmlTemplate) {
        this.html = this.convertHTMLTemplate(htmlTemplate);
    }
    get htmlTemplate() {
        return this.html; // no need to convert back here.
    }
    convertHTMLTemplate(htmlTemplate) {
        return htmlTemplate.replaceALL(
            /<<[A-Z\$][\w]*>>/,
            function(str) {
                let key = str.slice(2, -2);
                return (
                    '<template class="startMarker" data-key="' + key +
                    '"></template>' +
                    '<template class="endMarker" data-key="' + key +
                    '"></template>' +
                );
            }
        );
    }

    loadAfterStartMarker(startMarkerJQObj, uniqueIDPrefix, data, parentArr) {
        parentArr = parentArr ?? [];

        startMarkerJQObj.attr("id", uniqueIDPrefix + "-start");
        startMarkerJQObj.next().attr("id", uniqueIDPrefix + "-end");

        startMarkerJQObj.data("nextID", 0)
            .on("increase-next-id", function() {
                let $this = $(this);
                $this.data("nextID", $this.data("nextID") + 1);
            });

        startMarkerJQObj.after(this.html);

        let firstElement = startMarkerJQObj.next();
        let len = this.inwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.inwardCallbacks[i];
            callback(firstElement, uniqueIDPrefix, data, parentArr);
        }

        let thisClass = this;
        let newParentArr = parentArr.concat([this]);
        let newData = this.dataModifierFun(data);
        startMarkerJQObj.nextUntil('#' + uniqueIDPrefix + "-end")
            .find('*')
            .addBack()
            .filter('template .startMarker')
            .each(function() {
                let newUniqueIDPrefix = uniqueIDPrefix + "-" +
                    startMarkerJQObj.data("nextID");
                startMarkerJQObj.trigger("increase-next-id");

                $thisStartMarker = $(this);
                let cl = thisClass.getRelatedContentLoader(
                    $thisStartMarker.attr("data-key"), parentArr
                );
                cl.loadAfterStartMarker(
                    $thisStartMarker, newUniqueIDPrefix, newData, newParentArr
                );
            });

        let firstElement = startMarkerJQObj.next();
        let len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.outwardCallbacks[i];
            callback(firstElement, uniqueIDPrefix, data, parentArr);
        }

        startMarkerJQObj.addClass("loaded");
    }

    getRelatedContentLoader(contentKey, parentArr) {
        // TODO: Get the first matching content loader by first searching in
        // this.childLoaders for matching contentKeys, and if none is found,
        // repeat this process for each parentArr until a match is found (or
        // throw error if none is found).
    }

    // TODO: add some functions to load content after/before/appended/prepended/
    // replaced. (..by first inserting start and end <template> markers and
    // then calling loadAfterStartMarker().)
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

    let len = contentSpec.inwardCallbacks.length;
    for (let i = 0; i < len; i++) {
        let callback = contentSpec.inwardCallbacks[i];
        callback(jqObj);
    }

    jqObj.find('template[content-key]')
        .each(function() {
            transformSingleContentTemplate($(this), contentSpecIndex);
        });

    let len = contentSpec.outwardCallbacks.length;
    for (let i = 0; i < len; i++) {
        let callback = contentSpec.outwardCallbacks[i];
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
