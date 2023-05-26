
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=11";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=12";

import {
    sdbInterfaceCL, appColumnCL,
} from "/UPA_scripts.php?id=13";





export var setFieldCL = new ContentLoader(
    "SetField",
    /* Initial HTML template */
    '<div>' +
        '<<SetHeader data:wait>>' +
        '<<List data:wait>>' +
    '</div>',
    appColumnCL
);
setFieldCL.addCallback("data", "copy"); // No, just remember to add "data"
// to: "<<SetField data>>", since this will have the same effect. // *No,
// it's actually nice that SetField always has its own data copy..
setFieldCL.addCallback(function($ci, data) {
    // TODO: Change this such that a number of initially appended elements are
    // looked up in data.
    $ci
        .on("append-elements", function() {
            let elemCL = setFieldCL.getRelatedCL(data.elemContentKey)
            let len = data.set.length;
            let entityType = data.setInfo[6];
            let setInfo = data.setInfo;
            data.listElemDataArr = data.set.map(function(row) {
                return {
                    setInfo: setInfo,
                    ratVal: row[0],
                    entityID: row[1],
                    entityType: entityType,
                    cl: elemCL,
                };
            });
            // reload the ElementList, with the potentially new elemDataArr.
            $(this).children('.CI.List').trigger("load");
            return false;
        })
        .on("append-elements-if-ready", function() {
            if ((data.set ?? false) && (data.setInfo ?? false)) {
                $(this).off("append-elements-if-ready")
                    .trigger("append-elements");
            }
            return false;
        });
});
setFieldCL.addCallback(function($ci, data) {
    let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
    if (typeof data.set === "undefined") {
        let reqData;
        if (typeof data.setID === "undefined") {
            reqData = {
                type: "setSK",
                uid: data.queryUserID, // TODO: Change (add more options).
                sid: data.subjID,
                rid: data.relID,
                rl: "", rh: "",
                n: 10000, o: 0,
                a: 0,
            };
        } else {
            reqData = {
                type: "set",
                id: data.setID,
                rl: "", rh: "",
                n: 10000, o: 0,
                a: 0,
            }; // TODO: Change to look all this up (using ?? op.).
        }
        dbReqManager.query($ci, reqData, function($ci, result) {
            $ci.data("data").set = result;
            $ci.trigger("append-elements-if-ready");
        });
    } else {
        $ci.data("data").set = data.set;
        $ci.trigger("append-elements-if-ready");
    }
    if (typeof data.setInfo === "undefined") {
        let reqData;
        if (typeof data.setID === "undefined") {
            reqData = {
                type: "setInfoSK",
                uid: data.queryUserID,
                sid: data.subjID,
                rid: data.relID,
            };
        } else {
            reqData = {
                type: "setInfo",
                id: data.setID,
            };
        }
        dbReqManager.query($ci, reqData, function($ci, result) {
            $ci.data("data").setInfo = result[0] ?? result;
            $ci.trigger("append-elements-if-ready");
            $ci.children('.CI.SetHeader').trigger("load");
        });
    } else {
        $ci.data("data").setInfo = data.setInfo;
        $ci.trigger("append-elements-if-ready");
        $ci.children('.CI.SetHeader').trigger("load");
    }
});
// TODO: Change this such that a number of initially appended elements are
// looked up in data.
// TODO: Add a dropdown content key as well to the inut data for SetFields,
// as well as a boolean telling whether the dropdown should be shown already
// as default for all elements in the list.



export var setHeaderCL = new ContentLoader(
    "SetHeader",
    /* Initial HTML template */
    '<div>' +
        // TODO: add a bar with user weight buttons and a refresh button. *(This
        // bar should also turn into a drop-down menu for some decorating CLs.
        '<<PredicateRepresentation>>' +
    '</div>',
    appColumnCL
);
setHeaderCL.addCallback("data", function(newData, data) {
    let setInfo = data.setInfo;
    newData.subjType = setInfo[2];
    newData.subjID = setInfo[3];
    newData.relID = setInfo[4];
    newData.relText = setInfo[5];
    newData.objType = setInfo[6];
});
export var predicateRepresentationCL = new ContentLoader(
    "PredicateRepresentation",
    /* Initial HTML template */
    '<div>' +
        '<<RelationTitle>>' +
        '<<SubjectTitle>>' +
    '</div>',
    appColumnCL
);
export var relationTitleCL = new ContentLoader(
    "RelationTitle",
    /* Initial HTML template */
    '<<EntityTitle>>',
    appColumnCL
);
relationTitleCL.addCallback("data", function(newData, data) {
    newData.entityType = "r";
    newData.entityID = data.relID;
    newData.title = data.relText;
});
export var subjectTitleCL = new ContentLoader(
    "SubjectTitle",
    /* Initial HTML template */
    '<span>' +
        '<<EntityTitle>>' +
    '</span>',
    appColumnCL
);
subjectTitleCL.addCallback("data", function(newData, data) {
    newData.entityType = data.subjType;
    newData.entityID = data.subjID;
});




export var entityTitleCL = new ContentLoader(
    "EntityTitle",
    /* Initial HTML template */
    '<span>' +
    '</span>',
    appColumnCL
);
entityTitleCL.addCallback(function($ci, data) {
    if (typeof data.title === "string") {
        $ci.append(data.title);
        return;
    }
    let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
    let reqData = {
        id: data.entityID,
    };
    switch (data.entityType) {
        case "c":
            reqData.type = "cat"
            break;
        case "t":
            reqData.type = "term"
            break;
        case "r":
            reqData.type = "rel"
            break;
        default:
            throw "entityType " + data.entityType + " not implemented";
    }
    dbReqManager.query($ci, reqData, function($ci, result) {
        $ci.append(result[0][0]);
    });
});
entityTitleCL.addCallback(function($ci, data) {
    $ci
        .on("click", function() {
            let columnData = {
                queryUserID: data.queryUserID,
                inputUserID: data.inputUserID,
                entityType: data.entityType,
                entityID: data.entityID,
                subjType: data.subjType,
                subjID: data.subjID,
            };
            $(this)
                .trigger("open-column", [
                    "EntityColumn", columnData, "right", true
                ])
                .trigger("column-click");
            return false;
        });
});



export var entityRepresentationCL = new ContentLoader(
    "EntityRepresentation",
    /* Initial HTML template */
    '<div>' +
        '<<EntityTitle>>' +
    '</div>',
    appColumnCL
);


//
