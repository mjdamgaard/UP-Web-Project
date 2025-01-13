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
      '_',
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
    [
      '@[classes/format]',
      '"Classes"',
      '"Class"',
      '_',
      '_',
      '@[classes/format]',
      '@[classes/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "classes/format", "f", (
      "class(" + [
        "Name:string",
        "Member title:string",
        "Parent class?:@[classes]",
        // "Member format?:(f::Function|t::Entity type)",
        "Member type?:t=@[4]",
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
      '@[2]',
      '_',
      '@[users/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "workspaces", "r",
    [
      '@[classes/format]',
      '"Workspaces"',
      '"workspace"',
      '@[json objects]',
      '@[6]',
      '_',
      '@[workspaces/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "types", "r",
    [
      '@[classes/format]',
      '"Entity types"',
      '"Entity type"',
      '_',
      '@[1]',
      '_',
      '@[texts/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "functions", "r",
    [
      '@[classes/format]',
      '"Functions"',
      '"Function"',
      '_',
      '@[3]',
      '_',
      '@[functions/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "json objects", "r",
    [
      '@[classes/format]',
      '"JSON objects"',
      '"JSON object"',
      '_',
      '@[6]',
      '_',
      '@[json objects/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "texts", "r",
    [
      '@[classes/format]',
      '"Texts"',
      '"Text"',
      '_',
      '@[7]',
      '_',
      '@[texts/desc]', // Include 'HTML' in the title (as well as in the body).
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "uft-8 texts", "r",
    [
      '@[classes/format]',
      '"UTF-8 texts"',
      '"UTF-8 text"',
      '_',
      '@[8]',
      '_',
      '@[uft-8 texts/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations", "r",
    [
      '@[relations/format]',
      '"Relations"',
      '"Relation"',
      '_',
      '_',
      '@[relations/format]',
      '@[relations/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/format", "f", (
      "relation(" + [
        "Title:string",
        "Subject class:@[classes]",
        "Object class:@[classes]",
        "Description?:h",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[relations]",
        "Title": "%1",
        "Subject class": "%2",
        "Object class": "%3",
        "Description": "%4",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities", "r",
    [
      '@[classes/format]',
      '"Qualities"',
      '"Quality"',
      '_',
      '_',
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
        "Relation:@[relations]=@[relations/members]",
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
      '@[qualities]',
      '_',
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
      '_',
      '@[quality parameters/format]',
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
      '_',
      '_',
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
      '_',
      '_',
      '@[metrics/format]',
      '@[metrics/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/format", "f", (
      "metric(" + [
        "Name:string",
        "Unit?:string",
        "Prepend unit?:bool=false",
        "Interval labels?:[start:float,end:float,label:string][]",
        "Lower bound?:float",
        "Upper bound?:float",
        "Description:h",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[metrics]",
        "Name": "%1",
        "Unit": "%2",
        "Prepend unit": "%3",
        "Interval labels": "%4",
        "Lower bound": "%5",
        "Upper bound": "%6",
        "Description": "%7",
      })
    )
  );

  dataInserter.insertSubstituteOrEditEntity(
    "lists", "r",
    [
      '@[classes/format]',
      '"Lists"',
      '"List"',
      '_',
      '_',
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
      '@[lists]',
      '_',
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
      '@[lists]',
      '_',
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
      '@[lists]',
      '_',
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



  /* Some quality metrics*/

  dataInserter.insertSubstituteOrEditEntity(
    "metrics/std percentage metric", "r",
    [
      '@[metrics/format]',
      '"Standard percentage metric"',
      '"%"',
      '_',
      '_',
      '0',
      '100',
      '@[metrics/std percentage metric/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/std predicate metric", "r",
    [
      '@[metrics/format]',
      '"Standard predicate metric"',
      '"\\star"',
      '_',
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
      '@[metrics/std predicate metric/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/price in USD metric", "r",
    [
      '@[metrics/format]',
      '"Price metric (USD)"',
      '"$"',
      'true',
      '_',
      '_',
      '_',
      '@[metrics/price in USD metric/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/time in years metric", "r",
    [
      '@[metrics/format]',
      '"Time metric (years)"',
      '"yr"',
      '_',
      '_',
      '0',
      '_',
      '@[metrics/time in years metric/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/time in months metric", "r",
    [
      '@[metrics/format]',
      '"Time metric (months)"',
      '"months"',
      '_',
      '_',
      '0',
      '_',
      '@[metrics/time in months metric/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "metrics/time in days metric", "r",
    [
      '@[metrics/format]',
      '"Time metric (days)"',
      '"days"',
      '_',
      '_',
      '0',
      '_',
      '@[metrics/time in days metric/desc]',
    ].join(","),
  );


  /* Some qualities */

  dataInserter.insertSubstituteOrEditEntity(
    "qualities/probability", "r",
    [
      '@[qualities/format]',
      '"Probability"',
      '@[texts]',
      '@[relations/members]',
      '@[metrics/std percentage metric]',
      '@[qualities/probability/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/truthfulness", "r",
    [
      '@[qualities/format]',
      '"Truthfulness"',
      '@[texts]',
      '_',
      '@[metrics/std percentage metric]',
      '@[qualities/truthfulness/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/agreement", "r",
    [
      '@[qualities/format]',
      '"Agreement"',
      '@[texts]',
      '_',
      '@[metrics/std percentage metric]',
      '@[qualities/agreement/desc]',
    ].join(","),
  );

  dataInserter.insertSubstituteOrEditEntity(
    "qualities/good (no desc.)", "r",
    [
      '@[qualities/format]',
      '"good"', // We use lowercase when Description is not provided.
      '@[entities]',
      '_',
      '@[metrics/std predicate metric]',
      '_',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/funny (no desc.)", "r",
    [
      '@[qualities/format]',
      '"funny"', // We use lowercase when Description is not provided.
      '@[entities]',
      '_',
      '@[metrics/std predicate metric]',
      '_',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/good", "r",
    [
      '@[qualities/format]',
      '"Good"', // We capitalize first letter when Description is provided.
      '@[entities]',
      '_',
      '@[metrics/std predicate metric]',
      '@[qualities/good/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/funny", "r",
    [
      '@[qualities/format]',
      '"Funny"', // We capitalize first letter when Description is provided.
      '@[entities]',
      '_',
      '@[metrics/std predicate metric]',
      '@[qualities/funny/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/witty", "r",
    [
      '@[qualities/format]',
      '"Witty"',
      '@[entities]',
      '_',
      '@[metrics/std predicate metric]',
      '@[qualities/witty/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/spoilers", "r",
    [
      '@[qualities/format]',
      '"Spoilers"',
      '@[entities]',
      '_',
      '@[metrics/std predicate metric]',
      '@[qualities/spoilers/desc]',
    ].join(","),
  );

  dataInserter.insertSubstituteOrEditEntity(
    "qualities/price", "r",
    [
      '@[qualities/format]',
      '"Price"',
      '@[entities]',
      '_',
      '@[metrics/price in USD metric]',
      '@[qualities/price/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "qualities/durability in years", "r",
    [
      '@[qualities/format]',
      '"Durability (years)"',
      '@[entities]',
      '_',
      '@[metrics/time in years metric]',
      '@[qualities/durability in years/desc]',
    ].join(","),
  );


  /* Relations */

  dataInserter.insertSubstituteOrEditEntity(
    "relations/members", "r",
    [
      '@[relations/format]',
      '"Members"',
      '@[entities]',
      '@[classes]',
      '@[relations/members/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/subclasses", "r",
    [
      '@[relations/format]',
      '"Subclasses"',
      '@[classes]',
      '@[classes]',
      '@[relations/subclasses/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/relations", "r",
    [
      '@[relations/format]',
      '"Relations"',
      '@[relations]',
      '@[entities]',
      '@[relations/relations/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/relations for members", "r",
    [
      '@[relations/format]',
      '"Relations for members"',
      '@[relations]',
      '@[classes]',
      '@[relations/relations for members/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/sub-relations", "r",
    [
      '@[relations/format]',
      '"Sub-relations"',
      '@[relations]',
      '@[relations]',
      '@[relations/sub-relations/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/qualities", "r",
    [
      '@[relations/format]',
      '"Qualities"',
      '@[qualities]',
      '@[entities]',
      '@[relations/qualities/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/qualities for members", "r",
    [
      '@[relations/format]',
      '"Qualities for members"',
      '@[qualities]',
      '@[classes]',
      '@[relations/qualities for members/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/qualities for subjects", "r",
    [
      '@[relations/format]',
      '"Qualities for subjects"',
      '@[qualities]',
      '@[relations]',
      '@[relations/qualities for subjects/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/sub-qualities", "r",
    [
      '@[relations/format]',
      '"Sub-qualities"',
      '@[qualities]',
      '@[qualities]',
      '@[relations/sub-qualities/desc]',
    ].join(","),
  );

  dataInserter.insertSubstituteOrEditEntity(
    "relations/arguments", "r",
    [
      '@[relations/format]',
      '"Arguments"',
      '@[quality parameters]',
      '@[quality parameters]',
      '@[relations/arguments/desc]',
    ].join(","),
  );

  // (Recall that Comments are Texts that include some topic meta header.)
  dataInserter.insertSubstituteOrEditEntity(
    "relations/comments", "r",
    [
      '@[relations/format]',
      '"Comments"',
      '@[texts]',
      '@[entities]',
      '@[relations/comments/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/reaction comments", "r",
    [
      '@[relations/format]',
      '"Reaction  comments"',
      '@[texts]',
      '@[entities]',
      '@[relations/reaction comments/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/informative comments", "r",
    [
      '@[relations/format]',
      '"Informative  comments"',
      '@[texts]',
      '@[entities]',
      '@[relations/informative comments/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/texts", "r",
    [
      '@[relations/format]',
      '"Texts"',
      '@[texts]',
      '@[entities]',
      '@[relations/texts/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/discussions", "r",
    [
      '@[relations/format]',
      '"Discussions"',
      '@[texts]',
      '@[entities]',
      '@[relations/discussions/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relations/facts", "r",
    [
      '@[relations/format]',
      '"Facts"',
      '@[texts]',
      '@[entities]',
      '@[relations/facts/desc]',
    ].join(","),
  );


  dataInserter.insertSubstituteOrEditEntity(
    "relations/workspaces", "r",
    [
      '@[relations/format]',
      '"Workspaces"',
      '@[workspaces]',
      '@[users]',
      '@[relations/workspaces/desc]',
    ].join(","),
  );



}






export function insertInitialScores(dataInserter) {

  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/classes->members",
    "classes", "relations/members",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/classes->members",
        [
          ["classes", "10"],
          ["entities", "10"],
          ["users", "8"],
          ["scales", "5"],
          ["texts", "10"],
          ["comments", "9.5"],
        ],
      );
    }
  );
  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/classes->subclasses",
    "classes", "relations/subclasses",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/classes->subclasses",
        [
          ["users", "8"],
          ["qualities", "8"],
          ["texts", "10"],
          ["relations", "9.5"],
        ],
      );
    }
  );
  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/entities->members",
    "entities", "relations/members",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/entities->members",
        [
          ["classes", "10"],
          ["entities", "6"],
          ["relations/members", "5"],
          ["texts", "10"],
          ["relations", "9.5"],
        ],
      );
    }
  );
  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/entities->subclasses",
    "entities", "relations/subclasses",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/entities->subclasses",
        [
          ["classes", "10"],
          ["users", "8"],
          ["scales", "8"],
          ["texts", "10"],
          ["qualities", "9.5"],
        ],
      );
    }
  );



  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/classes->relations for members",
    "classes", "relations/relations for members",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/classes->relations for members",
        [
          ["relations/members", "10"],
          ["relations/subclasses", "6"],
          ["relations/texts", "9"],
          ["relations/comments", "8"],
        ],
      );
    }
  );


  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/(relations/texts)->sub-relations",
    "relations/texts", "relations/sub-relations",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/(relations/texts)->sub-relations",
        [
          ["relations/comments", "10"],
        ],
      );
    }
  );



  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/(relations/texts)->qualities for subjects",
    "relations/texts", "relations/qualities for subjects",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/(relations/texts)->qualities for subjects",
        [
          ["qualities/good (no desc.)", "9"],
          ["qualities/funny (no desc.)", "9"],
        ],
      );
    }
  );
  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/texts->qualities for members",
    "texts", "relations/qualities for members",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/texts->qualities for members",
        [
          ["qualities/good", "8"],
          ["qualities/funny (no desc.)", "6"],
        ],
      );
    }
  );
  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/(qualities/good (no desc.))->sub-qualities",
    "qualities/good (no desc.)", "relations/sub-qualities",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/(qualities/good (no desc.))->sub-qualities",
        [
          ["qualities/funny (no desc.)", "9"],
        ],
      );
    }
  );
  dataInserter.insertOrSubstituteRelevancyQualityEntity(
    "relevancy qualities/(qualities/funny (no desc.))->sub-qualities",
    "qualities/funny (no desc.)", "relations/sub-qualities",
    0, 0, (outID, exitCode) => {
      dataInserter.scoreWorkspaceEntitiesPublicly(
        "relevancy qualities/(qualities/funny (no desc.))->sub-qualities",
        [
          ["qualities/witty", "8"],
        ],
      );
    }
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
  "relations",
  "qualities",
  "relevancy qualities",
  "relevancy qualities/format",
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