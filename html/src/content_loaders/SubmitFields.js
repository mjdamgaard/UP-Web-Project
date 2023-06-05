
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";




export var sumbitPredicateFieldCL = new ContentLoader(
    "SubmitPredicateField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Submit a Predicate</h4>' +
        '<form action="javascript:void(0);">' +
            '<div class="form-group">' +
                '<label>Relation text:</label>' +
                '<textarea rows="1" class="form-control title"></textarea>' +
            '</div>' +
            '<div class="relation-id-display"></div>' +

            '<div class="form-group">' +
                '<label>Object type:</label>' +
                '<input type="text" class="form-control specType">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Object ID:</label>' +
                '<input type="text" class="form-control specID">' +
            '</div>' +
            '<div class="object-title-display"></div>' +

            '<button type="submit" class="btn btn-default">Submit</button>' +
        '</form>' +
        '<div class="response-display"></div>' +
    '</div>',
    appColumnCL
);
sumbitPredicateFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "objType",
        "objID",
        "relID",
    ]);
});
sumbitPredicateFieldCL.addCallback(function($ci, data) {
    // TODO: try to fill out input fields automatically.
});
sumbitPredicateFieldCL.addCallback(function($ci, data) {
    $ci.on("submit", function() {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let $this =  $(this);
        let data = $this.data("data");

        let inputUserID = data.getFromAncestor("inputUserID");
        if (!inputUserID) {
            $this.trigger('ask-user-to-log-in');
            return false;
        }

        let regData = {type: "term"};
        regData.uid = inputUserID;
        regData.cid = 2; // the Semantic Context of "Predicates".
        regData.t = $this.find('.title').val();
        dbReqManager.query($ci, reqData, function($ci, result) {
            $ci.find('.response-display').empty().append(
                JSON.stringify(result[0])
            );
        });
        return false;
    });
});
