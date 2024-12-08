import {useCallback, useRef} from "react";
import {DataInserter} from "../classes/DataInserter.js";
import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";



export const InitialInsertsPage = () => {
  const workspaceEntID = "10";
  const sesIDHex = "00".repeat(60);
  const getAccountData = useCallback((propName) => {
    return (propName === "userID") ? "9" :
      (propName === "sesIDHex") ? sesIDHex : null;
  });
  const dataInserter = useRef(
    new DataInserter(getAccountData, workspaceEntID)
  ).current;
  
  dataInserter.fetchWorkspaceObject((obj) => {
    // console.log(obj);
    // console.log(dataInserter);
  });

  return (
    <div>
      <h2>Initial inserts</h2>
      <br/>
      <div>
        <button onClick={(event) => {
          dataInserter.insertOrEditParsedEntity(
            "users/initial_admin", "a",
            JSON.stringify({
              "Class": "@[users]",
              "Username": "initial_admin",
            }),
            undefined, undefined, undefined,
            (outID) => {
              dataInserter.insertOrEditParsedEntity(
                "workspaces/initial_admin's workspace", "j", 
                JSON.stringify({}),
                0, 1, 1,
                (outID) => {
                  dataInserter.updateWorkspace();
                  event.target.setAttribute("style", "color:gray;");
                },
              );
            },
          );
        }}>
          Insert initial user and workspace
        </button>
      </div>
      <hr/>
      <div>
        <button onClick={() => initialInserts(dataInserter)}>
          Insert
        </button>
      </div>
      <hr/>
      <div>
        <button onClick={() => dataInserter.updateWorkspace()}>
          Update workspace
        </button>
      </div>
      <hr/>
      <div>
        <button onClick={(event) => {
          copyBasicEntityIDModuleToClipboard(dataInserter);
          event.target.setAttribute("style", "color:gray;");
        }}>
          Generate basic_entity_ids.js
        </button>
      </div>
      <hr/>
      <div>
        <button onClick={() => insertInitialScores(dataInserter)}>
          Insert initial scores (update basic_entity_ids.js and reload first!)
        </button>
      </div>
    </div>
  );
}


