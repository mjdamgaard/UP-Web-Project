
/* This module ...
 **/


export function getStartAndEndMarkerTags(key) {
    return (
        '<template class="startMarker" data-key="' + key + '"></template>' +
        '<template class="endMarker"></template>'
    );
}
export function convertHTMLTemplate(htmlTemplate) {
    return htmlTemplate.replaceAll(
        /<<[A-Z][\w\-]*>>/g,
        function(str) {
            let key = str.slice(2, -2);
            return getStartAndEndMarkerTags(key);
        }
    );
}


export class ContentLoader {
    constructor(
        // these first two variables should not be undefined/null.
        contentKey, htmlTemplate,
        childLoaders, modSignals,
        inwardCallbacks, outwardCallbacks,
        dataModifierFun,
    ) {
        this.contentKey = contentKey;
        // this.tagName = tagName;
        // this.attributes = attributes ?? {};
        this.html = convertHTMLTemplate(htmlTemplate);
        this.childLoaders = childLoaders ?? [];
        this.modSignals = modSignals ?? [];
        this.inwardCallbacks = inwardCallbacks ?? [];
        this.outwardCallbacks = outwardCallbacks ?? [];
        this.dataModifierFun = dataModifierFun ?? (
            function(data) {
                return data;
            }
        );
        // this.dynamicData can be used for storing arbritary data (primitive
        // data types and objects), including data necessary to ensure unique
        // ids.
        this.dynamicData = {};
    }

    set htmlTemplate(htmlTemplate) {
        this.html = convertHTMLTemplate(htmlTemplate);
    }
    get htmlTemplate() {
        return this.html; // no need to convert back here.
    }


    #loadBetweenMarkers($start, data, parentArr) {
        // initialize some variables to use when loading the inner CIs (where
        // 'CI' stands for 'content instance').
        parentArr = parentArr ?? [];
        let thisClassInstance = this;
        let newParentArr = parentArr.concat([thisClassInstance]);
        let newData = this.dataModifierFun(data);
        // record the end marker.
        let $end = $start.next();

        // first insert the new HTML after $obj.
        $start.after(this.html);
        let $ci = $start.next();
        $ci.attr("CI").addClass()
        // apply all the inward callbacks (which can change the initial HTML).
        let len = this.inwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.inwardCallbacks[i];
            callback($obj, data, parentArr);
        }

        $obj.nextUntil('#' + uniqueIDPrefix + "_end")
            .find('*')
            .addBack()
            .filter('template.CI')
            .each(function() {
                let newUniqueIDPrefix = uniqueIDPrefix + "-" +
                    $ci.data("nextID");
                $ci.trigger("increase-next-id");

                let $childCI = $(this);
                let cl = thisClassInstance.getRelatedContentLoader(
                    $childCI.attr("data-key"), parentArr
                );
                cl.loadContentInstance(
                    $childCI, newUniqueIDPrefix, newData, newParentArr
                );
            });

        len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.outwardCallbacks[i];
            callback($ci, uniqueIDPrefix, data, parentArr);
        }

        // $ci.addClass("loaded");
    }

    getRelatedContentLoader(contentKey, parentArr) {
        var ret = "";
        let len = this.childLoaders.length;
        for (let i = 0; i < len; i++) {
            if (this.childLoaders[i].contentKey === contentKey) {
                ret = this.childLoaders[i];
                break;
            }
        }
        if (ret === "") {
            let parentArrLen = parentArr.length;
            if (parentArrLen === 0) {
                throw (
                    "ContentLoader.getRelatedContentLoader(): " +
                    'no content loader found with content key "' +
                    contentKey + '"'
                );
            }
            let parent = parentArr[parentArr.length - 1];
            ret = parent.getRelatedContentLoader(
                contentKey, parentArr.slice(0, -1)
            );
        }
        return ret;
    }

    loadAfter($obj, uniqueIDPrefix, data, parentArr) {
        $obj.after(getStartAndEndMarkersHTML(this.contentKey));
        let $ci = $obj.next();
        this.loadContentInstance($ci, uniqueIDPrefix, data, parentArr);
    }
    loadBefore($obj, uniqueIDPrefix, data, parentArr) {
        $obj.before(getStartAndEndMarkersHTML(this.contentKey));
        let $ci = $obj.prev().prev();
        this.loadContentInstance($ci, uniqueIDPrefix, data, parentArr);
    }
    loadAppended($obj, uniqueIDPrefix, data, parentArr) {
        $obj.append(getStartAndEndMarkersHTML(this.contentKey));
        let $ci = $obj.children(':last-child').prev();
        this.loadContentInstance($ci, uniqueIDPrefix, data, parentArr);
    }
    loadPrepended($obj, uniqueIDPrefix, data, parentArr) {
        $obj.prepend(getStartAndEndMarkersHTML(this.contentKey));
        let $ci = $obj.children(':first-child');
        this.loadContentInstance($ci, uniqueIDPrefix, data, parentArr);
    }
}


export function getContentChildren($ci, id, selector) {
    return $ci.nextUntil('#' + id + '_end')
        .filter(selector ?? '*');
}
export function getContentDescendents($ci, id, selector) {
    return $ci.nextUntil('#' + id + '_end').find('*').addBack()
        .filter(selector ?? '*');
}
export function getCIChild($ci, id, index) {
    return $ci.nextUntil('#' + id + '_end').find('*').addBack()
        .filter('#' + id + '-' + index);
}
export function getCIChildren($ci, id, selector) {
    return $ci.nextUntil('#' + id + '_end').find('*').addBack()
    .filter('template.CI')
        .filter(selector ?? '*');
}
export function getCIDescendents($ci, id, selector) {
    return $ci.nextUntil('#' + id + '_end').find('*').addBack()
        .filter('template.CI')
        .filter(selector ?? '*');
}
export function getCIParent($obj) {
    return $obj.closest('template.CI');
}

export function getFirstCIAncestor($obj, selector) {
    return $obj.parents('template.CI').filter(selector ?? '*').first();
}
