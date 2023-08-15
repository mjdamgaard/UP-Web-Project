import {
    ContentLoader, DataNode,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager, accountManager,
} from "/src/content_loaders/SDBInterface.js";



export var submitEntityFieldCL = new ContentLoader(
    "SubmitEntityField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Submit an entity</h4>' +
        '<form action="javascript:void(0);">' +
            '<div class="def-item-field-container"></div>' +
            '<span>' +
                '<button class="btn btn-default search">Search</button>' +
                '<button class="btn btn-default submit">Submit</button>' +
            '</span>' +
        '</form>' +
        '<div class="response-display"></div>' +
    '</div>',
    sdbInterfaceCL
);
submitEntityFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "typeID",
        "isTemplate",
    ]);
    data.copyFromAncestor("isTemplate", 1);
});
submitEntityFieldCL.addCallback(function($ci, data) {
    $ci.one("append-input-fields", function(event, labelArr) {
        let $obj = $(this).find('.def-item-field-container');
        labelArr.forEach(function(label) {
            submitEntityFieldCL.loadAppended(
                $obj, "TextAreaFormGroup", new DataNode(data, {label:label})
            );
            data.readyForSubmission = true;
        });
        return false;
    });
    if (data.typeID == 1) {
        if (!data.isTemplate) {
            data.newEntityType = data.entID;
            data.newEntityCxt = 0;
            let labelArr = data.entID == 3 ?
                ["Type ID #", "Template"] : ["Title"];
            $ci.trigger("append-input-fields", [labelArr]);
        } else {
            data.newEntityType = 3;
            data.newEntityCxt = data.entID;
            let labelArr = ["Template"];
            $ci.trigger("append-input-fields", [labelArr]);
        }
        return;
    }
    if (data.typeID == 3) {
        let reqData = {
            req: "ent",
            id: data.entID,
        };
        dbReqManager.query($ci, reqData, data, function($ci, result, data) {
            let tmplCxtID = (result[0] ?? [])[1];
            let tmplDefStr = (result[0] ?? [])[2];
            if (!tmplDefStr) {
                console.warn(
                    "Template #" + data.entID +
                    " has been removed from the database"
                );
                return;
            }
            data.newEntityType = tmplCxtID;
            data.newEntityCxt = data.entID;
            let labelArr = getLabelArr(tmplDefStr);
            $ci.trigger("append-input-fields", [labelArr]);
        });
        return;
    }
});
export function getLabelArr(tmplDefStr) {
    let placeholderTitleArr = tmplDefStr
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .match(/<[^<>]*>/g) ?? [];
    return placeholderTitleArr.map(val => val.slice(1, -1));
}

submitEntityFieldCL.addCallback(function($ci, data) {
    $ci.find("button.submit").on("click", function() {
        $(this).trigger("construct-entity");
        $(this).trigger("submit-entity");
        return false;
    });
    $ci.find("button.search").on("click", function() {
        $(this).trigger("construct-entity");
        $(this).trigger("search-for-entity");
        return false;
    });
    $ci.on("construct-entity", function() {
        let $this = $(this);
        if (!data.readyForSubmission) {
            $this.children('.response-display').html(
                '<span class="text-warning">' +
                    'Wait until the submission field is fully loaded' +
                '</span>'
            );
            return false;
        }
        let $inputFields = $this
            .find('.def-item-field-container')
            .children('.CI.TextAreaFormGroup');
        // extract inputs from which to contruct the defining string.
        let defStrParts = [];
        $inputFields.each(function() {
            let input = ($(this).find('.form-control').val() ?? "").trim();
            defStrParts.push(input);
        });
        // if entID is the "Template" type entity, let newEntityCxt be the
        // input of the first ("Type #") input field, and let defStr be that of
        // the following "Template" field.
        if (data.entID == 3) {
            data.newEntityCxt = defStrParts[0];
            data.defStr = defStrParts[1];
        // else construct defStr from all the input fields given by the
        // template.
        } else {
            // contruct the defining string.
            data.defStr = defStrParts
                .map(val => val.replaceAll("|", "\\|").replaceAll("\\", "\\\\"))
                .join("|");
            // test if defStr is not too long or too short.
            if (data.defStr.length > 255) {
                $this.children('.response-display').html(
                    '<span class="text-warning">' +
                        'Defining text is too long' +
                    '</span>'
                );
                console.log("Too long defining string: " + data.defStr);
                return;
            }
            // test any input was supplied to it.
            if (/^[\|]*$/.test(data.defStr)) {
                $this.children('.response-display').html(
                    '<span class="text-warning">' +
                        'No input was supplied' +
                    '</span>'
                );
                return;
            }
        }
        return false;
    });
    $ci.on("submit-entity", function() {
        // upload the new entity.
        let reqData = {
            req: "ent",
            ses: accountManager.sesIDHex,
            u: accountManager.inputUserID,
            r: 1,
            t: data.newEntityType,
            c: data.newEntityCxt,
            s: data.defStr,
        };
        dbReqManager.input($(this), reqData, data, function($ci, result, data) {
            let exitCode = result.exitCode;
            let outID = result.outID;
            let newData = new DataNode(data, {entID: outID});
            if (exitCode == 0) {
                $ci.children('.response-display').html(
                    '<span class="text-success">' +
                        'Entity was successfully uploaded!' +
                    '</span>' +
                    '<div>' +
                        'New ID: #' + outID +
                    '</div>'
                );
                $ci.trigger("open-column", ["AppColumn", newData, "right"]);
            } else if (exitCode == 1) {
                $ci.children('.response-display').html(
                    '<span class="text-info">' +
                        'Entity already exists' +
                    '</span>' +
                    '<div>' +
                        'ID: #' + outID +
                    '</div>'
                );
                $ci.trigger("open-column", ["AppColumn", newData, "right"]);
            } else {
                // throw error since this should not happen.
                throw (
                    "Recieved exitCode=" + exitCode + " from entity submission"
                );
            }
        });
        return false;
    });
    $ci.on("search-for-entity", function() {
        let $this = $(this);
        // remove previous response text.
        $ci.children('.response-display').empty();
        // upload the new entity.
        let reqData = {
            req: "entID",
            u: data.getFromAncestor("inputUserID"),
            t: data.newEntityType,
            c: data.newEntityCxt,
            s: data.defStr,
        };
        dbReqManager.query($this, reqData, data, function($ci, result, data) {
            let entID = (result[0] ?? [0])[0];
            let newData = new DataNode(data, {entID: entID});
            if (entID) {
                $ci.children('.response-display').html(
                    '<span class="text-success">' +
                        'Entity was found!' +
                    '</span>' +
                    '<div>' +
                        'ID: #' + entID +
                    '</div>'
                );
                $ci.trigger("open-column", ["AppColumn", newData, "right"]);
            } else {
                $ci.children('.response-display').html(
                    '<span class="text-info">' +
                        'Entity was not found' +
                    '</span>'
                );
            }
        });
        return false;
    });
});