export function initialInserts(dataInserter) {

  dataInserter.insertOrEditParsedEntity(
    "users/initial_admin", "a",
    JSON.stringify({
      "Class": "@[users]",
      "Username": "initial_admin",
    }),
  );

  dataInserter.insertOrEditParsedEntity(
    "entities", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Entities",
        "Member title": "Entity",
        "Description": "@[entities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "entities/desc", "h", (
        "<h1><class>Entities</class></h1>" +
        "..."
    )
  );
  dataInserter.insertOrEditParsedEntity(
    "classes", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Classes",
        "Member title": "Class",
        "Member datatype": "a",
        "Member format": "@[classes/format]",
        "Description": "@[classes/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "classes/format", "f", (
        "(" + [
          "Name:string",
          "Member title:string",
          "Member datatype?:string",
          "Member format?:f",
          "Description:h",
        ].join(",") +
        ")=>" +
        JSON.stringify({
          "Class": "@[classes]",
          "Member title": "%1",
          "Member datatype": "%2",
          "Member format": "%3",
          "Description": "%4",
        })
    )
  );
  dataInserter.insertOrEditParsedEntity(
    "classes/desc", "h", ( // ('x' for 'XML,' or simply 'teXt.')
        "<h1>Classes</h1>" +
        "<h2>Description</h2>" +
        "<p>A class of all class entities (including itself). " +
        "Classes both serve as a broad way of categorizing entities, " +
        "and they are also used to define the meaning of their instances, " +
        "as their <i>description</i> will be shown on the info page " +
        "of each of their instances." +
        "</p>" +
        "<p>As an example, this description of the Classes " +
        "entity will be shown on the info page of all class entities, just " +
        "above the description of the general Entities class." +
        "</p>" +
        "<p>The <i>description</i> of a class should include a " +
        "section of 'special attributes,' if it defines a new attribute " +
        "or redefines an attribute of a superclass (opposite of 'subclass'). " +
        "..." +
        "</p>" +
        "<h2>Special attributes</h2>" +
        "<h3><attr>description</attr></h3>" +
        "</p>"
    )
        // TODO: Rewrite and add: Unless otherwise specified, entities with
        // more popular duplicates are always excluded from the class.
        // I might also add a general statement about not including specific
        // versions or "modes," unless otherwise specified, but to stick to the
        // level of abstraction that is the most obvious (if not defined) for
        // the class..
  );
  dataInserter.insertOrEditParsedEntity(
    "users", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Users",
        "Member title": "User",
        "Member datatype": "u",
        "Description": "@[users/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Qualities",
        "Member title": "Quality",
        "Member datatype": "c",
        "Member format": "@[qualities/format]",
        "Description": "@[qualities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/format", "f", (
        "(" + [
          "Label:string",
          "Object:@[entities]",
          "Relation:@[relations]",
          "Metric:@[metrics]",
          "Description?:h",
        ].join(",") +
        ")=>" +
        JSON.stringify({
          "Class": "@[qualities]",
          "Label": "%1",
          "Domain": {Object: "%2", Relation: "%3"},
          "Metric": "%4",
          "Description": "%5",
        })
    )
  );

  dataInserter.insertOrEditParsedEntity(
    "relevancy qualities", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Relevancy qualities",
        "Member title": "Relevancy quality",
        "Member datatype": "c",
        "Member format": "@[relevancy qualities/format]",
        "Description": "@[relevancy qualities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relevancy qualities/format", "f", (
        "(" + [
          "Object:@[entities]",
          "Relation:@[relations]",
        ].join(",") +
        ")=>" +
        JSON.stringify({
          "Class": "@[relevancy qualities]",
          // "Label": "Relevant for @{Object} → @{Relation}",
          "Label": "Relevant for %1 → %2",
          // "Domain": "@[sets/format](%1,%2)",
          "Domain": {Object: "%1", Relation: "%2"},
          "Metric": "@[metrics/predicate metric]",
          "Object": "%1",
          "Relation": "%1",
        })
    )
  );
  dataInserter.insertOrEditParsedEntity(
    "relevancy qualities/desc", "h", (
      "<h1>Scales</h1>" +
      "..."
    )
  );

  dataInserter.insertOrEditParsedEntity(
    "parameters", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Parameters",
        "Member title": "Parameter",
        "Member datatype": "c",
        "Member format": "@[parameters/format]",
        "Description": "@[parameters/desc]",
        // Let the Description header be: 'Qualitative parameters' instead of
        // just 'Parameters.'
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "parameters/format", "f", (
        "(" + [
          "Subject:@[entities]",
          "Quality:@[qualities]",
        ].join(",") +
        ")=>" +
        JSON.stringify({
          "Class": "@[parameters]",
          "Label": "%1 ⋲ %2",
          // "Label": "%1 ⥺ %2",
          // "Label": "%1 :≟ %2",
          "Subject": "%1",
          "Quality": "%2",
        })
    )
  );


  dataInserter.insertOrEditParsedEntity(
    "sets", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Sets",
        "Member title": "Set",
        "Member datatype": "c",
        "Member format": "@[sets/format]",
        "Description": "@[sets/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "sets/format", "f", (
        "(" + [
          "Object:@[entities]",
          "Relation:@[relations]",
        ].join(",") +
        ")=>" +
        JSON.stringify({
          "Class": "@[sets]",
          "Label": "%1 → %2",
          "Object": "%1",
          "Relation": "%2",
        })
    )
  );




  dataInserter.insertOrEditParsedEntity(
    "metrics", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Metrics",
        "Member title": "Metric",
        "Member datatype": "a",
        "Member format": "@[metrics/format]",
        "Description": "@[metrics/desc]",
        // Let the Description header be: 'Quality metrics' instead of just
        // 'Metrics.'
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "metrics/format", "f", (
        "(" + [
          "Name:string",
          "Unit?:string",
          "Interval labels?:[start:float,end:float,label:string][]",
          "Upper bound?:float",
          "Lower bound?:float",
          "High end?:float",
          "Low end?:float",
          "Default bin width?:float",
        ].join(",") +
        ")=>" +
        JSON.stringify({
          "Class": "@[metrics]",
          "Name": "%1",
          "Unit": "%2",
          "Interval labels": "%3",
          "Upper bound": "%4",
          "Lower bound": "%5",
          "High end": "%6",
          "Low end": "%7",
          "Object": "%8",
          "Default bin width":"%9",
        })
    )
  );




  dataInserter.insertOrEditParsedEntity(
    "qualities", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Qualities",
        "Member title": "Quality",
        "Special attributes": [
            ["Label", "string", "mandatory"],
            // Use purely lowercase labels only when the Description is left
            // out.
            ["Elaborate label", "string", "optional"],
            ["Domain", "@[classes]", "optional"],
            ["Unit", "string", "optional"],
            ["Lower bound", "float", "optional"],
            ["Upper bound", "float", "optional"],
            // ["Include lower bound", "bool=false", "optional"],
            // ["Include upper bound", "bool=false", "optional"],
        ],
        "Description": "@[qualities/desc]",
    }),
  );

  dataInserter.insertOrEditParsedEntity(
    "percentage qualities", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Percentage qualities",
        "Member title": "Percentage quality",
        "Parent class": "@[qualities]",
        "Special attributes": [
            ["Unit", "", "removed"],
            ["Lower bound", "", "removed"],
            ["Upper bound", "", "removed"],
        ],
        "Description": "@[percentage qualities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "predicate qualities", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Predicate qualities",
        "Member title": "Predicate quality",
        "Parent class": "@[qualities]",
        "Special attributes": [
            ["Unit", "", "removed"],
            ["Lower bound", "", "removed"],
            ["Upper bound", "", "removed"],
        ],
        "Description": "@[predicate qualities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relevancy qualities", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Relevancy qualities",
        "Member title": "Relevancy quality",
        "Parent class": "@[predicate qualities]",
        "Special attributes": [
            ["Object", "@[entities]", "mandatory"],
            ["Relation", "@[relations]", "mandatory"],
            ["Label", "", "removed"],
            ["Elaborate label", "", "removed"],
            ["Domain", "", "removed"],
            ["Description", "", "removed"],
        ],
        "Description": "@[relevancy qualities/desc]",
    }),
  );


  /* Some qualities */

  dataInserter.insertOrEditParsedEntity(
    "percentage qualities/probability", "a",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Probability",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/probability/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "percentage qualities/truthfulness", "a",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Truthfulness",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/truthfulness/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "percentage qualities/agreement", "a",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Agreement",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/agreement/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "qualities/good (no desc.)", "a",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "good",
        // We use lowercase when Description is not provided.
        "Description": "@[qualities/good (no desc.)/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/funny (no desc.)", "a",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "funny",
        "Description": "@[qualities/funny (no desc.)/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/good", "a",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Good",
        // We capitalize first letter when Description is provided.
        "Description": "@[qualities/good/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/funny", "a",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Funny",
        "Description": "@[qualities/funny/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/witty", "a",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Witty",
        "Description": "@[qualities/witty/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/spoilers", "a",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Spoilers",
        "Description": "@[qualities/spoilers/desc]",
    }),
  );

  dataInserter.insertOrEditParsedEntity(
    "qualities/price 0-1,000,000 $", "a",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Price",
        "Unit": "$",
        "Lower bound": 0,
        "Upper bound": 1000000,
        "Description": "@[qualities/price/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/durability 0-20 yr", "a",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Durability",
        "Unit": "yr",
        "Lower bound": 0,
        "Upper bound": 20,
        "Description": "@[qualities/durability/desc]",
    }),
  );


  /* Relations */

  dataInserter.insertOrEditParsedEntity(
    "relations", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Relations",
        "Member title": "Relation",
        "Special attributes": [
            ["Title", "string", "mandatory"],
            ["Elaborate title", "string", "optional"],
            ["Subject class", "@[classes]", "mandatory"],
            ["Object class", "@[classes]", "mandatory"],
        ],
        "Description": "@[relations/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/members", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Members",
        "Subject class": "@[entities]",
        "Object class": "@[classes]",
        "Description": "@[relations/members/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/subclasses", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Subclasses",
        "Subject class": "@[classes]",
        "Object class": "@[classes]",
        "Description": "@[relations/subclasses/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/relations", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Relations",
        "Subject class": "@[relations]",
        "Object class": "@[entities]",
        "Description": "@[relations/relations/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/relations for members", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Relations for members",
        "Subject class": "@[relations]",
        "Object class": "@[classes]",
        "Description": "@[relations/relations for members/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/sub-relations", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Sub-relations",
        "Subject class": "@[relations]",
        "Object class": "@[relations]",
        "Description": "@[relations/sub-relations/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/qualities", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Qualities",
        "Subject class": "@[qualities]",
        "Object class": "@[entities]",
        "Description": "@[relations/qualities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/qualities for members", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Qualities for members",
        "Subject class": "@[qualities]",
        "Object class": "@[classes]",
        "Description": "@[relations/qualities for members/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/sub-qualities", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Sub-qualities",
        "Subject class": "@[qualities]",
        "Object class": "@[qualities]",
        "Description": "@[relations/sub-qualities/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "relations/arguments", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Arguments",
        "Subject class": "@[scalar parameters]",
        "Object class": "@[scalar parameters]",
        "Description": "@[relations/arguments/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/comments", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Comments",
        "Subject class": "@[comments]",
        "Object class": "@[entities]",
        "Description": "@[relations/comments/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/reaction comments", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Reaction comments",
        "Subject class": "@[comments]", // ('comments' is intentional)
        "Object class": "@[entities]",
        "Description": "@[relations/reaction comments/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/informative comments", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Informative comments",
        "Subject class": "@[comments]", // (also intentional)
        "Object class": "@[entities]",
        "Description": "@[relations/informative comments/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/texts", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Texts",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/texts/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/discussions", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Discussions",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/discussions/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/facts", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Facts",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/facts/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/scale members", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Members",
        "Subject class": "@[entities]",
        "Object class": "@[scales]",
        "Description": "@[relations/members/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "texts", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Texts",
        "Member title": "Text",
        "Member datatype": "h",
        "Description": "@[texts/desc]",
    }),
  );

  // I think we can just implement Comments as XML texts instead, using some
  // 'context header'..
  // dataInserter.insertOrEditParsedEntity(
  //   "comments", "a",
  //   JSON.stringify({
  //       "Class": "@[classes]",
  //       "Name": "Comments",
  //       "Member title": "Comment",
  //       // "Parent class": "@[texts]",
  //       "Special attributes": [
  //           ["Topic", "@[entities]", "mandatory"],
  //           ["Description", "", "removed"],
  //       ],
  //       "Description": "@[comments/desc]",
  //   }),
  // );




  dataInserter.insertOrEditParsedEntity(
    "relations/workspaces", "a",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Workspaces",
        "Subject class": "@[workspaces]",
        "Object class": "@[users]",
        "Description": "@[relations/workspaces/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "workspaces", "a",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Workspaces",
        "Member title": "Workspace",
        "Special attributes": [
            ["Workspace object", "object", "mandatory"],
            ["Description", "", "removed"],
        ],
        "Description": "@[workspaces/desc]",
    }),
  );



}




