
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
        dataSetterCallbacks,
        inwardCallbacks, outwardCallbacks,
        afterDecCallbacks,
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
        this.dataSetterCallbacks = dataSetterCallbacks ?? [];
        this.inwardCallbacks = inwardCallbacks ?? [];
        this.outwardCallbacks = outwardCallbacks ?? [];
        this.afterDecCallbacks = afterDecCallbacks ?? [];
        this.modSignals = modSignals ?? {};
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

    // this.modSignals and this.dynamicData are also meant to be treated as
    // public properties, like this.htmlTemplate. (The rest of the fields are
    // also public in principle, but not really meant for setting and getting
    // except in special cases where one needs to do some advanced
    // restructuring and/or repurposing.)

    loadAfter($obj, contentKey, data, returnData) {
        returnData = returnData ?? {};
        let cl = this.getRelatedContentLoader(contentKey)
        $obj.after(getPlaceholderTemplateTag(cl.contentKey));
        let $placeholder = $obj.next();
        cl.loadAndReplacePlaceholder($placeholder, data, returnData);
    }
    loadBefore($obj, contentKey, data, returnData) {
        returnData = returnData ?? {};
        let cl = this.getRelatedContentLoader(contentKey)
        $obj.before(getPlaceholderTemplateTag(cl.contentKey));
        let $placeholder = $obj.prev();
        cl.loadAndReplacePlaceholder($placeholder, data, returnData);
    }
    loadAppended($obj, contentKey, data, returnData) {
        returnData = returnData ?? {};
        let cl = this.getRelatedContentLoader(contentKey)
        $obj.append(getPlaceholderTemplateTag(cl.contentKey));
        let $placeholder = $obj.children(':last-child');
        cl.loadAndReplacePlaceholder($placeholder, data, returnData);
    }
    loadPrepended($obj, contentKey, data, returnData) {
        returnData = returnData ?? {};
        let cl = this.getRelatedContentLoader(contentKey)
        $obj.prepend(getPlaceholderTemplateTag(cl.contentKey));
        let $placeholder = $obj.children(':first-child');
        cl.loadAndReplacePlaceholder($placeholder, data, returnData);
    }

    addCallback(method, callback) {
        if (typeof callback === "undefined") {
            callback = method;
            method = "outward";
        }
        switch (method) {
            case "outward":
                this.outwardCallbacks.push(callback);
                break;
            case "inward":
                this.inwardCallbacks.push(callback);
                break;
            case "data":
                this.dataSetterCallbacks.push(callback);
                break;
            case "afterDec":
                this.afterDecCallbacks.push(callback);
                break;
            default:
                throw (
                    'ContentLoader.addCallback(): Unrecognized method: "' +
                    method + '"'
                );
        }
    }

    addCSS(css) {
        this.cssRules.push(css);
    }


    /* Semi-private methods (not meant as much for public use) */

    loadAndReplacePlaceholder($placeholder, data, returnData) {
        data ??= {};
        // first insert the new CI after $placeholder.
        $placeholder.after(this.html);
        let $ci = $placeholder.next();
        // copy all classes from $placeholder onto the new CI, except of course
        // for the "placeholder" class.
        let existingClasses = $placeholder.attr("class")
            .replaceAll("placeholder", "").replaceAll("  ", " ");
        $ci.addClass(existingClasses)
            .addClass("CI")
            .addClass(this.contentKey);
        // store a reference to the data (input) object on the CI.
        $ci.data("data", data);
        // if the the placeholder does not contain a "contentKey" already
        // (from a decorating CL), set the (outer) content key of this CI as
        // the one of this CL.
        $ci.data(
            "contentKey",
            $placeholder.data("contentKey") ?? this.contentKey
        );
        // also copy any and all "afterDecCallbacks" from the placeholder, and
        // all afterDecCallbacks of this CL into this array as well.
        $ci.data(
            "afterDecCallbacks",
            this.afterDecCallbacks.concat(
                $placeholder.data("afterDecCallbacks") ?? []
            )
        );

        // apply all the data setter callbacks, which can change the "data"
        // object, namely the data stored as a reference at $ci.data("data").
        // If this array is empty, the child CIs will get a reference to the
        // same "data" object as their parent (this one).
        let len = this.dataSetterCallbacks.length;
        var childData = data;
        for (let i = 0; i < len; i++) {
            childData = this.dataSetterCallbacks[i](data, childData) ??
                childData;
        }

        // apply any and all of the inward callbacks, which can change the
        // initial HTML of the CI, and also make changes to the data object in
        // priciple, but not too much else (they should generally NOT be used
        // for setting up events).
        len = this.inwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            this.inwardCallbacks[i]($ci, data);
        }

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
                    $childCI, childData, childReturnData
                );
            });
        // in case $ci was a placeholder element, which will then be have been
        // removed at this point, redefine it as the new CI element.
        $ci = $placeholder.next();
        // remove the placeholder template element.
        $placeholder.remove();

        // apply all the outward callbacks (after the inner content is loaded).
        // (Since $ci is no longer in danger of being replaced, these callbacks
        // are now also free to set data and events for the CI, as well as
        // anything else with the now loaded CI children.)
        len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            this.outwardCallbacks[i]($ci, data, childReturnData, returnData);
        }

        // check if this CI is not decorated by a parent (if the contentKey
        // property of of the "data" object is the same as this.contentKey),
        // and if so, run any "afterDecCallbacks" that a child decorated by
        // this CI might have stored.
        if ($ci.data("contentKey") === this.contentKey) {
            let afterDecCallbacks = $ci.data("afterDecCallbacks")
            let len = afterDecCallbacks.length;
            for (let i = 0; i < len; i++) {
                afterDecCallbacks[i]($ci, data, childReturnData, returnData);
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
