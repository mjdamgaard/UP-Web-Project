
/**
 * This module ...
 */

// (Here 'CI' stands for 'content instance,' which are the live HTML
// elements, and CL stands for 'content loader' (instances of this
// class), which are responsible for loading and inserting the CIs.)

export function getPlaceholderTemplateTag(contentKey, dataKey) {
    return (
        '<template class="placeholder" ' +
            'data-content-key="' + (contentKey ?? '') + '" ' +
            'data-data-key="' + (dataKey ?? '') + '" ' +
        '></template>'
    );
}
export function convertHTMLTemplate(htmlTemplate) {
    return htmlTemplate.replaceAll(
        // /<<[A-Z][\w\-]*( data(\.[\w\$])*(\[\.\.\.\])?)?>>/g,
        /<<[A-Z][\w\-]*( data[\.\w\$\[\]]*)?>>/g,
        function(str) {
            let keyStr = str.slice(2, -2);
            let spaceIndex = keyStr.indexOf(" ");
            if (spaceIndex === -1) {
                return getPlaceholderTemplateTag(keyStr);
            } else {
                return getPlaceholderTemplateTag(
                    keyStr.substring(0, spaceIndex),
                    keyStr.substring(spaceIndex + 5) // leaves out " data".
                );
            }
        }
    );
}


