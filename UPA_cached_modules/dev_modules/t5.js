
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
                $obj.find('.response-field').append(JSON.stringify(result));
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
            regData.uid = $this.data("contextData").user;
            regData.scid = $this.find('input.catID').val();
            regData.t = $this.find('textarea.title').val();
            $this.trigger("input-req-data", [regData]);
        });
});
export var termInputFieldCL = new ContentLoader(
    "TermInputField",
    /* Initial HTML */
    '<<InputField>>',
    pageAreaCL
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
            regData.uid = $this.data("contextData").user;
            regData.cid = $this.find('input.catID').val();
            regData.t = $this.find('textarea.title').val();
            $this.trigger("input-req-data", [regData]);
        });
});

export var relationInputFieldCL = new ContentLoader(
    "RelationInputField",
    /* Initial HTML */
    '<<InputField>>',
    pageAreaCL
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
            regData.uid = $this.data("contextData").user;
            regData.cid = $this.find('input.catID').val();
            regData.t = $this.find('textarea.title').val();
            $this.trigger("input-req-data", [regData]);
        });
});




export var inputColumnCL = new ContentLoader(
    "InputColumn",
    /* Initial HTML */
    '<<PagesWithTabHeader>>',
    appColumnCL
);


inputColumnCL.addCallback(function($ci) {
    let contextData = $ci.data("contextData");
    $ci
        .trigger("add-tab-and-page",
            ["Input category", "CategoryInputPage", contextData]
        )
        .trigger("add-tab-and-page",
            ["Input term", "TermInputPage", contextData]
        )
        .trigger("add-tab-and-page",
            ["Input relation", "RelationInputPage", contextData]
        )
        // .trigger("add-tab-and-page",
        //     ["Input list", "TestPage", contextData]
        // );
});

export var categoryInputPageCL = new ContentLoader(
    "CategoryInputPage",
    /* Initial HTML */
    '<div>' +
        '<<CategoryInputField>>' +
    '</div>',
    pageAreaCL
);
export var termInputPageCL = new ContentLoader(
    "TermInputPage",
    /* Initial HTML */
    '<div>' +
        '<<TermInputField>>' +
    '</div>',
    pageAreaCL
);
export var relationInputPageCL = new ContentLoader(
    "RelationInputPage",
    /* Initial HTML */
    '<div>' +
        '<<RelationInputField>>' +
    '</div>',
    pageAreaCL
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

pageAreaCL.addCSS(
    'margin: 15px 15px;'
);
