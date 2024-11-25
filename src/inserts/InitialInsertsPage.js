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
        "Member title": "Entity",
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
        "Member title": "Class",
        "Special attributes": [
            ["Name", "string", "mandatory"],
            ["Member title", "string", "mandatory"],
            [
                "Parent class",
                "@[classes]=@[entities]",
                // (When missing, the parent class is the 'Entities' class.)
                "optional"
            ],
            ["Member datatype", "string='j'", "optional"],
            // If Member datatype is set (to not 'j'), then all 'Special
            // attributes' are interpreted to be 'removed.'
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
        "Member title": "User",
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
        "Member title": "Scale",
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
    "scalar parameters", "j",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Scalar parameters",
        "Member title": "Scalar parameter",
        "Special attributes": [
            ["Scale", "@[scales]", "mandatory"],
            ["Subject", "@[entities]", "mandatory"],
            ["Description", "", "removed"],
        ],
        "Anonymous creators only": true,
        "Description": "@[scalar parameters/desc]",
    }),
  );

  dataInserter.insertOrEditParsedEntity(
    "qualities", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Qualities",
        "Member title": "Quality",
        "Special attributes": [
            ["Label", "string", "mandatory"],
            // Use purely lowercase labels only when the Description is left
            // out.
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
    "percentage qualities", "j",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Percentage qualities",
        "Member title": "Percentage quality",
        "Parent class": "@[classes/qualities]",
        "Special attributes": [
            ["Unit", "", "removed"],
            ["Lower bound", "", "removed"],
            ["Upper bound", "", "removed"],
        ],
        "Description": "@[percentage qualities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "predicate qualities", "j",
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Predicate qualities",
        "Member title": "Predicate quality",
        "Parent class": "@[classes/qualities]",
        "Special attributes": [
            ["Unit", "", "removed"],
            ["Lower bound", "", "removed"],
            ["Upper bound", "", "removed"],
        ],
        "Description": "@[predicate qualities/desc]",
    }),
  );


    /* Some qualities */
  dataInserter.insertOrEditParsedEntity(
    "predicate qualities/relevant", "j",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Relevant and useful",
        "Description": "@[predicate qualities/relevant/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "percentage qualities/probability", "j",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Probability",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/probability/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "percentage qualities/truthfulness", "j",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Truthfulness",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/truthfulness/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "percentage qualities/agreement", "j",
    JSON.stringify({
        "Class": "@[qualities]",
        "Label": "Agreement",
        "Domain": "@[texts]",
        "Description": "@[percentage qualities/agreement/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "predicate qualities/good (no desc.)", "j",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "good",
        // We use lowercase when Description is not provided.
        "Description": "@[predicate qualities/good (no desc.)/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "predicate qualities/funny (no desc.)", "j",
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "funny",
        "Description": "@[predicate qualities/funny (no desc.)/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "predicate qualities/good", "j", 
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Good",
        // We capitalize first letter when Description is provided.
        "Description": "@[predicate qualities/good/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "predicate qualities/funny", "j", 
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Funny",
        "Description": "@[predicate qualities/funny/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "predicate qualities/witty", "j", 
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Witty",
        "Description": "@[predicate qualities/witty/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "predicate qualities/spoilers", "j", 
    JSON.stringify({
        "Class": "@[predicate qualities]",
        "Label": "Spoilers",
        "Description": "@[predicate qualities/spoilers/desc]",
    }),
  );

  dataInserter.insertOrEditParsedEntity(
    "qualities/price 0-1,000,000 $", "j", 
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
    "qualities/durability 0-20 yr", "j", 
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
    "relations", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Relations",
        "Member title": "Relation",
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
    "relations/sub-qualities", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Sub-qualities",
        "Subject class": "@[qualities]",
        "Object class": "@[qualities]",
        "Description": "@[relations/sub-qualities/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "relations/arguments", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Arguments",
        "Subject class": "@[scalar parameters]",
        "Object class": "@[scalar parameters]",
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
    "relations/texts", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Texts",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/texts/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/discussions", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Discussions",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/discussions/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/facts", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Facts",
        "Subject class": "@[texts]",
        "Object class": "@[entities]",
        "Description": "@[relations/facts/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "relations/scale members", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Members",
        "Subject class": "@[entities]",
        "Object class": "@[scales]",
        "Description": "@[relations/members/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "texts", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Texts",
        "Member title": "Text",
        "Member datatype": "x",
        "Description": "@[texts/desc]",
    }),
  );

  // I think we can just implement Comments as XML texts instead, using some
  // 'context header'..
  // dataInserter.insertOrEditParsedEntity(
  //   "comments", "j", 
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
        "Member title": "Workspace",
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
  "relations/qualities",
  "relations/qualities for members",
  "relations/sub-qualities",
];

export function copyBasicEntityIDModuleToClipboard(dataInserter) {
  return copyEntityIDModuleToClipboard(
    dataInserter, basicEntPaths, "basicEntIDs"
  );
}