
/* This module ...
 **/


export function getPlaceholderTemplateTag(key) {
    return '<template class="placeholder" data-key="' + key + '"></template>';
}
export function convertHTMLTemplate(htmlTemplate) {
    return htmlTemplate.replaceAll(
        /<<[A-Z][\w\-]*>>/g,
        function(str) {
            let key = str.slice(2, -2);
            return getPlaceholderTemplateTag(key);
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


    loadAndReplacePlaceholder($placeholder, data, parentCLArr) {
        // (Here 'CI' stands for 'content instance,' which are the live HTML
        // elements, and CL stands for 'content loader' (instances of this
        // class), which are responsible for loading and inserting the CIs.)

        // initialize some variables to use when loading the inner CIs.
        parentCLArr = parentCLArr ?? [];
        let thisClassInstance = this;
        let newParentCLArr = parentCLArr.concat([thisClassInstance]);
        let newData = this.dataModifierFun(data);

        // first insert the new CI after $placeholder.
        $placeholder.after(this.html);
        let $ci = $placeholder.next();
        // copy all classes from $placeholder onto the new CI, except of coure
        // for the "placeholder" class.
        let existingClasses = $placeholder.removeClass("placeholder")
            .attr("class");
        $ci.addClass(existingClasses).addClass("CI")
            .addClass(this.contentKey);
        // // remove the placeholder template tag.
        // $placeholder.remove();

        // apply all the inward callbacks (which can change the initial HTML
        // and also query and change dynamicData properties of the parent ).
        let len = this.inwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.inwardCallbacks[i];
            callback($ci, data, parentCLArr);
        }

        // load all the descendent CIs.
        $ci.find('*').addBack()
            .filter('template.placeholder')
            .each(function() {
                let $childCI = $(this);
                let childContentKey = $childCI.attr("data-key");
                let cl = thisClassInstance.getRelatedContentLoader(
                    childContentKey, parentCLArr
                );
                cl.loadAndReplacePlaceholder($childCI, newData, newParentCLArr);
            });

        // apply all the outward callbacks (after the inner content is loaded).
        $ci = $placeholder.next();
        len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.outwardCallbacks[i];
            $ci.before("Heelloooooo");
            $ci.filter('.CI.CategoryColumn').remove();
            callback($ci, data, parentCLArr);
        }
        $placeholder.remove();
    }

    getRelatedContentLoader(contentKey, parentCLArr) {
        var ret = "";
        let len = this.childLoaders.length;
        for (let i = 0; i < len; i++) {
            if (this.childLoaders[i].contentKey === contentKey) {
                ret = this.childLoaders[i];
                break;
            }
        }
        if (ret === "") {
            let parentCLArrLen = parentCLArr.length;
            if (parentCLArrLen === 0) {
                throw (
                    "ContentLoader.getRelatedContentLoader(): " +
                    'no content loader found with content key "' +
                    contentKey + '"'
                );
            }
            let parent = parentCLArr[parentCLArr.length - 1];
            ret = parent.getRelatedContentLoader(
                contentKey, parentCLArr.slice(0, -1)
            );
        }
        return ret;
    }

    // (Inserting a simple '<div></div>' in the following functions could also
    // work with the current implementation of loadAndReplacePlaceholder(),
    // but let's just stick to the following for now.)
    loadAfter($obj, data, parentCLArr) {
        $obj.after(getPlaceholderTemplateTag(this.contentKey));
        let $placeholder = $obj.next();
        this.loadAndReplacePlaceholder($placeholder, data, parentCLArr);
    }
    loadBefore($obj, data, parentCLArr) {
        $obj.before(getPlaceholderTemplateTag(this.contentKey));
        let $placeholder = $obj.prev();
        this.loadAndReplacePlaceholder($placeholder, data, parentCLArr);
    }
    loadAppended($obj, data, parentCLArr) {
        $obj.append(getPlaceholderTemplateTag(this.contentKey));
        let $placeholder = $obj.children(':last-child');
        this.loadAndReplacePlaceholder($placeholder, data, parentCLArr);
    }
    loadPrepended($obj, data, parentCLArr) {
        $obj.prepend(getPlaceholderTemplateTag(this.contentKey));
        let $placeholder = $obj.children(':first-child');
        this.loadAndReplacePlaceholder($placeholder, data, parentCLArr);
    }
}
