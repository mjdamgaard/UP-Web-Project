import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/SDBInterfaces.js";















// export var sumbitPredicateFieldCL = new ContentLoader(
//     "SubmitPredicateField",
//     /* Initial HTML template */
//     '<div>' +
//         '<h4>Submit a Predicate</h4>' +
//         '<form action="javascript:void(0);">' +
//             '<div class="form-group">' +
//                 '<label>Relation text:</label>' +
//                 '<textarea rows="1" class="form-control title"></textarea>' +
//             '</div>' +
//             '<div class="relation-id-display"></div>' +
//
//             '<div class="form-group">' +
//                 '<label>Object type:</label>' +
//                 '<input type="text" class="form-control specType">' +
//             '</div>' +
//             '<div class="form-group">' +
//                 '<label>Object ID:</label>' +
//                 '<input type="text" class="form-control specID">' +
//             '</div>' +
//             '<div class="object-title-display"></div>' +
//
//             '<button type="submit" class="btn btn-default">Submit</button>' +
//         '</form>' +
//         '<div class="response-display"></div>' +
//     '</div>',
//     appColumnCL
// );
// sumbitPredicateFieldCL.addCallback("data", function(data) {
//     data.copyFromAncestor([
//         "objType",
//         "objID",
//         "relID",
//     ]);
// });
// sumbitPredicateFieldCL.addCallback(function($ci, data) {
//     if (typeof data.relID !== "undefined") {
//         let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
//         let reqData = {
//             type: "term",
//             id: data.relID,
//         };
//         dbReqManager.query($ci, reqData, function($ci, result) {
//             let relTitle = (result[0] ?? [""])[1];
//             $ci.find('.title').val(relTitle);
//         });
//     }
//     if (typeof data.objType !== "undefined") {
//         $ci.find('.specType').val(data.objType);
//     }
//     if (typeof data.objID !== "undefined") {
//         $ci.find('.specID').val(data.objID.toString());
//     }
// });
// sumbitPredicateFieldCL.addCallback(function($ci, data) {
//     $ci.on("submit", function() {
//         let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
//         let $this =  $(this);
//         let data = $this.data("data");
//
//         let inputUserID = data.getFromAncestor("inputUserID");
//         if (!inputUserID) {
//             $this.trigger('ask-user-to-log-in');
//             return false;
//         }
//
//         let reqData = {type: "term"};
//         reqData.uid = inputUserID;
//         reqData.cid = 2; // the Semantic Context of "Predicates".
//         reqData.t = $this.find('.title').val();
//         reqData.spt = $this.find('.specType').val();
//         reqData.spid = $this.find('.specID').val();
//         dbReqManager.input($ci, reqData, function($ci, result) {
//             $ci.find('input , textarea').val("");
//             $ci.find('.response-display').empty().append(
//                 JSON.stringify(result)
//             );
//         });
//         return false;
//     });
// });
