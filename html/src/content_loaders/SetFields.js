
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";






export var setCL = new ContentLoader(
    "Set",
    /* Initial HTML template */
    '<div>' +
        '<<SetHeader>>' +
        '<<SetList>>' +
    '</div>',
    appColumnCL
);


export var setHeaderCL = new ContentLoader(
    "SetHeader",
    /* Initial HTML template */
    '<div>' +
        '<div hidden>' +
            '<<InformativePredicateTitle>>' +
            '<<DefaultQueryParamsMenu>>' +
            '<<SortingOptionsSelectionMenu>>' +
            '<<RefreshButton>>' +
            '<<AddButton>>' + // Button to go to Predicate Column.
        '</div>',
        '<<HeaderDropdownButtonBar>>' +
    '</div>',
    appColumnCL
);











setHeaderCL.addCallback(function($ci, data) {
    $ci.one("predSetDataArr-is-ready", function() {
        $(this).one("click", function() {
            let $this = $(this);
            $this.find('.CI.SetPredicatesDropdownMenu').trigger("load");
            $this.on("click", function() {
                $(this).find('.CI.SetPredicatesDropdownMenu').toggle();
            })
        });
    });
});
export var setPredicatesDropdownMenuCL = new ContentLoader(
    "SetPredicatesDropdownMenu",
    /* Initial HTML template */
    '<div>' +
        '<<SetPredicateMenuPoint data.predSetDataArr[...]>>' +
    '</div>',
    appColumnCL
);
export var setPredicateMenuPointCL = new ContentLoader(
    "SetPredicateMenuPoint",
    /* Initial HTML template */
    '<div>' +
        '<<PredicateTitle>>' +
        '<<RatingTransformFunctionMenu>>' +
        // '<<UserWeightsMenu>>' +
    '</div>',
    appColumnCL
);
export var ratingTransformFunctionMenuCL = new ContentLoader(
    "RatingTransformFunctionMenu",
    /* Initial HTML template */
    '<div>' +
        // TODO: CHange this to add more options for the function, and also so
        // that the user can set rl and rh for the set query, as well as decide
        // if the predicate set should be a superset the combined set
        // (filtering away all other elements).
        '<div class="form-group">' +
            '<label>factor:</label>' +
            '<input type="number" class="form-control">' +
        '</div>' +
    '</div>',
    appColumnCL
);
ratingTransformFunctionMenuCL.addCallback("data", function(data) {
    let predSetDataArr = getFromAncestor("predSetDataArr");
    data.copyFromAncestor("predID");
    let len = predSetDataArr.length;
    // find the userSets object corresponing to the relevant predicate.
    for (let i = 0; i < len; i++) {
        if (predSetDataArr[i].predID = data.predID) {
            data.userSets = predSetDataArr[i];
            break;
        }
    }
});
ratingTransformFunctionMenuCL.addCallback(function($ci, data) {
    $ci
});





// TODO: Make the user weight menu a global one, changed for the whole
// sdbInterface at once.
// export var userWeightArrMenuCL = new ContentLoader(
//     "UserWeightsMenu",
//     /* Initial HTML template */
//     '<div>' +
//         '<<UserWeightMenuPoint data.userWeightArr[...]>>' +
//     '</div>',
//     appColumnCL
// );
// export var userWeightMenuPointCL = new ContentLoader(
//     "UserWeightMenuPoint",
//     /* Initial HTML template */
//     '<div>' +
//         '<div class="form-group">' +
//             '<label><<UserTitle>> weight:</label>' +
//             '<input type="text" class="form-control">' +
//         '</div>' +
//     '</div>',
//     appColumnCL
// );
// userWeightMenuPointCL.addCallback("data", function(data) {
//     data.entityType = "u";
//     data.entityID = data.getFromAncestor("userID");
// });





//     dbReqManager.query($ci, reqData, function($ci, result) {
//         data.predID = (result[0] ?? [0])[0]; // predID = 0 if missing.
//         if (data.predID === 0) {
//             relationSetFieldCL.loadBefore(
//                 $ci, "MissingPredicateText", data
//             );
//             relationSetFieldCL.loadReplaced(
//                 $ci, "SubmitPredicateField", data
//             );
//         } else {
//             $ci.trigger("load");
//         }
//     });
//
// export var missingPredicateTextCL = new ContentLoader(
//     "MissingPredicateText",
//     /* Initial HTML template */
//     '<span class="text-warning">' +
//         'Predicate not found. Do you want to create the Predicate?' +
//     '</span>',
//     appColumnCL
// );
