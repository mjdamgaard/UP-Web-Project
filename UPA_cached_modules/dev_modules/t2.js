
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
        nestedCSSRules,
        inwardCallbacks, outwardCallbacks,
        conextDataModFuns, // modifyReturnDataFuns,
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
        this.nestedCSSRules = nestedCSSRules ?? [];
        this.cssRulesAreAdded = false;
        this.inwardCallbacks = inwardCallbacks ?? [];
        this.outwardCallbacks = outwardCallbacks ?? [];
        this.childCLs = childCLs ?? [];
        this.modSignals = modSignals ?? [];
        this.childContextDataGetFuns = childContextDataGetFuns ?? [];
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


    loadAndReplacePlaceholder($placeholder, conextData, returnData) {
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
            this.inwardCallbacks[i]($ci, conextData);
        }

        // change the data to hand on to the inner CIs.
        var childConextData = conextData;
        len = this.childContextDataGetFuns.length;
        for (let i = 0; i < len; i++) {
            childConextData = this.childContextDataGetFuns[i](childConextData);
        }

        // load all the descendent CIs.
        var childReturnData = {};
        let thisClassInstance = this;
        $ci.find('*').addBack()
            .filter('template.placeholder')
            .each(function() {
                let $childCI = $(this);
                let childContentKey = $childCI.attr("data-key");
                let cl = thisClassInstance.getRelatedContentLoader(
                    childContentKey
                );
                cl.loadAndReplacePlaceholder(
                    $childCI, childConextData, childReturnData
                );
            });
        // in case $ci was a placeholder tag which is removed again at this
        // point, redefine it as the new CI element.
        $ci = $placeholder.next();
        // remove the placeholder template tag.
        $placeholder.remove();

        // store the contents of contexData on the CI.
        $ci.data(contexData);

        // apply all the outward callbacks (after the inner content is loaded).
        len = this.outwardCallbacks.length;
        for (let i = 0; i < len; i++) {
            // (Note that outward callbacks should read the context data from
            // calls to $ci.data(), as opposed to the inward callback, since
            // this makes the outward callbacks free to change this data as
            // well.) 
            this.outwardCallbacks[i](
                $ci, childReturnData, returnData
            );
        }

        // if the this.nestedCSSRules has not yet been added to the document
        // head, call addNestedCSSRules() to do so.
        if (this.cssRulesAreAdded == false) {
            this.addNestedCSSRules()
            this.cssRulesAreAdded = true;
        }
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

    addNestedCSSRules() {
        let len = this.nestedCSSRules.length;
        for (let i = 0; i < len; i++) {
            // get the tail end of the rule which is supposed to be prepended
            // with this CL's and its ancestor CLs' CI classes (which are equal
            // to their content keys).
            var ruleTail;
            let cssRule = this.nestedCSSRules[i].trim();
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
                    "ContentLoader.addNestedCSSRules(): nestedCSSRules " +
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
