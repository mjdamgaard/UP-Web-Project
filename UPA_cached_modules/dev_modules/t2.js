
/* This module ...
 **/

// (Here 'CI' stands for 'content instance,' which are the live HTML
// elements, and CL stands for 'content loader' (instances of this
// class), which are responsible for loading and inserting the CIs.)

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
        parentCL,
        inwardCallbacks, outwardCallbacks,
        dataModifierFun,
        childCLs, modSignals,
    ) {
        this.contentKey = contentKey;
        // this.tagName = tagName;
        // this.attributes = attributes ?? {};
        this.html = convertHTMLTemplate(htmlTemplate);
        this.parentCL = parentCL;
        if (typeof parentCL !== "undefined") {
            parentCL.childCLs.push(this);
        }
        this.inwardCallbacks = inwardCallbacks ?? [];
        this.outwardCallbacks = outwardCallbacks ?? [];
        this.childCLs = childCLs ?? [];
        this.modSignals = modSignals ?? [];
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


    loadAndReplacePlaceholder($placeholder, data) {
        // initialize some variables to use when loading the inner CIs.
        let thisClassInstance = this;
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

        // apply all the inward callbacks (which can change the initial HTML
        // and also query and change dynamicData properties of the parent ).
        let len = this.inwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.inwardCallbacks[i];
            callback($ci, data);
        }

        // load all the descendent CIs.
        $ci.find('*').addBack()
            .filter('template.placeholder')
            .each(function() {
                let $childCI = $(this);
                let childContentKey = $childCI.attr("data-key");
                let cl = thisClassInstance.getRelatedContentLoader(
                    childContentKey
                );
                cl.loadAndReplacePlaceholder($childCI, newData);
            });

        // in case $ci was a placeholder tag which is removed again at this
        // point, redefine it as the new CI element.
        $ci = $placeholder.next();
        // apply all the outward callbacks (after the inner content is loaded).
        len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            let callback = this.outwardCallbacks[i];
            callback($ci, data);
        }
        // lastly, remove the placeholder template tag.
        $placeholder.remove();
    }

    getRelatedContentLoader(contentKey) {
        var ret;
        // first look for the content key in all the child CLs.
        let len = this.childCLs.length;
        for (let i = 0; i < len; i++) {
            if (this.childCLs[i].contentKey === contentKey) {
                return this.childCLs[i];
            }
        }
        // if no matching child CL is found, go up to the parent CL and repeat
        // the process recursively, or throw error if this CL has no parent.
        if (typeof this.parentCL === "undefined") {
            throw (
                "ContentLoader.getRelatedContentLoader(): " +
                'no content loader found with content key "' +
                contentKey + '"'
            );
        }
        return this.parentCL.getRelatedContentLoader(contentKey);
    }

    // (Inserting a simple '<div></div>' in the following functions could also
    // work with the current implementation of loadAndReplacePlaceholder(),
    // but let's just stick to the following for now.)
    loadAfter($obj, data) {
        $obj.after(getPlaceholderTemplateTag(this.contentKey));
        let $placeholder = $obj.next();
        this.loadAndReplacePlaceholder($placeholder, data);
    }
    loadBefore($obj, data) {
        $obj.before(getPlaceholderTemplateTag(this.contentKey));
        let $placeholder = $obj.prev();
        this.loadAndReplacePlaceholder($placeholder, data);
    }
    loadAppended($obj, data) {
        $obj.append(getPlaceholderTemplateTag(this.contentKey));
        let $placeholder = $obj.children(':last-child');
        this.loadAndReplacePlaceholder($placeholder, data);
    }
    loadPrepended($obj, data) {
        $obj.prepend(getPlaceholderTemplateTag(this.contentKey));
        let $placeholder = $obj.children(':first-child');
        this.loadAndReplacePlaceholder($placeholder, data);
    }
}
