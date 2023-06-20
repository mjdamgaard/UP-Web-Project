
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
        /<<[A-Z][\w\-]*( data[\.\w\$\[\]:\-]*)?>>/g,
        function(str) {
            let keyStr = str.slice(2, -2);
            let spaceIndex = keyStr.indexOf(" ");
            if (spaceIndex === -1) {
                return getPlaceholderTemplateTag(keyStr);
            } else {
                return getPlaceholderTemplateTag(
                    keyStr.substring(0, spaceIndex),
                    keyStr.substring(spaceIndex + 1)
                );
            }
        }
    );
}

export class ChildData {
    constructor(parentData, obj) {
        if (typeof obj !== "undefined") {
            Object.assign(this, obj);
        }
        this.parentData = parentData;
    }

    get(key, searchHeight) {
        if (typeof this[key] !== "undefined") {
            return this[key];
        } else {
            return this.getFromAncestor(key, searchHeight);
        }
    }

    getFromAncestor(key, searchHeight) {
        if (searchHeight === 0) {
            return null;
        } else if (typeof this.parentData === "undefined") {
            return null;
        } else if (typeof this.parentData[key] !== "undefined") {
            return this.parentData[key];
        } else if (typeof this.parentData.getFromAncestor === "undefined") {
            return null;
        } else {
            if (typeof searchHeight !== "number") {
                searchHeight = -1;
            }
            return this.parentData.getFromAncestor(key, searchHeight - 1);
        }
    }

    copyFromAncestor(key, searchHeight) {
        if (typeof key === "string") {
            return this[key] = this.getFromAncestor(key, searchHeight);
        }
        // else, assume that key is an array of keys to be copied.
        let len = key.length;
        for (let i = 0; i < len; i++) {
            this[key[i]] = this.getFromAncestor(key[i], searchHeight);
        }
    }
}




export class ContentLoader {
    constructor(
        // these first two variables should not be undefined/null.
        contentKey, htmlTemplate,
        parentCL, // this parameter should also generally be given, except in
        // the case of an outer CL (without a parent).
    ) {
        this.contentKey = contentKey;
        // this.tagName = tagName;
        // this.attributes = attributes ?? {};
        this.html;
        this.parentCL = parentCL ?? false;
        if (parentCL) {
            parentCL.childCLs.push(this);
        }
        this.decorateeContentKey = false;
        this.decorateeCL = false;
        this.childCLs = [];
        this.dataSetterCallbacks = [];
        this.outwardCallbacks = [];
        this.afterDecCallbacks = [];
        this.inwardCSSRules = [];
        this.outwardCSSRules = [];
        this.inwardCSSRulesAreAdded = false;
        this.outwardCSSRulesAreAdded = false;
        // this.globalData can be used for storing arbritary data (primitive
        // data types and objects), including data necessary to ensure unique
        // ids (even accross several, distant-related CIs).
        this.globalData = {};

        // set this.html via the setter below.
        this.htmlTemplate = htmlTemplate;
    }

    set htmlTemplate(htmlTemplate) {
        this.html = convertHTMLTemplate(htmlTemplate);
        // if htmlTemplate consists of only one content placeholder, then
        // record relevant content key in this.decorateeContentKey.
        if (/^<<[^<>]*>>$/.test(htmlTemplate)) {
            let keyStr = htmlTemplate.slice(2, -2);
            let spaceIndex = keyStr.indexOf(" ");
            if (spaceIndex === -1) {
                this.decorateeContentKey = keyStr;
            } else {
                this.decorateeContentKey =
                    keyStr.slice(0, keyStr.indexOf(" "));
            }
        }
    }
    get htmlTemplate() {
        return this.html; // no need to convert back here.
    }

    // this.globalData, like this.htmlTemplate, is also meant to be treated as
    // a public property. (The rest of the fields are also public in principle,
    // but not really meant for setting and getting except in special cases
    // where one needs to do some advanced restructuring and/or repurposing.)