export function insertInitialScores(dataInserter) {

  dataInserter.addEntitiesToListFromScaleKey(
    ["classes", "relations/members"],
    [
      ["classes", "10"],
      ["entities", "10"],
      ["users", "8"],
      ["scales", "5"],
      ["texts", "10"],
      ["comments", "9.5"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["classes", "relations/subclasses"],
    [
      ["users", "8"],
      ["scales", "8"],
      ["texts", "10"],
      ["comments", "9.5"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["entities", "relations/members"],
    [
      ["classes", "10"],
      ["entities", "6"],
      ["relations/members", "5"],
      ["texts", "10"],
      ["comments", "9.5"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["entities", "relations/subclasses"],
    [
      ["classes", "10"],
      ["users", "8"],
      ["scales", "8"],
      ["texts", "10"],
      ["comments", "9.5"],
    ],
  );



  dataInserter.addEntitiesToListFromScaleKey(
    ["classes", "relations/relations for members"],
    [
      ["relations/members", "10"],
      ["relations/subclasses", "6"],
      ["relations/texts", "9"],
      ["relations/comments", "8"],
    ],
  );


  dataInserter.addEntitiesToListFromScaleKey(
    ["relations/texts", "relations/sub-relations"],
    [
      ["relations/comments", "10"],
    ],
  );



  dataInserter.addEntitiesToListFromScaleKey(
    ["relations/texts", "relations/qualities"],
    [
      ["qualities/good (no desc.)", "9"],
      ["qualities/funny (no desc.)", "9"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["texts", "relations/qualities for members"],
    [
      ["qualities/good", "8"],
      ["qualities/funny (no desc.)", "6"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["qualities/good (no desc.)", "relations/sub-qualities"],
    [
      ["qualities/funny (no desc.)", "9"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["qualities/funny (no desc.)", "relations/sub-qualities"],
    [
      ["qualities/witty", "8"],
    ],
  );
}










export function getEntityIDModule(dataInserter, pathArr, objName) {
  var ret = "\nexport const " + objName + " = {\n";
  let initDatatypes = ["t", "u", "f", "c", "a", "8", "h", "j"];
  initDatatypes.forEach((datatype, ind) => {
    ret += '  "' + datatype + '": ' + (ind + 1) + ",\n";
  });
  pathArr.forEach(path => {
    let entID = dataInserter.getEntIDFromPath(path);
    ret += '  "' + path + '": ' + (entID || "null") + ",\n";
  });
  ret += "};"
  return ret;
}

export function copyEntityIDModuleToClipboard(dataInserter, pathArr, objName) {
  let ret = getEntityIDModule(dataInserter, pathArr, objName);
  navigator.clipboard.writeText(ret);
  return ret;
}



const basicEntPaths = [
  "classes",
  "entities",
  "workspaces",
  "scales",
  "relations",
  "qualities",
  "relevancy qualities",
  "predicate qualities",
  "relations/members",
  "relations/subclasses",
  "relations/relations",
  "relations/relations for members",
  "relations/sub-relations",
  "relations/qualities",
  "relations/qualities for members",
  "relations/sub-qualities",
];

export function copyBasicEntityIDModuleToClipboard(dataInserter) {
  return copyEntityIDModuleToClipboard(
    dataInserter, basicEntPaths, "basicEntIDs"
  );
}