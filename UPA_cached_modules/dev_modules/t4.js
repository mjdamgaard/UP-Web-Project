
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=1";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=2";

import {
    sdbInterfaceCL, appColumnCL,
} from "/UPA_scripts.php?id=3";





export var setFieldCL = new ContentLoader(
    "SetField",
    /* Initial HTML template */
    '<div>' +
        '<<SetHeader>>' +
        '<<List>>' +
    '</div>',
    appColumnCL
);
setFieldCL.addCallback("data", function(newData, data) {
    newData.listElemDataArr = [{
        cl: setFieldCL.getRelatedCL("Element"),
        data: data,
    }];
});
setFieldCL.addCallback(function($ci, data) {
    // TODO: Change this such that a number of initially appended elements are
    // looked up in data.
    $ci
        .on("append-elements", function() {
            let $this = $(this);
            let set = $this.data("set");
            let setInfo = $this.data("setInfo");
            let elemContentKey = $this.data("data").elemContentKey ?? "Element";
            let elemCL = setFieldCL.getRelatedCL(elemContentKey)
            let len = set.length;
            let listElemDataArr = set.map(function(row) {
                return {
                    setInfo: setInfo,
                    ratVal: row[0],
                    objID: row[1],
                    cl: elemCL,
                    user: data.user,
                    preferenceUser: data.preferenceUser,
                };
            });
            let childData = {listElemDataArr: listElemDataArr};
            // reload the ElementList, with the potentially new elemDataArr.
            let $obj = $this.children('.CI.List');
            setFieldCL.loadReplaced($obj, "List", childData);
            return false;
        })
        .on("append-elements-if-ready", function() {
            let $this = $(this);
            let set = $this.data("set");
            let setInfo = $this.data("setInfo");
            if ((set ?? false) && (setInfo ?? false)) {
                $this.off("append-elements-if-ready")
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
                uid: data.user, // TODO: Change (add more options).
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
            $ci.data("set", result)
                .trigger("append-elements-if-ready");
        });
    } else {
        $ci.data("set", data.set);
        $ci.trigger("append-elements-if-ready");
    }
    if (typeof data.setInfo === "undefined") {
        let reqData;
        if (typeof data.setID === "undefined") {
            reqData = {
                type: "setInfoSK",
                uid: data.user,
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
            $ci.data("setInfo", result)
                .trigger("append-elements-if-ready");
        });
    } else {
        $ci.data("setInfo", data.setInfo);
        $ci.trigger("append-elements-if-ready");
    }
});
// TODO: Change this such that a number of initially appended elements are
// looked up in data.
// TODO: Add a dropdown content key as well to the inut data for SetFields,
// as well as a boolean telling whether the dropdown should be shown already
// as default for all elements in the list.


export var elementCL = new ContentLoader(
    "Element",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    appColumnCL
);


export var setHeaderCL = new ContentLoader(
    "SetHeader",
    /* Initial HTML template */
    '<div>' +
        // TODO: add a bar with user weight buttons and a refresh button. *(This
        // bar should also turn into a drop-down menu for some decorating CLs.
    '</div>',
    appColumnCL
);