export var textAreaFormGroupCL = new ContentLoader(
    "TextAreaFormGroup",
    /* Initial HTML template */
    '<div class="form-group">' +
        '<label></label>' +
        '<textarea rows="1" class="form-control"></textarea>' +
    '</div>',
    sdbInterfaceCL
);
textAreaFormGroupCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "label",
    ]);
});
textAreaFormGroupCL.addCallback(function($ci, data) {
    $ci.find('label').append(data.label + ":");
});

export var extraInputFormGroupCL = new ContentLoader(
    "ExtraInputFormGroup",
    /* Initial HTML template */
    '<div class="form-group">' +
        '<<CloseButton>>' +
        '<label>' +
            '<input type="text" class="label-input"></input>:' +
        '</label>' +
        '<textarea rows="1" class="form-control"></textarea>' +
    '</div>',
    sdbInterfaceCL
);
extraInputFormGroupCL.addCallback(function($ci, data) {
    $ci.on("close", function() {
        $(this).remove();
        return false;
    });
});
// TODO: Consider dropping the label.. ..or perhaps just make the colon syntax
// standard, and then make sure that IDs can be used instead of strings after
// the (first) colon..








export var submitInstanceFieldCL = new ContentLoader(
    "SubmitInstanceField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Submit an instance of <<EntityTitle>></h4>' +
        '<<SubmitInstanceForm>>' +
    '</div>',
    sdbInterfaceCL
);
submitInstanceFieldCL.addCallback("data", function(data) {
    data.catID = data.getFromAncestor("entID");
});
export var submitInstanceFormCL = new ContentLoader(
    "SubmitInstanceForm",
    /* Initial HTML template */
    '<div>' +
        '<form action="javascript:void(0);">' +
            '<div class="form-group">' +
                '<label>ID #:</label>' +
                '<input type="text" class="form-control id"></input>' +
            '</div>' +
            '<button class="btn btn-default submit">Submit</button>' +
        '</form>' +
        '<div class="response-display"></div>' +
    '</div>',
    sdbInterfaceCL
);
submitInstanceFormCL.addCallback(function($ci, data) {
    $ci.find('button.submit').on("click", function() {
        $(this).trigger("submit-id");
    });
    $ci.on("submit-id", function() {
        let $ci = $(this);
        let inputVal = $ci.find('input.id').val();
        // get the ID from the input field.
        let id;
        if (/^#[1-9][0-9]*$/.test(inputVal)) {
            id = inputVal.substring(1);
        } else if (/^[1-9][0-9]*$/.test(inputVal)) {
            id = inputVal;
        } else {
            $ci.children('.response-display').html(
                '<span class="text-warning">' +
                    'Please insert a decimal number (w/wo a # in front)' +
                '</span>'
            );
            return false;
        }
        // generate a rating display with this ID as the instID.
        data.instID = id;
        data.prevInputRatVal = null;
        if (!data.rateMsgIsAppended) {
            $ci.append(
                '<h5>' +
                    'Rate the new instance(s) in order to complete the ' +
                    'submission:' +
                '</h5>'
            );
            data.rateMsgIsAppended = true;
        }
        submitInstanceFormCL.loadAfter($ci, "RatingDisplay", data);
        return false;
    });
});
