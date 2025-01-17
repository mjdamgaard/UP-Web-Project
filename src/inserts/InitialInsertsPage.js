import {useCallback, useRef} from "react";
import {DataInserter} from "../classes/DataInserter.js";
import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";


const ORIG_DB_NODE_ID = "18";
const INITIAL_ADMIN_ID = "19";
const INITIAL_ADMIN_WORKSPACE_ID = "20";


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
        <button onClick={(event) => {
          copyFundamentalEntityIDCreateViewProgramToClipboard(dataInserter);
          event.target.setAttribute("style", "color:gray;");
        }}>
          Generate fundamental_entity_ids.sql
        </button>
      </div>
      <hr/>
      <div>
        <button onClick={() => insertInitialScores(dataInserter)}>
          Insert initial scores (but update [...]_entity_ids.js/sql first, and
          then recompile the view, and also reload this page first.)
        </button>
      </div>
      <hr/>
      <div>
        <button onClick={() => dataInserter.updateWorkspace()}>
          Update workspace
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
        "Parent class?:@[classes]",
        // "Member format?:(f::Function|t::Entity type)",
        "Member type?:t=@[4]",
        "Member format?:f",
        "Description?:h",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[classes]",
        "Name": "%1",
        "Parent class": "%2",
        "Member type": "%3",
        "Member format": "%4",
        "Description": "%5",
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
      '_',
      '@[2]',
      '_',
      '@[users/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "accounts", "r",
    [
      '@[classes/format]',
      '"Accounts"',
      '_',
      '@[3]',
      '_',
      '@[accounts/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "workspaces", "r",
    [
      '@[classes/format]',
      '"Workspaces"',
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
      '_',
      '@[5]',
      '_',
      '@[functions/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "json objects", "r",
    [
      '@[classes/format]',
      '"JSON objects"',
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
      '_',
      '@[8]',
      '_',
      '@[uft-8 texts/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "database nodes", "r",
    [
      '@[classes/format]',
      '"Database nodes"',
      '_',
      '@[9]',
      '_',
      '@[database nodes/desc]',
    ].join(","),
  );

  dataInserter.insertSubstituteOrEditEntity(
    "relations", "r",
    [
      '@[relations/format]',
      '"Relations"',
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
        // // "Domain:" +
        // //   "@[classes]::Class" + "|" +
        // //   "[Object:@[entities],Relation:@[relations]]::Set",
        // // "Domain:[Object:@[entities],Relation:@[relations]]",
        // "Object:@[entities]",
        // "Relation:@[relations]=@[relations/members]",
        "Domain?:@[classes]",
        "Metric:@[metrics]",
        "Description?:h",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[qualities]",
        "Label": "%1",
        "Domain": "%2",
        "Metric": "%3",
        "Description": "%4",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relevancy qualities", "r",
    [
      '@[classes/format]',
      '"Relevancy qualities"',
      '@[qualities]',
      '_',
      '@[relevancy qualities/format]',
      '@[relevancy qualities/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relevancy qualities/format", "f", (
      "relevancy_quality(" + [
        "Class:@[classes]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[relevancy qualities]",
        // // "Label": "Relevant for @{Object} → @{Relation}",
        // "Label": "Relevant for %1 → %2",
        "Label": "Relevant for %1",
        "Metric": "@[metrics/std predicate metric]",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relational classes", "r",
    [
      '@[classes/format]',
      '"Relational classes"',
      '@[classes]',
      '_',
      '@[relational classes/format]',
      '@[relational classes/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "relational classes/format", "f", (
      "relational_class(" + [
        "Object:@[entities]",
        "Relation:@[relations]",
        "Relation subject title:string",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[relational classes]",
        "Name": "%1 → %2",
        // // "Member title": "%1 → %3",
        // // "Member title": "%1 → %2[Subject title]",
        // "Member title": "%3",
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
    "semantic parameters", "r",
    [
      '@[classes/format]',
      '"Semantic parameters"',
      '_',
      '_',
      '@[semantic parameters/format]',
      '@[semantic parameters/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "semantic parameters/format", "f", (
      "semantic_parameter(" + [
        "Subject:@[entities]",
        "Quality:@[qualities]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[semantic parameters]",
        "Label": "%1 ⋲ %2",
        // "Label": "%1 ⥺ %2",
        // "Label": "%1 :≟ %2",
        "Subject": "%1",
        "Quality": "%2",
      })
    )
  );

  // dataInserter.insertSubstituteOrEditEntity(
  //   "sets", "r",
  //   [
  //     '@[classes/format]',
  //     '"Sets"',
  //     '_',
  //     '_',
  //     '@[sets/format]',
  //     '@[sets/desc]',
  //   ].join(","),
  // );
  // dataInserter.insertSubstituteOrEditEntity(
  //   "sets/format", "f", (
  //     "set(" + [
  //       "Object:@[entities]",
  //       "Relation:@[relations]",
  //     ].join(",") +
  //     ")=>" +
  //     JSON.stringify({
  //       "Class": "@[sets]",
  //       "Label": "%1 → %2",
  //       "Object": "%1",
  //       "Relation": "%2",
  //     })
  //   )
  // );

  dataInserter.insertSubstituteOrEditEntity(
    "metrics", "r",
    [
      '@[classes/format]',
      '"Quality metrics"',
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
    "min contribution lists", "r",
    [
      '@[classes/format]',
      '"Min contribution lists"',
      '@[lists]',
      '_',
      '@[min contribution lists/format]',
      '@[min contribution lists/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "min contribution lists/format", "f", (
      "min_contr(" + [
        "Editor:(@[users]::User|d::Database node)",
        "User group:@[user groups]",
        "Quality:@[qualities]",
        "Subject:@[entities]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[min contribution lists]",
        "Editor": "%1",
        "User group": "%2",
        "Quality": "%3",
        "Subject": "%4",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "max contribution lists", "r",
    [
      '@[classes/format]',
      '"Max contribution lists"',
      '@[lists]',
      '_',
      '@[min contribution lists/format]',
      '@[min contribution lists/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "max contribution lists/format", "f", (
      "max_contr(" + [
        "Editor:(@[users]::User|d::Database node)",
        "User group:@[user groups]",
        "Quality:@[qualities]",
        "Subject:@[entities]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[max contribution lists]",
        "Editor": "%1",
        "User group": "%2",
        "Quality": "%3",
        "Subject": "%4",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "score median lists", "r",
    [
      '@[classes/format]',
      '"Score median lists"',
      '@[lists]',
      '_',
      '@[score median lists/format]',
      '@[score median lists/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "score median lists/format", "f", (
      "score_medians(" + [
        "Editor:(@[users]::User|d::Database node)",
        "Has passed weight threshold:bool",
        "User group:@[user groups]",
        "Quality:@[qualities]",
        "Filter list?:@[lists]"
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[score median lists]",
        "Editor": "%1",
        "Has passed weight threshold": "%2",
        "User group": "%3",
        "Quality": "%4",
        "Filter list": "%5",
      })
    )
  );
  dataInserter.insertSubstituteOrEditEntity(
    "score2-ordered lists", "r",
    [
      '@[classes/format]',
      '"Float2-ordered lists"',
      '"Float2-ordered list"',
      '@[lists]',
      '_',
      '@[score2-ordered lists/format]',
      '@[score2-ordered lists/desc]',
    ].join(","),
  );
  dataInserter.insertSubstituteOrEditEntity(
    "score2-ordered lists/format", "f", (
      "score2_ordered_list(" + [
        "Editor:(@[users]::User|d::Database node)",
        "List:@[lists with score2 values]",
      ].join(",") +
      ")=>" +
      JSON.stringify({
        "Class": "@[score2-ordered lists]",
        "Editor": "%1",
        "List": "%2",
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
        [-10, -8, "extremely not"],
        [-8, -6, "very much not"],
        [-6, -4, "truly not"],
        [-4, -2, "somewhat not"],
        [-2, 0, "slightly not"],
        [0, 2, "slightly"],
        [2, 4, "somewhat"],
        [4, 6, "truly"],
        [6, 8, "very much"],
        [8, 10, "extremely"],
      ]),
      '-10',
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
      '@[semantic parameters]',
      '@[semantic parameters]',
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


export function getEntityIDCreateViewProgram(
  dataInserter, pathIdentPairs, viewName
) {
  var ret = (
    "\nDROP VIEW " + viewName + ";\n\n" +
    // "CREATE ALGORITHM = MERGE VIEW " + viewName + " AS"
    // ('ALGORITHM = MERGE' doesn't work here for some reason.)
    "CREATE VIEW " + viewName + " AS"
  );
  pathIdentPairs.forEach(([path, ident], ind) => {
    let entID = dataInserter.getEntIDFromPath(path);
    if (ind !== 0) {
      ret += '\n    UNION';
    }
    ret += '\n    SELECT "' + ident + '" AS ident, ' + entID + ' AS id';
  });
  ret += ";\n"
  return ret;
}

export function copyEntityIDCreateViewProgramToClipboard(
  dataInserter, pathIdentPairs, viewName
) {
  let ret = getEntityIDCreateViewProgram(
    dataInserter, pathIdentPairs, viewName
  );
  navigator.clipboard.writeText(ret);
  return ret;
}



const fundamentalEntPathsAndBackendIdentifiers = [
  ["user score lists/format", "user_score"],
  ["min contribution lists/format", "min_contr"],
  ["max contribution lists/format", "max_contr"],
  ["score median lists/format", "score_med"],
];

export function copyFundamentalEntityIDCreateViewProgramToClipboard(
  dataInserter
) {
  return copyEntityIDCreateViewProgramToClipboard(
    dataInserter, fundamentalEntPathsAndBackendIdentifiers,
    "FundamentalEntityIDs"
  );
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