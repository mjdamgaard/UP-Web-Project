
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=11";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=12";
import {
    sdbInterfaceCL, appColumnCL, columnMainCL, pagesWithTabsCL,
} from "/UPA_scripts.php?id=13";




export var predicateColumnCL = new ContentLoader(
    "PredicateColumn",
    /* Initial HTML template */
    '<<AppColumn>>',
    sdbInterfaceCL
);
predicateColumnCL.addCallback("append",
    '.CI.ColumnHeader',
    "<<PredicateHeaderContent>>"
);
predicateColumnCL.addCallback("append",
    '.CI.ColumnMain',
    "<<PredicateMainContent>>"
);

export var predicateHeaderContentCL = new ContentLoader(
    "PredicateHeaderContent",
    /* Initial HTML template */
    '<div>' +
        '<<SupercategoryNav>>' +
        '<h3>Predicate: <<EntityTitle>> <h3>' +
    '</div>',
    appColumnCL,
);

export var predicateMainContentCL = new ContentLoader(
    "PredicateMainContent",
    /* Initial HTML template */
    '<<PagesWithTabs>>',
    appColumnCL
);
predicateMainContentCL.addCallback("data", function(newData, data) {
    newData.tabAndPageDataArr = [
        ["Subategories", "PredicateSubategoriesPage", data],
        ["Elements", "PredicateElementsPage", data],
    ];
    newData.defaultTab = "Subategories";
});
export var predicateSubategoriesPageCL = new ContentLoader(
    "PredicateSubategoriesPage",
    /* Initial HTML template */
    '<div>' +
        '<<SubategoriesSetField>>' +
    '</div>',
    appColumnCL
);




















export var inputFieldCL = new ContentLoader(
    "InputField",
    /* Initial HTML template */
    '<div></div>',
    columnMainCL
);
inputFieldCL.addCallback(function($ci) {
    $ci
        .on("input-req-data", function(event, reqData) {
            let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
            dbReqManager.input($(this), reqData, function($obj, result) {
                $obj.find('.response-field').append(JSON.stringify(result));
            });
        })
        .find('button[type="submit"]').on("click", function() {
            $(this).trigger("submit");
        });
});

export var categoryInputFieldCL = new ContentLoader(
    "CategoryInputField",
    /* Initial HTML template */
    '<<InputField>>',
    columnMainCL
);
categoryInputFieldCL.addCallback(function($ci) {
    $ci.append(
        '<h3>Submit a Category</h3>' +
        '<form action="javascript:void(0);">' +
            '<div class="form-group">' +
                '<label>Supercategory ID:</label>' +
                '<input type="text" class="form-control id catID">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Title:</label>' +
                '<textarea class="form-control title" rows="1">' +
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
            regData.uid = $this.data("data").user;
            regData.scid = $this.find('input.catID').val();
            regData.t = $this.find('textarea.title').val();
            $this.trigger("input-req-data", [regData]);
        });
});
export var termInputFieldCL = new ContentLoader(
    "TermInputField",
    /* Initial HTML template */
    '<<InputField>>',
    columnMainCL
);
termInputFieldCL.addCallback(function($ci) {
    $ci.append(
        '<h3>Submit a Term</h3>' +
        '<form action="javascript:void(0);">' +
            '<div class="form-group">' +
                '<label>Category ID:</label>' +
                '<input type="text" class="form-control id catID">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Title:</label>' +
                '<textarea class="form-control title" rows="1">' +
                '</textarea>' +
            '</div>' +
            '<button type="submit" class="btn btn-default">Submit</button>' +
        '</form>' +
        '<div class="response-field"></div>'
    );
});
termInputFieldCL.addCallback(function($ci) {
    $ci
        .on("submit", function() {
            let $this =  $(this);
            var regData = {type: "term"};
            regData.uid = $this.data("data").user;
            regData.cid = $this.find('input.catID').val();
            regData.t = $this.find('textarea.title').val();
            $this.trigger("input-req-data", [regData]);
        });
});

export var relationInputFieldCL = new ContentLoader(
    "RelationInputField",
    /* Initial HTML template */
    '<<InputField>>',
    columnMainCL
);
relationInputFieldCL.addCallback(function($ci) {
    $ci.append(
        '<h3>Submit a Relation</h3>' +
        '<form action="javascript:void(0);">' +
            '<div class="form-group">' +
                '<label>Subject type:</label>' +
                '<input type="text" class="form-control id catID">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Title:</label>' +
                '<textarea class="form-control title" rows="1">' +
                '</textarea>' +
            '</div>' +
            '<button type="submit" class="btn btn-default">Submit</button>' +
        '</form>' +
        '<div class="response-field"></div>'
    );
});
relationInputFieldCL.addCallback(function($ci) {
    $ci
        .on("submit", function() {
            let $this =  $(this);
            var regData = {type: "rel"};
            regData.uid = $this.data("data").user;
            regData.cid = $this.find('input.catID').val();
            regData.t = $this.find('textarea.title').val();
            $this.trigger("input-req-data", [regData]);
        });
});




export var inputColumnCL = new ContentLoader(
    "InputColumn",
    /* Initial HTML template */
    '<<PagesWithTabHeader>>',
    appColumnCL
);


inputColumnCL.addCallback(function($ci) {
    let data = $ci.data("data");
    $ci
        .trigger("add-tab-and-page",
            ["Input category", "CategoryInputPage", data]
        )
        .trigger("add-tab-and-page",
            ["Input term", "TermInputPage", data]
        )
        .trigger("add-tab-and-page",
            ["Input relation", "RelationInputPage", data]
        )
        // .trigger("add-tab-and-page",
        //     ["Input list", "TestPage", data]
        // );
});

export var categoryInputPageCL = new ContentLoader(
    "CategoryInputPage",
    /* Initial HTML template */
    '<div>' +
        '<<CategoryInputField>>' +
    '</div>',
    columnMainCL
);
export var termInputPageCL = new ContentLoader(
    "TermInputPage",
    /* Initial HTML template */
    '<div>' +
        '<<TermInputField>>' +
    '</div>',
    columnMainCL
);
export var relationInputPageCL = new ContentLoader(
    "RelationInputPage",
    /* Initial HTML template */
    '<div>' +
        '<<RelationInputField>>' +
    '</div>',
    columnMainCL
);



inputFieldCL.addCallback("afterDec", function($ci) {
    $ci.find('input.id').attr("placeholder", "1234");
    $ci.find('textarea').attr("placeholder", "Text");
});
categoryInputFieldCL.addCallback("afterDec", function($ci) {
    $ci.find('textarea').attr("placeholder", "Title");
});
termInputPageCL.addCallback("afterDec", function($ci) {
    $ci.find('textarea').attr("placeholder", "Title");
});

columnMainCL.addCSS(
    'margin: 15px 15px;'
);
