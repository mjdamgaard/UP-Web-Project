
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=1";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=2";

import {
    sdbInterfaceCL, appColumnCL, pagesWithTabHeaderCL, pageAreaCL,
} from "/UPA_scripts.php?id=3";





export var inputFieldCL = new ContentLoader(
    "InputField",
    /* Initial HTML */
    '<div></div>',
    pageAreaCL
);
export var categoryInputFieldCL = new ContentLoader(
    "CategoryInputField",
    /* Initial HTML */
    '<<InputField>>',
    pageAreaCL
);
categoryInputFieldCL.outwardCallbacks.push(function($ci) {
    $ci.append(
       '<form action="javascript:void(0);">' +
          '<div class="form-group">' +
              '<label>Email address:</label>' +
              '<input type="email" class="form-control">' +
          '</div>' +
          '<div class="form-group">' +
              '<label>Password:</label>' +
              '<input type="password" class="form-control">' +
          '</div>' +
          '<div class="checkbox">' +
              '<label><input type="checkbox"> Remember me</label>' +
          '</div>' +
          '<button type="submit" class="btn btn-default">Submit</button>' +
      '</form>'
    );
});


/* Test */

export var testPagesCL = new ContentLoader(
    "TestPages",
    /* Initial HTML */
    '<<PagesWithTabHeader>>',
    appColumnCL
);


testPagesCL.outwardCallbacks.push(function($ci) {
    let contextData = $ci.data("contextData");
    $ci
        .trigger("add-tab-and-page",
            ["Supercategories", "TestPage", contextData]
        )
        .trigger("add-tab-and-page",
            ["Subcategories", "TestPage", contextData]
        )
        .trigger("add-tab-and-page",
            ["Elements", "TestPage", contextData]
        );
});

export var testPageCL = new ContentLoader(
    "TestPage",
    /* Initial HTML */
    '<<CategoryInputField>>',
    pageAreaCL
);










// export var pageFieldCL = new ContentLoader(
//     "PageField",
//     /* Initial HTML */
//     '<div class="container"></div>',
//     appColumnCL
// );
// pageFieldCL.outwardCallbacks.push(function($ci) {
//     $ci
//         .on("query-db", function(event, reqData, cacheKey, callback) {
//             let $this = $(this);
//             let dbReqManager = $this.data('dbReqManager');
//             dbReqManager.query($this, reqData, cacheKey, callback);
//             return false;
//         })
//         .on("append-contents", function(event, contentKey, dataArr, selector) {
//             let $obj = (typeof selector === "undefined") ?
//                 $(this) : $(this).find(selector);
//             let len = dataArr.length;
//             for (let i = 0; i < len; i++) {
//                 pageFieldCL.loadAppended($obj, contentKey, dataArr[i]);
//             }
//             return false;
//         })
//         .on("prepend-contents", function(event, contentKey, dataArr, selector) {
//             let $obj = (typeof selector === "undefined") ?
//                 $(this) : $(this).find(selector);
//             let len = dataArr.length;
//             for (let i = 0; i < len; i++) {
//                 pageFieldCL.loadPrepended($obj, contentKey, dataArr[i]);
//             }
//             return false;
//         });
// });
// export var termListCL = new ContentLoader(
//     "TermList",
//     /* Initial HTML */
//     '<<PageField>>',
//     appColumnCL
// );
// termListCL.outwardCallbacks.push(function($ci) {
//     $ci.append('<ul class="list-group"></ul>');
// });
// termListCL.outwardCallbacks.push(function($ci) {
//     $ci
//         .on("append-elements", function(event, contentKey, elemDataArr) {
//             $(this).trigger("append-contents",
//                 [contentKey, elemDataArr, 'ul, ol']
//             );
//             return false;
//         })
//         .on("empty", function(event, elemDataArr, elemCL) {
//             $(this).children('ul, ol').empty();
//             return false;
//         });
// });
//
//
// export var extensibleTermListCL = new ContentLoader(
//     "ExtensibleTermList",
//     /* Initial HTML */
//     '<<TermList>>',
//     appColumnCL
// );
// // TODO: Add a callback that adds a button at the bottom of the ci, which when
// // pressed, adds elements to the list, either cached ones or ones that are then
// // queried.
//
// export var termListElementCL = new ContentLoader(
//     "TermListElement",
//     /* Initial HTML */
//     '<li class="list-group-item"></li>',
//     appColumnCL
// );
// export var simpleTermListElementCL = new ContentLoader(
//     "SimpleTermListElement",
//     /* Initial HTML */
//     '<<TermListElement>>',
//     appColumnCL
// );
//
// // simpleTermListElementCL.outwardCallbacks.push(function($ci) {
// //     let termID = $ci.data("contextData").termID;
// //     $ci.data("contextData").dbReqManager.query($ci, )...
// //     $ci.append(
// //         ''
// //     );
// // });