export class ContentLoader {
    constructor(
        // these first two variables should not be undefined/null.
        contentKey, htmlTemplate,
        parentCL,
        cssRules,
        dataSetterCallbacks, outwardCallbacks, afterDecCallbacks,
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

    loadReplaced($placeholder, contentKey, data, returnData) {
        let cl;
        if (typeof contentKey === "object") {
            data = contentKey.data ?? {};
            cl = contentKey.cl ?? this.getRelatedCL(contentKey.contentKey);
            returnData = data ?? {};
        } else {
            if (contentKey === "self") {
                contentKey = this.contentKey;
            }
            data = data ?? {};
            cl = this.getRelatedCL(contentKey);
            returnData = returnData ?? {};
        }
        cl.loadAndReplacePlaceholder($placeholder, data, returnData);
    }
    loadAfter($obj, contentKey, data, returnData) {
        let $placeholder = $obj
            .after(getPlaceholderTemplateTag(contentKey))
            .next();
        this.loadReplaced($placeholder, contentKey, data, returnData);
    }
    loadBefore($obj, contentKey, data, returnData) {
        let $placeholder = $obj
            .before(getPlaceholderTemplateTag(contentKey))
            .prev();
        this.loadReplaced($placeholder, contentKey, data, returnData);
    }
    loadAppended($obj, contentKey, data, returnData) {
        let $placeholder = $obj
            .append(getPlaceholderTemplateTag(contentKey))
            .children(':last-child');
        this.loadReplaced($placeholder, contentKey, data, returnData);
    }
    loadPrepended($obj, contentKey, data, returnData) {
        let $placeholder = $obj
            .prepend(getPlaceholderTemplateTag(contentKey))
            .children(':first-child');
        this.loadReplaced($placeholder, contentKey, data, returnData);
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

    getRelatedCL(contentKey) {
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
        // the process recursively, or return a CL dummy if this is the root CL.
        if (typeof this.parentCL === "undefined") {
            console.warn(
                "ContentLoader.getRelatedCL(): " +
                'no content loader found with content key "' +
                contentKey + '"'
            );
            return new ContentLoader(
                contentKey,
                '<template class="Not-implemented-yet"></template>',
            );
        }
        return this.parentCL.getRelatedCL(contentKey);
    }


    /* Semi-private methods (not meant as much for public use) */

    loadAndReplacePlaceholder($placeholder, data, returnData) {
        // console.log(this.contentKey);console.log(data);
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

        // load all the descendent CIs.
        var childReturnData = {};
        let thisCL = this;
        $ci.find('*').addBack()
            .filter('template.placeholder')
            .each(function() {
                let $childCI = $(this);
                let childContentKey = $childCI.attr("data-content-key");
                let childDataKey = $childCI.attr("data-data-key");
                let cl = thisCL.getRelatedCL(childContentKey);
                if (childDataKey === "") {
                    // let childData be the new data input in a recursive call
                    // to loadAndReplacePlaceholder() (now with a new CL).
                    cl.loadAndReplacePlaceholder(
                        $childCI, childData, childReturnData
                    );
                } else if (/^(\.[\w\$]+)+(\[\.\.\.\])?$/.test(childDataKey)) {
                    // parse childDataKey of the path to a nested data object
                    // in childData to use for the new data input(s).
                    let dataKeyArray = childDataKey.replaceAll("[...]", "")
                        .split(".")
                        .slice(1); // since (".foo").split(".") == ["", "foo"].
                    var nestedChildData = childData;
                    let len = dataKeyArray.length;
                    for (let i = 0; i < len; i++) {
                        nestedChildData = nestedChildData[dataKeyArray[i]];
                    }
                    // if childDataKey does not end in "[...]", simply call
                    // cl.loadAndReplacePlaceholder() with the nestedChildData
                    // as the input data.
                    if (childDataKey.slice(-5) !== "[...]") {
                        cl.loadAndReplacePlaceholder(
                            $childCI, nestedChildData, childReturnData
                        );
                    // else, expect that nestedChildData is an array and load
                    // n CI children, where n is the length of the array, such
                    // that each child is given one of the data inputs held in
                    // the array. If the array is null/undefined, simply do not
                    // load any CI children, similar to what is done if the
                    // array is empty.
                } else {
                        var $nthChildCI = $childCI;
                        len = (nestedChildData ?? []).length;
                        for (let i = 0; i < len; i++) {
                            cl.loadAfter(
                                $nthChildCI, "self", nestedChildData[i],
                                childReturnData
                            );
                            $nthChildCI = $nthChildCI.next();
                        }
                        $childCI.remove();
                        // NOTE: One should not make decorator CLs of these list
                        // template keys. That is, do not use htmlTemplates of
                        // the form "<<Example data.example.example[...]>>";
                        // always make sure to have these list template keys
                        // nested (e.g. inside a <div></div>).
                    }
                } else {
                    throw (
                        "ContentLoader.loadAndReplacePlaceholder(): " +
                        'ill-formed childDataKey: "' + childDataKey +
                        '" (in ' + childContentKey + ')'
                    );
                }
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

        // if the this.cssRules has not yet been added to the document
        // head, call addCSSRulesToDocument() to do so.
        if (this.cssRulesAreAdded == false) {
            this.addCSSRulesToDocument();
        }
    }


    addCSSRulesToDocument() {
        let len = this.cssRules.length;
        for (let i = 0; i < len; i++) {
            let rule = this.cssRules[i].trim();
            // if rule is a declaration list, wrap it in "& {...}".
            if (/^[^&\{\}]*$/.test(rule)) {
                rule = "& {" + rule + "}";
            }
            // if rule is a declaration list inside curly braces with no
            // selector, append "& " to it.
            if (/^\{[^&\{\}]*\}$/.test(rule)) {
                rule = "& " + rule;
            }
            if (!/^[^\{\}]*\{[^&\{\}]*\}$/.test(rule)) {
                throw (
                    "ContentLoader.addCSSRulesToDocument(): cssRules " +
                     "must either be single rules or single CSS declaration " +
                     "lists (but received '" + this.cssRules[i] + "')"
                );
            }
            // replace all &'s in the selector with the CLs automatic CI class.
            rule = rule.replaceAll("&", this.getCIClassSelector());
            // append the rule to the document head.
            $('html > head').append(
                '<style class="CI-style">' + rule + '</style>'
            );
        }
        // finally set this.cssRulesAreAdded = true such that subsequently
        // loaded CLs will not also add these CSS rules.
        this.cssRulesAreAdded = true;
    }
    getCIClassSelector() {
        return (typeof this.parentCL === "undefined") ?
            ".CI." + this.contentKey :
            this.parentCL.getCIClassSelector() + " .CI." + this.contentKey;
    }
}