    loadReplaced($placeholder, contentKey, parentData, returnData) {
        let cl;
        if (typeof contentKey === "object") {
            parentData = contentKey.data ?? {};
            cl = contentKey.cl ?? this.getRelatedCL(contentKey.contentKey);
            returnData = parentData ?? {};
        } else {
            if (contentKey === "self") {
                contentKey = this.contentKey;
            }
            parentData ??= {};
            cl = this.getRelatedCL(contentKey);
            returnData = returnData ?? {};
        }
        $placeholder.attr("class", "");
        cl.loadAndReplacePlaceholder($placeholder, parentData, returnData);
    }
    loadAfter($obj, contentKey, parentData, returnData) {
        let $placeholder = $obj
            .after(getPlaceholderTemplateTag(contentKey))
            .next();
        this.loadReplaced($placeholder, contentKey, parentData, returnData);
    }
    loadBefore($obj, contentKey, parentData, returnData) {
        let $placeholder = $obj
            .before(getPlaceholderTemplateTag(contentKey))
            .prev();
        this.loadReplaced($placeholder, contentKey, parentData, returnData);
    }
    loadAppended($obj, contentKey, parentData, returnData) {
        let $placeholder = $obj
            .append(getPlaceholderTemplateTag(contentKey))
            .children(':last-child');
        this.loadReplaced($placeholder, contentKey, parentData, returnData);
    }
    loadPrepended($obj, contentKey, parentData, returnData) {
        let $placeholder = $obj
            .prepend(getPlaceholderTemplateTag(contentKey))
            .children(':first-child');
        this.loadReplaced($placeholder, contentKey, parentData, returnData);
    }

