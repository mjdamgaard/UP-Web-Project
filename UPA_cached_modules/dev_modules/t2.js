
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
        cssRules,
        inwardCallbacks, outwardCallbacks,
        childCLs,
        modSignals,
    ) {
        this.contentKey = contentKey;
        // this.tagName = tagName;
        // this.attributes = attributes ?? {};
        this.html = convertHTMLTemplate(htmlTemplate);
        this.parentCL = parentCL;
        if (typeof parentCL !== "undefined") {
            parentCL.childCLs.push(this);
        }
        this.childCLs = childCLs ?? [];
        this.cssRules = cssRules ?? [];
        this.cssRulesAreAdded = false;
        this.inwardCallbacks = inwardCallbacks ?? [];
        this.outwardCallbacks = outwardCallbacks ?? [];
        this.modSignals = modSignals ?? [];
        // this.dynamicData can be used for storing arbritary data (primitive
        // data types and objects), including data necessary to ensure unique
        // ids (even accross several, distant-related CIs).
        this.dynamicData = {};
    }

    set htmlTemplate(htmlTemplate) {
        this.html = convertHTMLTemplate(htmlTemplate);
    }
    get htmlTemplate() {
        return this.html; // no need to convert back here.
    }


    loadAndReplacePlaceholder($placeholder, contextData, returnData) {
        // first insert the new CI after $placeholder.
        $placeholder.after(this.html);
        let $ci = $placeholder.next();
        // copy all classes from $placeholder onto the new CI, except of course
        // for the "placeholder" class.
        let existingClasses = $placeholder.attr("class")
            .replaceAll("placeholder", "");
        $ci.addClass(existingClasses)
            .addClass("CI")
            .addClass(this.contentKey);
        // copy the "localData" object from placeholder to onto the new CI, or
        // initialize a new one if the placeholder does not hold any.
        $ci.data("localData", $placeholder.data("localData") ?? {});
        // if the the "localData" object does not contain a content key already
        // (from a decorating CL), set the (outer) content key of this CI as
        // the one of this CL.
        $ci.data("localData").contentKey ??= this.contentKey;
        // also initialize an "afterDecCallbacks" array to use below.
        $ci.data("localData").afterDecCallbacks ??= [];

        // store the context data on the CI.
        $ci.data("contextData", Object.assign({}, contextData ?? {}));
        // apply all the inward callbacks, which can change the initial HTML,
        // as well as the contextData, namely the data stored at
        // $ci.data("contextData"), and change the localData input, which will
        // be stored on the CI before the outward callbacks are called.
        let len = this.inwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            this.inwardCallbacks[i]($ci);
        }
        // read of the now potentially changed context data for handing it on
        // to any child CIs.
        var childContextData = $ci.data("contextData");

        // if the this.cssRules has not yet been added to the document
        // head, call addCSSRulesToDocument() to do so.
        if (this.cssRulesAreAdded == false) {
            this.addCSSRulesToDocument()
            this.cssRulesAreAdded = true;
        }

        // load all the descendent CIs.
        var childReturnData = {};
        let thisCL = this;
        $ci.find('*').addBack()
            .filter('template.placeholder')
            .each(function() {
                let $childCI = $(this);
                let childContentKey = $childCI.attr("data-key");
                let cl = thisCL.getRelatedContentLoader(childContentKey);
                cl.loadAndReplacePlaceholder(
                    $childCI, childContextData, childReturnData
                );
            });
        // in case $ci was a placeholder element, which will then be have been
        // removed at this point, redefine it as the new CI element.
        $ci = $placeholder.next();
        // remove the placeholder template element.
        $placeholder.remove();

        // apply all the outward callbacks (after the inner content is loaded).
        // (Since $ci is no longer in danger of being replaced, these callbacks
        // are now also free to set data and events for the CI, as weel as to
        // anything alse with the now loaded CI children.)
        len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            this.outwardCallbacks[i]($ci, childReturnData, returnData);
        }

        // check if this CI is not decorated by a parent (if the contentKey
        // property of $ci.data("localData") is the same as this.contentKey),
        // and if so, run any "afterDecCallbacks" that a child decorated by
        // this CI might have stored.
        let localData = $ci.data("localData");
        if (localData.contentKey === this.contentKey) {
            let len = localData.afterDecCallbacks.length;
            for (let i = 0; i < len; i++) {
                localData.afterDecCallbacks[i]($ci);
            }
        }
    }

    getRelatedContentLoader(contentKey) {
        // if contentKey is that of this CL, return this CL.
        if (this.contentKey === contentKey) {
            return this;
        }
        // else, first look for the content key in all the child CLs.
        let len = this.childCLs.length;
        for (let i = 0; i < len; i++) {
            if (this.childCLs[i].contentKey === contentKey) {
                return this.childCLs[i];
            }
        }
        // if no matching child CL is found, go up to the parent CL and repeat
        // the process recursively, or throw and error this is the root CL.
        if (typeof this.parentCL === "undefined") {
            throw (
                "ContentLoader.getRelatedContentLoader(): " +
                'no content loader found with content key "' +
                contentKey + '"'
            );
        }
        return this.parentCL.getRelatedContentLoader(contentKey);
    }


    loadAfter($obj, contentKey, contextData, returnData) {
        returnData = returnData ?? {};
        let cl = this.getRelatedContentLoader(contentKey)
        $obj.after(getPlaceholderTemplateTag(cl.contentKey));
        let $placeholder = $obj.next();
        cl.loadAndReplacePlaceholder($placeholder, contextData, returnData);
    }
    loadBefore($obj, contentKey, contextData, returnData) {
        returnData = returnData ?? {};
        let cl = this.getRelatedContentLoader(contentKey)
        $obj.before(getPlaceholderTemplateTag(cl.contentKey));
        let $placeholder = $obj.prev();
        cl.loadAndReplacePlaceholder($placeholder, contextData, returnData);
    }
    loadAppended($obj, contentKey, contextData, returnData) {
        returnData = returnData ?? {};
        let cl = this.getRelatedContentLoader(contentKey)
        $obj.append(getPlaceholderTemplateTag(cl.contentKey));
        let $placeholder = $obj.children(':last-child');
        cl.loadAndReplacePlaceholder($placeholder, contextData, returnData);
    }
    loadPrepended($obj, contentKey, contextData, returnData) {
        returnData = returnData ?? {};
        let cl = this.getRelatedContentLoader(contentKey)
        $obj.prepend(getPlaceholderTemplateTag(cl.contentKey));
        let $placeholder = $obj.children(':first-child');
        cl.loadAndReplacePlaceholder($placeholder, contextData, returnData);
    }

    addCSSRulesToDocument() {
        let len = this.cssRules.length;
        for (let i = 0; i < len; i++) {
            // get the tail end of the rule which is supposed to be prepended
            // with this CL's and its ancestor CLs' CI classes (which are equal
            // to their content keys).
            var ruleTail;
            let cssRule = this.cssRules[i].trim();
            if (/^&?[^&\{\}]*\{[^&\{\}]*\}$/.test(cssRule)) {
                // if the rule starts with a &, let the rule tail be the rest.
                if (cssRule.substring(0, 1) === "&") {
                    ruleTail = cssRule.substring(1);
                // if it is a rule that does not start with "&", prepend a
                // descendent combinator (" ") to make the rule tail.
                } else {
                    ruleTail = " " + cssRule;
                }
            // if cssRule is instead a CSS declaration list, wrap it in "{}"
            // for the rule tail.
            } else if (/^[^&\{\}]*$/.test(cssRule)) {
                ruleTail = " {" + cssRule + "}";
            // else throw an error.
            } else {
                throw (
                    "ContentLoader.addCSSRulesToDocument(): cssRules " +
                     "must each be single rules with no nested rules " +
                     "inside, perhaps beginning with a '&', or they must be " +
                     "a CSS declaration list (but received '" + cssRule + "')"
                );
            }
            // construct the resulting rule to append to the document head by
            // prepending CI classes to the rule tail.
            let rule = this.getCIClassSelector() + ruleTail;
            $('html > head').append(
                '<style class="CI-style">' + rule + '</style>'
            );
        }
    }
    getCIClassSelector() {
        return (typeof this.parentCL === "undefined") ?
            ".CI." + this.contentKey :
            this.parentCL.getCIClassSelector() + " .CI." + this.contentKey;
    }
}
