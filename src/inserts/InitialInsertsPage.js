import {useCallback, useRef} from "react";
import {DataInserter} from "../classes/DataInserter.js";
import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";



export const InitialInsertsPage = () => {
  const workspaceEntID = "2";
  const sesIDHex = "00".repeat(60);
  const getAccountData = useCallback((propName) => {
    return (propName === "userID") ? "1" :
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
            "users/initial_admin", "j",
            JSON.stringify({
              "Class": "@[users]",
              "Username": "initial_admin",
              "Description": "@[users/initial_admin/desc]",
            }),
            undefined, undefined, undefined, undefined,
            (outID) => {
              dataInserter.insertOrEditParsedEntity(
                "workspaces/initial_admin's workspace", "j", 
                JSON.stringify({
                    "Class": "@[workspaces]",
                    "Workspace object": {},
                }),
                0, 1, 1, 0,
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

  // dataInserter.insertOrEditParsedEntity(
  //   "users/initial_admin", "j",
  //   JSON.stringify({
  //     "Class": "@[users]",
  //     "Username": "initial_admin",
  //     "Description": "@[users/initial_admin/desc]",
  //   }),
  // );

  // dataInserter.insertOrEditParsedEntity(
  //   "workspaces/initial_admin's workspace", "j", 
  //   JSON.stringify({
  //       "Class": "@[workspaces]",
  //       "Workspace object": {},
  //   }),
  //   0, 1, 1, 0,
  //   (outID) => {
  //     event.currentTarget.setAttribute("style", "color:gray;")
  //   },
  // );

  dataInserter.insertOrEditParsedEntity(
    "entities", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Entities",
        "Special attributes": [
            ["Class", "@[classes]", "mandatory"],
            ["Description", "x", "optional"],
        ],
        "Rejects submissions": true,
        "Description": "@[entities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "entities/desc", "x", (
        "<h1><class>Entities</class></h1>" +
        "..."
    )
  );
  dataInserter.insertOrEditParsedEntity(
    "classes", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Classes",
        "Special attributes": [
            ["Name", "string", "mandatory"],
            [
                "Parent class",
                "@[classes]=@[entities]",
                // (When missing, the parent class is the 'Entities' class.)
                "optional"
            ],
            [
                "Special attributes",
                "[[Attribute name,Type,Option]]",
                "optional"
            ],
            ["Rejects submissions", "bool=false", "optional"],
            ["Anonymous creators only", "bool=false", "optional"],
            // ('false' is the default value when missing)
            ["Description", "x", "mandatory"], // (Overwrites "optional")
        ],
        "Description": "@[classes/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "classes/desc", "x", ( // ('x' for 'XML,' or simply 'teXt.')
        "<h1>Classes</h1>" +
        "<h2>Description</h2>" +
        "<p>A class of all class entities (including itself). " +
        "Classes both serve as a broad way of categorizing entities, " +
        "and they are also used to define the meaning of their instances, " +
        "as their <attr>description</attr> will be shown on the info page " +
        "of each of their instances." +
        "</p>" +
        "<p>As an example, this description of the <class>class</class> " +
        "entity will be shown on the info page of all class entities, just " +
        "above the description of the general <class>entity</class> class." +
        "</p>" +
        "<p>The <attr>description</attr> of a class should include a " +
        "section of 'special attributes,' if it defines a new attribute " +
        "or redefines an attribute of a superclass (opposite of 'subclass'). " +
        "As an example, since the <class>class</class> class introduces an " +
        "optional <attr>superclass</attr> attribute and expands on the " +
        "<attr>description</attr> attribute, the following 'special " +
        "attributes' section will include a description of both these " +
        "attributes." +
        "</p>" +
        "<h2>Special attributes</h2>" +
        "<h3><attr>description</attr></h3>" +
        "<flags><flag>mandatory</flag><flag>extends superclass</flag></flags>" +
        "<p>..." +
        "</p>" +
        "<h3><attr>superclass</attr></h3>" +
        "<flags><flag>optional</flag></flags>" +
        "<p>..." +
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
    "users", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Users",
        "Special attributes": [
            ["Username", "string", "mandatory"],
        ],
        "Rejects submissions": true,
        "Description": "@[users/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "scales", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Scales",
        "Special attributes": [
            ["Object", "@[entities]", "mandatory"],
            ["Relation", "@[relations]", "mandatory"],
            ["Quality", "@[qualities]", "mandatory"],
            ["Description", "", "removed"],
        ],
        "Anonymous creators only": true,
        "Description": "@[scales/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "scales/desc", "x", (
      "<h1>Scales</h1>" +
      "..."
    )
  );

  dataInserter.insertOrEditParsedEntity(
    "parameters", "j", // Maybe just 'parameters' instead..?
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Parameters",
        "Special attributes": [
            ["Scale", "@[scales]", "mandatory"],
            ["Subject", "@[entities]", "mandatory"],
            ["Description", "", "removed"],
        ],
        "Anonymous creators only": true,
        "Description": "@[parameters/desc]",
    }),
  );

  dataInserter.insertOrEditParsedEntity(
    "qualities", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Qualities",
        "Special attributes": [
            ["Label", "string", "mandatory"],
            // Use purely lowercase labels only when the Description is left
            // out.
            // ["Scale type", "@[scale types]", "mandatory"],
            ["Unit", "string", "optional"],
            // ["Lower bound", "float", "optional"],
            // ["Upper bound", "float", "optional"],
            ["Low end", "float", "mandatory"],
            ["High end", "float", "mandatory"],
            ["Has lower bound", "bool=true", "optional"],
            ["Has upper bound", "bool=true", "optional"],
            // ["Cutoff point", "float", "optional"],
        ],
        "Description": "@[qualities/desc]",
    }),
  );

  // dataInserter.insertOrEditParsedEntity(
  //   "scale types", "j", 
  //   JSON.stringify({
  //       "Class": "@[classes]",
  //       "Name": "Scale types",
  //       "Special attributes": [
  //           ["Name", "string", "mandatory"],
  //           ["Unit", "string", "optional"],
  //           ["Lower bound", "float", "optional"],
  //           ["Upper bound", "float", "optional"],
  //           ["Description", "x", "mandatory"],
  //       ],
  //       "Description": "@[scale types/desc]",
  //   }),
  // );

  //   /* Some scale types */
  // dataInserter.insertOrEditParsedEntity(
  //   "scale types/percentage scale", "j", 
  //   JSON.stringify({
  //       "Class": "@[scale types]",
  //       "Name": "Percentage scale",
  //       "Unit": "%",
  //       "Lower bound": 0,
  //       "Upper bound": 100,
  //       "Description": "@[scale types/percentage scale/desc]",
  //   }),
  // );
  // dataInserter.insertOrEditParsedEntity(
  //   "scale types/relative scale", "j", 
  //   JSON.stringify({
  //       "Class": "@[classes]",
  //       "Name": "Relative scale",
  //       "Description": "@[scale types/relative scale/desc]",
  //       // Description should say that 0 is generally considered the cutoff
  //       // point of when the quality applies or not, especially when the
  //       // quality is an adjective, or more generally describes a predicate.
  //   }),
  // );
  // dataInserter.insertOrEditParsedEntity(
  //   "scale types/value scale", "j", 
  //   JSON.stringify({
  //       "Class": "@[classes]",
  //       "Name": "Value scale",
  //       "Description": "@[scale types/value scale/desc]",
  //   }),
  // );
  // dataInserter.insertOrEditParsedEntity(
  //   "scale types/5-star scale", "j", 
  //   JSON.stringify({
  //       "Class": "@[classes]",
  //       "Name": "5-star scale",
  //       "Description": "@[scale types/5-star scale/desc]",
  //   }),
  // );
  // dataInserter.insertOrEditParsedEntity(
  //   "scale types/10-star scale", "j", 
  //   JSON.stringify({
  //       "Class": "@[classes]",
  //       "Name": "10-star scale",
  //       "Description": "@[scale types/10-star scale/desc]",
  //   }),
  // );


    /* Some qualities */
  dataInserter.insertOrEditParsedEntity(
    "qualities/relevant", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Relevant",
        "Unit": "\\stars",
        "Low end": 0,
        "High end": 10,
        // "Cutoff point": 5,
        // "Scale type": "@[scale types/relative scale]",
        "Description": "@[qualities/relevant/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/probability", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Probability",
        "Unit": "%",
        // "Lower bound": 0,
        // "Upper bound": 100,
        "Low end": 0,
        "High end": 100,
        // "Scale type": "@[scale types/percentage scale]",
        "Description": "@[qualities/probability/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/agreement", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Agreement",
        "Unit": "%",
        "Low end": 0,
        "High end": 100,
        "Description": "@[qualities/agreement/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "qualities/good (no desc.)", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "good",
        "Unit": "\\stars",
        "Low end": 0,
        "High end": 10,
        // We use lowercase when Description is not provided.
        "Scale type": "@[scale types/relative scale]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/funny (no desc.)", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "funny",
        "Unit": "\\stars",
        "Low end": 0,
        "High end": 10,
        "Scale type": "@[scale types/relative scale]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/good", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Good",
        "Unit": "\\stars",
        "Low end": 0,
        "High end": 10,
        // We capitalize first letter when Description is provided.
        "Scale type": "@[scale types/relative scale]",
        "Description": "@[qualities/good/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/funny", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Funny",
        "Unit": "\\stars",
        "Low end": 0,
        "High end": 10,
        "Scale type": "@[scale types/relative scale]",
        "Description": "@[qualities/funny/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/spoilers", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Spoilers",
        "Unit": "\\stars",
        "Low end": 0,
        "High end": 10,
        "Scale type": "@[scale types/relative scale]",
        "Description": "@[qualities/spoilers/desc]",
    }),
  );

  dataInserter.insertOrEditParsedEntity(
    "qualities/price 0-1,000,000 $", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Price",
        "Unit": "$",
        "Low end": 0,
        "High end": 1000000,
        "Has upper bound": false,
        "Scale type": "@[scale types/value scale]",
        "Description": "@[qualities/price/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/durability 0-20 yr", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Durability",
        "Unit": "yr",
        "Low end": 0,
        "High end": 20,
        "Has upper bound": false,
        "Scale type": "@[scale types/value scale]",
        "Description": "@[qualities/durability/desc]",
    }),
  );


    /* Relations */
  dataInserter.insertOrEditParsedEntity(
    "relations", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Relations",
        "Special attributes": [
            ["Title", "string", "mandatory"],
            ["Subject class", "@[classes]", "mandatory"],
            ["Object class", "@[classes]", "mandatory"],
            // ["Description", "x", "mandatory"],
        ],
        "Description": "@[relations/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/members", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Members",
        "Subject class": "@[entities]",
        "Object class": "@[classes]",
        "Description": "@[relations/members/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/subclasses", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Subclasses",
        "Subject class": "@[classes]",
        "Object class": "@[classes]",
        "Description": "@[relations/subclasses/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/relations", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Relations",
        "Subject class": "@[relations]",
        "Object class": "@[entities]",
        "Description": "@[relations/relations/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/relations for members", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Relations for members",
        "Subject class": "@[relations]",
        "Object class": "@[classes]",
        "Description": "@[relations/relations for members/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/sub-relations", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Sub-relations",
        "Subject class": "@[relations]",
        "Object class": "@[relations]",
        "Description": "@[relations/sub-relations/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/sub-relations for members", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Sub-relations for members",
        "Subject class": "@[relations]",
        "Object class": "@[classes]",
        "Description": "@[relations/sub-relations for members/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/qualities", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Qualities",
        "Subject class": "@[qualities]",
        "Object class": "@[entities]",
        "Description": "@[relations/qualities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/qualities for members", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Qualities for members",
        "Subject class": "@[qualities]",
        "Object class": "@[classes]",
        "Description": "@[relations/qualities for members/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "relations/arguments", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Arguments",
        "Subject class": "@[parameters]",
        "Object class": "@[parameters]",
        "Description": "@[relations/arguments/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/comments", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Comments",
        "Subject class": "@[comments]",
        "Object class": "@[entities]",
        "Description": "@[relations/comments/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/reaction comments", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Reaction comments",
        "Subject class": "@[comments]", // ('comments' is intentional)
        "Object class": "@[entities]",
        "Description": "@[relations/reaction comments/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/informative comments", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Informative comments",
        "Subject class": "@[comments]", // (also intentional)
        "Object class": "@[entities]",
        "Description": "@[relations/informative comments/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/statements", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Statements",
        "Subject class": "@[statements]",
        "Object class": "@[entities]",
        "Description": "@[relations/statements/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/discussions", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Discussions",
        "Subject class": "@[statements]",
        "Object class": "@[entities]",
        "Description": "@[relations/discussions/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/facts", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Facts",
        "Subject class": "@[statements]",
        "Object class": "@[entities]",
        "Description": "@[relations/facts/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "statements", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Statements",
        "Special attributes": [
            ["Text", "x", "mandatory"],
            ["Is claimed by the creator", "bool=false", "optional"],
            ["Is objective", "bool=false", "optional"],
            ["Description", "", "removed"],
        ],
        "Description": "@[statements/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "comments", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Comments",
        "Parent class": "@[statements]",
        "Special attributes": [
            ["Topic", "@[entities]", "mandatory"],
            ["Is claimed by the creator", "", "removed"],
        ],
        "Description": "@[comments/desc]",
    }),
  );




  dataInserter.insertOrEditParsedEntity(
    "relations/workspaces", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Workspaces",
        "Subject class": "@[workspaces]",
        "Object class": "@[users]",
        "Description": "@[relations/workspaces/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "workspaces", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Workspaces",
        "Special attributes": [
            ["Workspace object", "object", "mandatory"],
            ["Description", "", "removed"],
        ],
        "Description": "@[workspaces/desc]",
    }),
  );



  /* Scales */

  // Ah, I can't do this, since I can't edit them when isEditable = 0, and this
  // means that the paths need to be resolved at the time they are inserted.
  // I could make an extra button to insert scales, but I also don't need these
  // scale paths now.

  // dataInserter.insertParsedEntity(
  //   "scales/entities->subclasses", "j", 
  //   JSON.stringify({
  //       "Class": "@[scales]",
  //       "Object": "@[entities]",
  //       "Relation": "@[relations/subclasses]",
  //       "Quality": "@[qualities/relevant]",
  //   }),
  //   1, 0, 0, 1,
  // );
  // dataInserter.insertParsedEntity(
  //   "scales/entities->members", "j", 
  //   JSON.stringify({
  //       "Class": "@[scales]",
  //       "Object": "@[entities]",
  //       "Relation": "@[relations/members]",
  //       "Quality": "@[qualities/relevant]",
  //   }),
  //   1, 0, 0, 1,
  // );
  // dataInserter.insertParsedEntity(
  //   "scales/classes->subclasses", "j", 
  //   JSON.stringify({
  //       "Class": "@[scales]",
  //       "Object": "@[classes]",
  //       "Relation": "@[relations/subclasses]",
  //       "Quality": "@[qualities/relevant]",
  //   }),
  //   1, 0, 0, 1,
  //   (outID, exitCode) => console.log(exitCode)
  // );
  // dataInserter.insertParsedEntity(
  //   "scales/classes->members", "j", 
  //   JSON.stringify({
  //       "Class": "@[scales]",
  //       "Object": "@[classes]",
  //       "Relation": "@[relations/members]",
  //       "Quality": "@[qualities/relevant]",
  //   }),
  //   1, 0, 0, 1,
  // );


}