    addCallback(method, callback, htmlTemplate) {
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
            case "append":
            case "prepend":
                // I'll continue this later, 'cause I need to figure out how
                // the data is propagated first..
                let selector = "";
                if (typeof htmlTemplate === "undefined") {
                    htmlTemplate = callback;
                } else {
                    selector = callback;
                }
                let html = convertHTMLTemplate(htmlTemplate);
                let thisCL = this;
                if (selector === "") {
                    this.outwardCallbacks.push(function($ci, data) {
                        $ci[method](html);
                        thisCL.loadDescendants($ci, data, {})
                    });
                } else {
                    this.outwardCallbacks.push(function($ci, data) {
                        $ci.find(selector)[method](html);
                        thisCL.loadDescendants($ci, data, {})
                    });
                }
                break;
            default:
                throw (
                    'ContentLoader.addCallback(): Unrecognized method: "' +
                    method + '"'
                );
        }
    }

    addCSS(method, css) {
        if (typeof css === "undefined") {
            css = method;
            method = "inward";
        }
        if (method === "inward") {
            this.inwardCSSRules.push(css);
        } else if (method === "outward") {
            this.outwardCSSRules.push(css);
        } else {
            throw (
                'ContentLoader.addCSS(): Unrecognized method: "' +
                method + '"'
            );
        }
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
        // if no match is found, either go to the parentCL and repeat the
        // process, or if the CL is a decorator, go to the decoratee CL
        // instead, which is assumed to always be a sibling or an ancestor of
        // the CL itself.
        if (this.decorateeContentKey) {
            // set the decoratee CL from the decorateeContentKey (if this has
            // not already been done).
            this.decorateeCL =
                this.parentCL.getRelatedCL(this.decorateeContentKey);
            this.decorateeContentKey = false;
        }
        if (this.decorateeCL) {
            return this.decorateeCL.getRelatedCL(contentKey);
        }
        if (this.parentCL) {
            return this.parentCL.getRelatedCL(contentKey);
        }
        // in the end if the algorithm halts on the outer CL, print a warning
        // and return a temporary "Not-implemented-yet" CL instead.
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


    /* Semi-private methods (not meant as much for public use) */

    loadAndReplacePlaceholder($placeholder, parentData, returnData) {
        console.log(this.contentKey);console.log(parentData); // (for debug.)
        parentData ??= {};
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
        // if the the placeholder does not contain a "contentKey" already
        // (from a decorating CL), set the (outer) content key of this CI as
        // the one of this CL.
        $ci.data(
            "contentKey",
            $placeholder.data("contentKey") ?? this.contentKey
        );

        // apply all the data setter callbacks, which can change the "data"
        // object, which will also be stored at $ci.data("data").
        let data = new ChildData(parentData);
        let len = this.dataSetterCallbacks.length;
        for (let i = 0; i < len; i++) {
            this.dataSetterCallbacks[i](data);
        }

        // if the this.inwardCSSRules has not yet been added to the document
        // head, call addCSSRulesToDocument() to do so.
        if (this.inwardCSSRulesAreAdded == false) {
            this.addCSSRulesToDocument(this.inwardCSSRules);
            this.inwardCSSRulesAreAdded = true;
        }


        // load all the descendent CIs.
        var childReturnData = {};
        this.loadDescendants($ci, data, childReturnData);


        // in case $ci was a placeholder element, which will then be have been
        // removed at this point, redefine it as the new CI element.
        $ci = $placeholder.next();
        // remove the placeholder template element.
        $placeholder.remove();
        // store a reference to the data object on the CI, unless a child
        // decorated by this CL has already done so.
        if (typeof $ci.data("data") === "undefined") {
            $ci.data("data", data);
        }

        // apply all the outward callbacks (after the inner content is loaded).
        // (Since $ci is no longer in danger of being replaced, these callbacks
        // are now also free to set data and events for the CI, as well as
        // anything else with the now loaded CI children.)
        len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            this.outwardCallbacks[i]($ci, data, childReturnData, returnData);
        }

        // if this CL has any after decoration callbacks, append them to a
        // property of the returnData object.
        returnData.afterDecCallbacks = (childReturnData.afterDecCallbacks ?? [])
            .concat(this.afterDecCallbacks);

        // check if this CI is not decorated by a parent (if the contentKey
        // property of of the "data" object is the same as this.contentKey),
        // and if so, run any "afterDecCallbacks" that a child decorated by
        // this CI might have stored.
        if ($ci.data("contentKey") === this.contentKey) {
            let afterDecCallbacks = returnData.afterDecCallbacks;
            let len = afterDecCallbacks.length;
            for (let i = 0; i < len; i++) {
                afterDecCallbacks[i]($ci, data, childReturnData, returnData);
            }
        }

        // if the this.outwardCSSRules has not yet been added to the document
        // head, call addCSSRulesToDocument() to do so.
        if (this.outwardCSSRulesAreAdded == false) {
            this.addCSSRulesToDocument(this.outwardCSSRules);
            this.outwardCSSRulesAreAdded = true;
        }
    }

    loadDescendants($ci, data, childReturnData) {
        let thisCL = this;
        $ci.find('*').addBack()
            .filter('template.placeholder')
            .each(function() {
                let $childCI = $(this);
                let childContentKey = $childCI.attr("data-content-key");
                let childDataKey = $childCI.attr("data-data-key");
                let cl = thisCL.getRelatedCL(childContentKey);
                // if their is no data-key, simply load the child CI with the
                // same data object that the parent holds (assuming that this
                // method is called by loadAndReplacePlaceholder()).
                if (childDataKey === "") {
                    cl.loadAndReplacePlaceholder(
                        $childCI, data, childReturnData
                    );
                    return;
                }

                // else, first split childDataKey into an array with ":" as the
                // seperator.
                let splitDataKey = childDataKey.split(":");
                // check that the first part of this split conform to the
                // pattern /^data(.[\w\$]+)*(\[\.\.\.\])?$/.
                let error = (
                    "ContentLoader.loadDescendants(): " +
                    'ill-formed childDataKey "' + childDataKey +
                    '" in ' + childContentKey
                );
                if (!/^data(.[\w\$]+)*(\[\.\.\.\])?$/.test(splitDataKey[0])) {
                    throw error;
                }
                // record if the "[...]" is present or not, and record the keys
                // of this first part of the data key without the "[...]" in an
                // array.
                let isAnArrayDataKey = false;
                if (splitDataKey[0].slice(-5) === "[...]") {
                    isAnArrayDataKey = true;
                    splitDataKey[0] = splitDataKey[0].slice(0, -5);
                }
                let dataKeyArr = splitDataKey[0].split(".").slice(1);

                // parse the optional waitfor signal from the end of the data
                // key.
                let signal;
                if (typeof splitDataKey[1] === "undefined") {
                    signal = ""
                // if the data key ends in /:waitfor:[\.\w\$\[\]:\-]*/ (where
                // the symbols in the last square bracket conforms to the RegEx
                // of convertHTMLTemplate()), parse the final part as the
                // signal.
                } else if (splitDataKey[1] === "waitfor") {
                    if (typeof splitDataKey[2] === "undefined") {
                        throw error;
                    }
                    signal = splitDataKey[2];
                // else if the data key ends in ":wait", let the signal simply
                // be "load".
                } else if (splitDataKey[1] === "wait") {
                    if (typeof splitDataKey[2] !== "undefined") {
                        throw error;
                    }
                    signal = "load";
                } else {
                    throw error;
                }

                // finally, call loadChildCIWithNestedDataAndSignal() with the
                // obtained dataKeyArr, isAnArrayDataKey and signal as inputs.
                loadChildCIWithNestedDataAndSignal(
                    $childCI, cl, data, dataKeyArr, isAnArrayDataKey, signal,
                    childReturnData
                );
            });
    }

    addCSSRulesToDocument(cssRules) {
        let len = cssRules.length;
        for (let i = 0; i < len; i++) {
            let rule = cssRules[i].trim();
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
                     "lists (but received '" + cssRules[i] + "')"
                );
            }
            // replace all &'s in the selector with the CLs automatic CI class.
            rule = rule.replaceAll("&", this.getCIClassSelector());
            // append the rule to the document head.
            $('html > head').append(
                '<style class="CI-style">' + rule + '</style>'
            );
        }
    }
    getCIClassSelector() {
        if (this.parentCL) {
            return this.parentCL.getCIClassSelector() +
                " .CI." + this.contentKey;
        } else {
            return ".CI." + this.contentKey;
        }
    }
}

