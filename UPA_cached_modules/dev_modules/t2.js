
/* This module ...
 **/


export function getStartAndEndMarkersHTML(key) {
    return (
        '<template class="startMarker" data-key="' + key + '"></template>' +
        '<template class="endMarker" data-key="' + key + '"></template>'
    );
}
export function convertHTMLTemplate(htmlTemplate) {
    return htmlTemplate.replaceALL(
        /<<[A-Z\$][\w]*>>/,
        function(str) {
            let key = str.slice(2, -2);
            return getStartAndEndMarkersHTML(key);
        }
    );
}


export class ContentLoader {
    constructor(
        // these first two variables should not be undefined/null.
        contentKey, htmlTemplate,
        childLoaders, modSignals
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
    }

    set htmlTemplate(htmlTemplate) {
        this.html = convertHTMLTemplate(htmlTemplate);
    }
    get htmlTemplate() {
        return this.html; // no need to convert back here.
    }

    loadAfterStartMarker($startMarker, uniqueIDPrefix, data, parentArr) {
        parentArr = parentArr ?? [];

        $startMarker.attr("id", uniqueIDPrefix + "-start");
        $startMarker.next().attr("id", uniqueIDPrefix + "-end");

        $startMarker.data("nextID", 0)
            .on("increase-next-id", function() {
                let $this = $(this);
                $this.data("nextID", $this.data("nextID") + 1);
            });

        $startMarker.after(this.html);

        let firstElement = $startMarker.next();
        let len = this.inwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.inwardCallbacks[i];
            callback(firstElement, uniqueIDPrefix, data, parentArr);
        }

        let thisClass = this;
        let newParentArr = parentArr.concat([this]);
        let newData = this.dataModifierFun(data);
        $startMarker.nextUntil('#' + uniqueIDPrefix + "-end")
            .find('*')
            .addBack()
            .filter('template .startMarker')
            .each(function() {
                let newUniqueIDPrefix = uniqueIDPrefix + "-" +
                    $startMarker.data("nextID");
                $startMarker.trigger("increase-next-id");

                $childStartMarker = $(this);
                let cl = thisClass.getRelatedContentLoader(
                    $childStartMarker.attr("data-key"), parentArr
                );
                cl.loadAfterStartMarker(
                    $childStartMarker, newUniqueIDPrefix, newData, newParentArr
                );
            });

        let firstElement = $startMarker.next();
        let len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.outwardCallbacks[i];
            callback(firstElement, uniqueIDPrefix, data, parentArr);
        }

        $startMarker.addClass("loaded");
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
        let $startMarker = $obj.next();
        this.loadAfterStartMarker(
            $startMarker, uniqueIDPrefix, data, parentArr
        );
    }
    loadBefore($obj, uniqueIDPrefix, data, parentArr) {
        $obj.before(getStartAndEndMarkersHTML(this.contentKey));
        let $startMarker = $obj.prev().prev();
        this.loadAfterStartMarker(
            $startMarker, uniqueIDPrefix, data, parentArr
        );
    }
    loadAppended($obj, uniqueIDPrefix, data, parentArr) {
        $obj.append(getStartAndEndMarkersHTML(this.contentKey));
        let $startMarker = $obj.children(':last-child').prev();
        this.loadAfterStartMarker(
            $startMarker, uniqueIDPrefix, data, parentArr
        );
    }
    loadPrepended($obj, uniqueIDPrefix, data, parentArr) {
        $obj.prepend(getStartAndEndMarkersHTML(this.contentKey));
        let $startMarker = $obj.children(':first-child');
        this.loadAfterStartMarker(
            $startMarker, uniqueIDPrefix, data, parentArr
        );
    }
}