export function insertInitialScores(dataInserter) {

  dataInserter.addEntitiesToListFromScaleKey(
    ["classes", "relations/members"],
    [
      ["classes", "10"],
      ["entities", "10"],
      ["users", "8"],
      ["scales", "5"],
      ["statements", "10"],
      ["comments", "9.5"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["classes", "relations/subclasses"],
    [
      ["users", "8"],
      ["scales", "8"],
      ["statements", "10"],
      ["comments", "9.5"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["entities", "relations/members"],
    [
      ["classes", "10"],
      ["entities", "6"],
      ["relations/members", "5"],
      ["statements", "10"],
      ["comments", "9.5"],
    ],
  );
  dataInserter.addEntitiesToListFromScaleKey(
    ["entities", "relations/subclasses"],
    [
      ["classes", "10"],
      ["users", "8"],
      ["scales", "8"],
      ["statements", "10"],
      ["comments", "9.5"],
    ],
  );



  dataInserter.addEntitiesToListFromScaleKey(
    ["classes", "relations/relations for members"],
    [
      ["relations/members", "10"],
      ["subclasses", "6"],
      ["relations/statements", "9"],
      ["relations/comments", "8"],
    ],
  );


  dataInserter.addEntitiesToListFromScaleKey(
    ["relations/statements", "relations/sub-relations"],
    [
      ["relations/comments", "10"],
    ],
  );
  
}










export function getEntityIDModule(dataInserter, pathArr, objName) {
  var ret = "\nexport const " + objName + " = {\n";
  pathArr.forEach(path => {
    let entID = dataInserter.getEntIDFromPath(path);
    ret += '  "' + path + '": ' + (entID || "null") + ",\n"
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
  "qualities/relevant",
  "relations/members",
  "relations/subclasses",
  "relations/relations",
  "relations/relations for members",
  "relations/sub-relations",
  "relations/sub-relations for members",
  "relations/qualities",
  "relations/qualities for members",
];

export function copyBasicEntityIDModuleToClipboard(dataInserter) {
  return copyEntityIDModuleToClipboard(
    dataInserter, basicEntPaths, "basicEntIDs"
  );
}