function loadChildCIWithNestedDataAndSignal(
    $childCI, cl, data, dataKeyArr, isAnArrayDataKey, signal, childReturnData
) {
    if (signal === "") {
        var nestedData = data;
        var len = dataKeyArr.length;
        for (let i = 0; i < len; i++) {
            let key = dataKeyArr[i];
            if (!/^[\w\$]+$/.test(key)) {
                throw (
                    "loadChildCIWithNestedDataAndSignal(): " +
                    'ill-formed childDataKey "data.' + dataKeyArr.join(".")
                );
            }
            if (i === 0) {
                nestedData = nestedData.get(key);
            } else {
                nestedData = nestedData[key];
            }
        }
        if (!isAnArrayDataKey) {
            var resultingData = new ChildData(data, nestedData);
            cl.loadAndReplacePlaceholder(
                $childCI, resultingData, childReturnData
            );
        } else {
            var $nthChildCI = $childCI;
            var len = nestedData.length;
            for (let i = 0; i < len; i++) {
                let resultingData = new ChildData(data, nestedData[i]);
                cl.loadAfter(
                    $nthChildCI, "self", resultingData,
                    childReturnData
                );
                $nthChildCI = $nthChildCI.next();
            }
            $childCI.remove();
            // NOTE: One should not make decorator CLs of these list
            // template keys. That is, do not use htmlTemplates of
            // the form "<<Example data.example.example[...]>>";
            // always make sure to have these list template keys
            // nested (e.g. inside a <div></div>). // TODO: Move this up to the
            // top (i.e. have always one outer element in any htmlTemplate).
        }
    } else {
        $childCI
            .addClass('CI ' + cl.contentKey)
            .removeClass('placeholder')
            .one(signal, function() {
                loadChildCIWithNestedDataAndSignal(
                    $childCI, cl, data, dataKeyArr, isAnArrayDataKey, "",
                    childReturnData
                )
                return false;
            });
    }
}
