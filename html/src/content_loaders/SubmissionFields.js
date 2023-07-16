import {
    ContentLoader, ChildData,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";



export var submitEntityFieldCL = new ContentLoader(
    "SubmitEntityField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Submit an entity</h4>' +
        '<form action="javascript:void(0);">' +
            '<div class="std-field-container"></div>' +
            '<div class="extra-field-container"></div>' +
            '<button class="btn btn-default add-field">Add field</button>' +
            '<button class="btn btn-default submit">Submit</button>' +
        '</form>' +
        '<div class="response-display"></div>' +
    '</div>',
    sdbInterfaceCL
);
submitEntityFieldCL.addCallback("data", function(data) {
    data.tmplID = data.getFromAncestor("tmplID") ?? 1;
});
submitEntityFieldCL.addCallback(function($ci, data) {
    $ci.one("append-input-fields", function(event, labelArr) {
        let $obj = $(this).find('.std-field-container');
        labelArr.forEach(function(label) {
            submitEntityFieldCL.loadAppended(
                $obj, "TextAreaFormGroup", new ChildData(data, {label:label})
            );
        });
        return false;
    });
});
submitEntityFieldCL.addCallback(function($ci, data) {
    if (data.tmplID == 1) {
        let labelArr = ["Title/Defining text"];
        $ci.trigger("append-input-fields", [labelArr]);
        return;
    }
    let reqData = {
        type: "ent",
        id: data.tmplID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        let tmplDefStr = (result[0] ?? [""])[2];
        if (tmplDefStr === "") {
            console.warn(
                "Template #" + data.tmplID +
                " has been removed from the database"
            );
            return;
        }
        let labelArr = getLabelArr(tmplDefStr);
        $ci.trigger("append-input-fields", [labelArr]);
    });
});
export function getLabelArr(tmplDefStr) {
    return tmplDefStr
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .match(/<[^<>]*>/g)
        .map(val => val.slice(1, -1));
}

submitEntityFieldCL.addCallback(function($ci, data) {
    $ci.find('button.submit').on("click", function() {
        $(this).trigger("submit-entity");
    });
    $ci.on("submit-entity", function() {
        let $this = $(this);
        let $standardInputFields = $this
            .find('.std-field-container')
            .children('.CI.TextAreaFormGroup');
        let $extraInputFields = $this
            .find('.extra-field-container')
            .children('.CI.ExtraInputFormGroup');
        // extract inputs from which to contruct the defining string.
        let defStrParts = [];
        $standardInputFields.each(function() {
            let input = $(this).find('.form-control').val().trim();
            defStrParts.push(input);
        });
        $extraInputFields.each(function() {
            let $this = $(this);
            let labelInput = $this.find('label .label-input').val().trim();
            let valInput = $this.children('.form-control').val().trim();
            if (valInput) {
                let input = "";
                if (labelInput) {
                    input = labelInput + ":";
                }
                input += valInput;
                defStrParts.push(input);
            }
        });
        // contruct the defining string.
        let defStr = defStrParts
            .map(val => val.replaceAll("|", "\\|").replaceAll("\\", "\\\\"))
            .join("|");
        // test if defStr is not too long or too short, and submit if not.
        if (defStr.length > 255) {
            $this.children('.response-display').html(
                '<span class="text-warning">' +
                    'Defining text is too long' +
                '</span>'
            );
            console.log("Too long defining string: " + defStr);
            return;
        }
        if (defStr.length == 0) {
            $this.children('.response-display').html(
                '<span class="text-warning">' +
                    'No defining text was supplied' +
                '</span>'
            );
            return;
        }
        // upload the new entity.
        let reqData = {
            type: "term",
            u: data.getFromAncestor("inputUserID"),
            ty: 'o', // TODO: add an input field for the term type.
            tm: data.tmplID == 1 ? 0 : data.tmplID,
            s: defStr,
        };
        dbReqManager.input($this, reqData, data, function($ci, result, data) {
            let exitCode = result.exitCode;
            let outID = result.outID;
            let newData = new ChildData(data, {entID: outID});
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
});

submitEntityFieldCL.addCallback(function($ci, data) {
    if (data.tmplID == 1) {
        $ci.find('button.add-field').hide();
        return;
    }
    $ci.find('button.add-field').on("click", function() {
        $(this).trigger("add-field"); // "submit" event fires for all buttons.
    });
    $ci.on("add-field", function() {
        let $obj = $(this).find('.extra-field-container');
        submitEntityFieldCL.loadAppended($obj, "ExtraInputFormGroup", data);
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
        '<h4>Submit an instance the <<EntityTitle>> applies to</h4>' +
        '<<SubmitInstanceForm>>' +
    '</div>',
    sdbInterfaceCL
);
export var submitInstanceFormCL = new ContentLoader(
    "SubmitInstanceForm",
    /* Initial HTML template */
    '<div>' +
        '<form action="javascript:void(0);">' +
            '<div class="form-group">' +
                '<label>ID:</label>' +
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
        // generate a rating display with this ID as the subjID.
        data.subjID = id;
        data.predID = data.getFromAncestor("entID");
        data.prevInputRatVal = null;
        submitInstanceFormCL.loadAfter($ci, "RatingDisplay", data);
        $ci.find('button.submit').hide();
        let $ratingDisplay = $ci.next();
        submitInstanceFormCL.loadAfter($ratingDisplay, "self", data);
        $ratingDisplay.after('<br>');
        return false;
    });
});
