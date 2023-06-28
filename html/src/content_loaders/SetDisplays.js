
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/SDBInterfaces.js";




export var setDisplayCL = new ContentLoader(
    "SetDisplay",
    /* Initial HTML template */
    '<div>' +
        '<<SetHeader>>' +
        '<<SetList>>' +
        '<<AppendMoreButtonOrPagination>>' +
    '</div>',
    sdbInterfaceCL
);

export var setHeaderCL = new ContentLoader(
    "SetHeader",
    /* Initial HTML template */
    '<<DropdownBox>>',
    sdbInterfaceCL
);
setHeaderCL.addCallback("data", function(data) {
    data.dropdownCL = setHeaderCL.getRelatedCL("SetMenu");
});

export var dropdownBoxCL = new ContentLoader(
    "DropdownBox",
    /* Initial HTML template */
    '<div>' +
        '<<SelfReplacer data:wait>>' +
        '<<DropdownButtonBar>>' +
    '</div>',
    sdbInterfaceCL
);
dropdownBoxCL.addCallback("data", function(data) {
    data.cl = data.getFromAncestor("dropdownCL");
});
dropdownBoxCL.addCallback(function($ci, data) {
    $ci.one("click", function() {
        let $this = $(this);
        $this.find('.CI.DropdownButtonBar')
            .trigger("toggle-button-symbol")
            .on("click", function() {
                $(this).trigger("toggle-button-symbol")
                    .prev().toggle();
                return false;
            });
        $this.find('.CI.SelfReplacer').trigger("load");
        return false;
    });
});
export var dropdownButtonBarCL = new ContentLoader(
    "DropdownButtonBar",
    /* Initial HTML template */
    '<div>' +
        '<span class="symbol">&#8964</span>' +
    '</div>',
    sdbInterfaceCL
);
dropdownButtonBarCL.addCallback("data", function(data) {
    data.symbolIsDown = true;
});
dropdownButtonBarCL.addCallback(function($ci, data) {
    $ci.on("toggle-button-symbol", function() {
        let $this = $(this);
        let data = $this.data("data");
        if (data.symbolIsDown) {
            $this.children('.symbol').html('&#8963');
            data.symbolIsDown = false;
        } else {
            $this.children('.symbol').html('&#8964');
            data.symbolIsDown = true;
        }
        return false;
    });
});

export var setMenurCL = new ContentLoader(
    "SetMenu",
    /* Initial HTML template */
    '<div>' +
        '<<PredicatesSettingsMenu>>' +
        // '<<SortingPredicatesSettingsMenu>>' +
        // // TODO: Implement the following two CLs at some point:
        // // '<<FilterPredicatesSettingsMenu>>' +
        // // '<<UserWeightSettingsMenu>>' +
    '</div>',
    sdbInterfaceCL
);





// export var predicateSettingsBarCL = new ContentLoader(
//     "PredicateSettingsBar",
//     /* Initial HTML template */
//     '<div>' +
//         '<<InformativePredicateTitle>>' +
//         '<<QueryParamsMenu>>' +
//         '<<SortingOptionsSelectionMenu>>' +
//         '<<RefreshButton>>' +
//     '</div>',
//     sdbInterfaceCL
// );








// export var ratingTransformFunctionMenuCL = new ContentLoader(
//     "RatingTransformFunctionMenu",
//     /* Initial HTML template */
//     '<div>' +
//         // TODO: CHange this to add more options for the function, and also so
//         // that the user can set rl and rh for the set query, as well as decide
//         // if the predicate set should be a superset the combined set
//         // (filtering away all other elements).
//         '<div class="form-group">' +
//             '<label>factor:</label>' +
//             '<input type="number" class="form-control">' +
//         '</div>' +
//     '</div>',
//     appColumnCL
// );



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
