import {useCallback, useRef} from "react";
import {DataInserter} from "../classes/DataInserter.js";
import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";


const INITIAL_ADMIN_ID = "9";
const INITIAL_ADMIN_WORKSPACE_ID = "10";


export const InitialInsertsPage = () => {
  const workspaceEntID = INITIAL_ADMIN_WORKSPACE_ID;
  const sesIDHex = "00".repeat(60);
  const getAccountData = useCallback((propName) => {
    return (propName === "userID") ? INITIAL_ADMIN_ID :
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
      {/* <div>
        <button disabled style={{color:"gray"}} onClick={(event) => {
          dataInserter.insertSubstituteOrEditEntity(
            "users/initial_admin", "r",
            JSON.stringify({
              "Class": "@[users]",
              "Username": "initial_admin",
            }),
            undefined, undefined, undefined,
            (outID) => {
              dataInserter.insertSubstituteOrEditEntity(
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
      <hr/> */}
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

  // dataInserter.insertSubstituteOrEditEntity(
  //   "entities", "r",
  //   JSON.stringify({
  //     "Class": "@[classes]",
  //     "Name": "Entities",
  //     "Member title": "Entity",
  //     "Description": "@[entities/desc]",
  //   }),
  // );
  dataInserter.insertSubstituteOrEditEntity(
    "entities", "r",
    [
      '@[classes/format]',
      '"Entities"',
      '"Entity"',
      '_',
      '@[entities/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "entities/desc", "h", (
      "<h1><class>Entities</class></h1>" +
      "..."
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "classes", "r",
    JSON.stringify({
      "Class": "@[classes]",
      "Name": "Classes",
      "Member title": "Class",
      "Member format": "@[classes/format]",
      "Description": "@[classes/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "classes", "r",
    [
      '@[classes/format]',
      '"Classes"',
      '"Class"',
      '@[classes/format]',
      '@[classes/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "classes/format", "f", (
      "class(" + [
        "Name:string",
        "Member title:string",
        "Member format?:f",
        "Description:h",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[classes]",
        "Name": "%1",
        "Member title": "%2",
        "Member format": "%3",
        "Description": "%4",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
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
  dataInserter.insertSubstituteOrEditEntity(
    "users", "r",
    [
      '@[classes/format]',
      '"Users"',
      '"User"',
      '_',
      '@[users/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities", "r",
    [
      '@[classes/format]',
      '"Qualities"',
      '"Quality"',
      '@[qualities/format]',
      '@[qualities/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/format", "f", (
      "quality(" + [
        "Label:string",
        // "Domain:" +
        //   "@[classes]::Class" + "|" +
        //   "[Object:@[entities],Relation:@[relations]]::Set",
        // "Domain:[Object:@[entities],Relation:@[relations]]",
        "Object:@[entities]",
        "Relation:@[relations]",
        "Metric:@[metrics]",
        "Description?:h",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[qualities]",
        "Label": "%1",
        "Object": "%2",
        "Relation": "%3",
        "Metric": "%4",
        "Description": "%5",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relevancy qualities", "r",
    [
      '@[classes/format]',
      '"Relevancy qualities"',
      '"Relevancy quality"',
      '@[relevancy qualities/format]',
      '@[relevancy qualities/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relevancy qualities/format", "f", (
      "relevancy_quality(" + [
        "Object:@[entities]",
        "Relation:@[relations]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[relevancy qualities]",
        // "Label": "Relevant for @{Object} → @{Relation}",
        "Label": "Relevant for %1 → %2",
        // // "Domain": "@[sets/format](%1,%2)",
        // // "Domain": {Object: "%1", Relation: "%2"},
        // "Domain": ["%1", "%2"],
        "Object": "%1",
        "Relation": "%2",
        "Metric": "@[metrics/std predicate metric]",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relevancy qualities/desc", "h", (
      "<h1>Scales</h1>" +
      "..."
    )
  );

  dataInserter.insertSubstituteOrEditEntity(
    "quality parameters", "r",
    [
      '@[classes/format]',
      '"Quality parameters"',
      '"Quality parameter"',
      '_',
      '@[quality parameters/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "quality parameters/format", "f", (
      "quality_parameter(" + [
        "Subject:@[entities]",
        "Quality:@[qualities]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[quality parameters]",
        "Label": "%1 ⋲ %2",
        // "Label": "%1 ⥺ %2",
        // "Label": "%1 :≟ %2",
        "Subject": "%1",
        "Quality": "%2",
      })
    )
  );

  dataInserter.insertSubstituteOrEditEntity(
    "sets", "r",
    [
      '@[classes/format]',
      '"Sets"',
      '"Set"',
      '@[sets/format]',
      '@[sets/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "sets/format", "f", (
      "set(" + [
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

  dataInserter.insertSubstituteOrEditEntity(
    "metrics", "r",
    [
      '@[classes/format]',
      '"Quality metrics"',
      '"Quality metric"',
      '@[metrics/format]',
      '@[metrics/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/format", "f", (
      "metric(" + [
        "Name:string",
        "Unit?:string",
        "Interval labels?:[start:float,end:float,label:string][]",
        "Lower bound?:float",
        "Upper bound?:float",
        "High end?:float",
        "Low end?:float",
        "Description:h",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[metrics]",
        "Name": "%1",
        "Unit": "%2",
        "Interval labels": "%3",
        "Lower bound": "%4",
        "Upper bound": "%5",
        "High end": "%6",
        "Low end": "%7",
        "Description": "%8",
      })
    )
  );

  // dataInserter.insertSubstituteOrEditEntity(
  //   "metrics/std percentage metric", "r",
  //   JSON.stringify({
  //     "Class": "@[metrics]",
  //     "Name": "Standard percentage metric",
  //     "Unit":"%",
  //     "Lower bound": 0,
  //     "Upper bound": 100,
  //     "Description": "@[metrics/std percentage metric/desc]",
  //   }),
  // );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/std percentage metric", "r",
    [
      '@[metrics/format]',
      '"Standard percentage metric"',
      '"%"',
      '_',
      '0',
      '100',
      '_',
      '_',
      '@[metrics/std percentage metric/desc]',
    ].join(","),
  );
  // dataInserter.insertSubstituteOrEditEntity(
  //   "metrics/std predicate metric", "r",
  //   JSON.stringify({
  //     "Class": "@[metrics]",
  //     "Name": "Standard predicate metric",
  //     "Unit": "\\star",
  //     "Interval labels": [
  //         [0, 1, "extremely not"],
  //         [1, 2, "very much not"],
  //         [2, 3, "truly not"],
  //         [3, 4, "somewhat not"],
  //         [4, 5, "slightly not"],
  //         [5, 6, "slightly"],
  //         [6, 7, "somewhat"],
  //         [7, 8, "truly"],
  //         [8, 9, "very much"],
  //         [9, 10, "extremely"],
  //     ],
  //     "Lower bound": 0,
  //     "Upper bound": 10,
  //     "Description": "@[metrics/std predicate metric/desc]",
  //   }),
  // );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/std predicate metric", "r",
    [
      '@[metrics/format]',
      '"Standard predicate metric"',
      '"\\star"',
      JSON.stringify([
        [0, 1, "extremely not"],
        [1, 2, "very much not"],
        [2, 3, "truly not"],
        [3, 4, "somewhat not"],
        [4, 5, "slightly not"],
        [5, 6, "slightly"],
        [6, 7, "somewhat"],
        [7, 8, "truly"],
        [8, 9, "very much"],
        [9, 10, "extremely"],
      ]),
      '0',
      '10',
      '_',
      '_',
      '@[metrics/std predicate metric/desc]',
    ].join(","),
  );

  dataInserter.insertSubstituteOrEditEntity(
    "lists", "r",
    [
      '@[classes/format]',
      '"Lists"',
      '"List"',
      '_',
      '@[lists/desc]',
    ].join(","),
  );

  dataInserter.insertSubstituteOrEditEntity(
    "user score lists", "r",
    [
      '@[classes/format]',
      '"User score lists"',
      '"User score list"',
      '@[user score lists/format]',
      '@[user score lists/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "user score lists/format", "f", (
      "user_scores(" + [
        "User:u",
        "Quality:@[qualities]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[user score lists]",
        "User": "%1",
        "Quality": "%2",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "score median lists", "r",
    [
      '@[classes/format]',
      '"Score median lists"',
      '"Score median list"',
      '@[score median lists/format]',
      '@[score median lists/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "score median lists/format", "f", (
      "score_medians(" + [
        "Has passed weight threshold:bool",
        "User group:@[user groups]",
        "Quality:@[qualities]",
        "Filter list?:@[lists]"
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[score median lists]",
        "Has passed weight threshold": "%1",
        "User group": "%2",
        "Quality": "%3",
        "Filter list": "%4",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "float2-ordered lists", "r",
    [
      '@[classes/format]',
      '"Float2-ordered lists"',
      '"Float2-ordered list"',
      '@[float2-ordered lists/format]',
      '@[float2-ordered lists/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "float2-ordered lists/format", "f", (
      "float2_ordered_list(" + [
        "List:@[lists with float2 values]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[float2-ordered lists]",
        "List": "%1",
      })
    )
  );








  /* Some qualities */

  dataInserter.insertSubstituteOrEditEntity(
    "percentage qualities/probability", "r",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Probability",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/probability/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "percentage qualities/truthfulness", "r",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Truthfulness",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/truthfulness/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "percentage qualities/agreement", "r",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Agreement",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/agreement/desc]",
    }),
  );


  dataInserter.insertSubstituteOrEditEntity(
    "qualities/good (no desc.)", "r",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "good",
        // We use lowercase when Description is not provided.
        "Description": "@[qualities/good (no desc.)/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/funny (no desc.)", "r",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "funny",
        "Description": "@[qualities/funny (no desc.)/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/good", "r",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Good",
        // We capitalize first letter when Description is provided.
        "Description": "@[qualities/good/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/funny", "r",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Funny",
        "Description": "@[qualities/funny/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/witty", "r",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Witty",
        "Description": "@[qualities/witty/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/spoilers", "r",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Spoilers",
        "Description": "@[qualities/spoilers/desc]",
    }),
  );

  dataInserter.insertSubstituteOrEditEntity(
    "qualities/price 0-1,000,000 $", "r",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Price",
        "Unit": "$",
        "Lower bound": 0,
        "Upper bound": 1000000,
        "Description": "@[qualities/price/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/durability 0-20 yr", "r",
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

  dataInserter.insertSubstituteOrEditEntity(
    "relations", "r",
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
  dataInserter.insertSubstituteOrEditEntity(
    "relations/members", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Members",
        "Subject class": "@[entities]",
        "Object class": "@[classes]",
        "Description": "@[relations/members/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/subclasses", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Subclasses",
        "Subject class": "@[classes]",
        "Object class": "@[classes]",
        "Description": "@[relations/subclasses/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/relations", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Relations",
        "Subject class": "@[relations]",
        "Object class": "@[entities]",
        "Description": "@[relations/relations/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/relations for members", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Relations for members",
        "Subject class": "@[relations]",
        "Object class": "@[classes]",
        "Description": "@[relations/relations for members/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/sub-relations", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Sub-relations",
        "Subject class": "@[relations]",
        "Object class": "@[relations]",
        "Description": "@[relations/sub-relations/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/qualities", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Qualities",
        "Subject class": "@[qualities]",
        "Object class": "@[entities]",
        "Description": "@[relations/qualities/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/qualities for members", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Qualities for members",
        "Subject class": "@[qualities]",
        "Object class": "@[classes]",
        "Description": "@[relations/qualities for members/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/sub-qualities", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Sub-qualities",
        "Subject class": "@[qualities]",
        "Object class": "@[qualities]",
        "Description": "@[relations/sub-qualities/desc]",
    }),
  );


  dataInserter.insertSubstituteOrEditEntity(
    "relations/arguments", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Arguments",
        "Subject class": "@[scalar parameters]",
        "Object class": "@[scalar parameters]",
        "Description": "@[relations/arguments/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/comments", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Comments",
        "Subject class": "@[comments]",
        "Object class": "@[entities]",
        "Description": "@[relations/comments/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/reaction comments", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Reaction comments",
        "Subject class": "@[comments]", // ('comments' is intentional)
        "Object class": "@[entities]",
        "Description": "@[relations/reaction comments/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/informative comments", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Informative comments",
        "Subject class": "@[comments]", // (also intentional)
        "Object class": "@[entities]",
        "Description": "@[relations/informative comments/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/texts", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Texts",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/texts/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/discussions", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Discussions",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/discussions/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/facts", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Facts",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/facts/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/scale members", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Members",
        "Subject class": "@[entities]",
        "Object class": "@[scales]",
        "Description": "@[relations/members/desc]",
    }),
  );


  dataInserter.insertSubstituteOrEditEntity(
    "texts", "r",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Texts",
        "Member title": "Text",
        "Description": "@[texts/desc]",
    }),
  );

  // I think we can just implement Comments as XML texts instead, using some
  // 'context header'..
  // dataInserter.insertSubstituteOrEditEntity(
  //   "comments", "r",
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




  dataInserter.insertSubstituteOrEditEntity(
    "relations/workspaces", "r",
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Workspaces",
        "Subject class": "@[workspaces]",
        "Object class": "@[users]",
        "Description": "@[relations/workspaces/desc]",
    }),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "workspaces", "r",
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
  let initEntTypes = ["t", "u", "f", "r", "r", "8", "h", "j"];
  initEntTypes.forEach((entType, ind) => {
    ret += '  "' + entType + '": ' + (ind + 1) + ",\n";
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