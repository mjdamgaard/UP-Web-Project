
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
inputFieldCL.addCallback(function($ci) {
    $ci
        .on("input-req-data", function(event, reqData) {
            let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
            dbReqManager.input($(this), reqData, function($obj, result) {
                $obj.find('.response-field').append(result);
            });
        })
        .find('button[type="submit"]').on("click", function() {
            $(this).trigger("submit");
        });
});
export var categoryInputFieldCL = new ContentLoader(
    "CategoryInputField",
    /* Initial HTML */
    '<<InputField>>',
    pageAreaCL
);
categoryInputFieldCL.addCallback(function($ci) {
    $ci.append(
        '<form action="javascript:void(0);">' +
            '<div class="form-group">' +
                '<label>Supercategory:</label>' +
                '<input type="number" class="form-control catID">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Title:</label>' +
                '<textarea type="text" class="form-control title" rows="1">' +
                '</textarea>' +
            '</div>' +
            '<button type="submit" class="btn btn-default">Submit</button>' +
        '</form>' +
        '<div class="response-field"></div>'
    );
});
categoryInputFieldCL.addCallback(function($ci) {
    $ci
        .on("submit", function() {
            let $this =  $(this);
            var regData = {type: "cat"};
            regData.uid = $this.data("contextData").userID;
            regData.scid = $this.find('input.catID').val();
            regData.t = $this.find('input.title').val();
            $this.trigger("input-req-data", [regData]);
        });
});



pageAreaCL.addCSS(
    'margin: 15px 15px;'
);


/* Test */

export var testPagesCL = new ContentLoader(
    "TestPages",
    /* Initial HTML */
    '<<PagesWithTabHeader>>',
    appColumnCL
);


testPagesCL.addCallback(function($ci) {
    let contextData = $ci.data("contextData");
    $ci
        .trigger("add-tab-and-page",
            ["Insert category", "TestPage", contextData]
        )
        .trigger("add-tab-and-page",
            ["Insert term", "TestPage", contextData]
        )
        .trigger("add-tab-and-page",
            ["Insert relation", "TestPage", contextData]
        )
        .trigger("add-tab-and-page",
            ["Insert list", "TestPage", contextData]
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
// pageFieldCL.addCallback(function($ci) {
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
// termListCL.addCallback(function($ci) {
//     $ci.append('<ul class="list-group"></ul>');
// });
// termListCL.addCallback(function($ci) {
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
// // simpleTermListElementCL.addCallback(function($ci) {
// //     let termID = $ci.data("contextData").termID;
// //     $ci.data("contextData").dbReqManager.query($ci, )...
// //     $ci.append(
// //         ''
// //     );
// // });
