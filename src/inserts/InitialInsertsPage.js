import {useCallback, useRef} from "react";
import {DataInserter} from "../classes/DataInserter.js";



export const InitialInsertsPage = () => {
  // TODO: Implement a scale from which to fetch a user's workspace, instead
  // of this temporary solution of just storing it in localStorage.
  const workspaceEntID = localStorage.getItem("workspaceEntID");
  const sesIDHex = "00".repeat(60);
  const getAccountData = useCallback((propName) => {
    return (propName === "userID") ? "1" :
      (propName === "sesIDHex") ? sesIDHex : null;
  });
  const dataInserter = useRef(
    new DataInserter(getAccountData, workspaceEntID)
  ).current;
  if (workspaceEntID) {
    dataInserter.fetchWorkspaceObject();
  }

  return (
    <div>
      <h2>Initial inserts</h2>
      <br/>
      <div>
        <button onClick={() => localStorage.removeItem("workspaceEntID")}>
          Clear workspaceEntID
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
        <button onClick={() => {
          dataInserter.createWorkspace((outID) => {
            localStorage.setItem("workspaceEntID", outID);
          });
        }}>
          Create workspace
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

  dataInserter.insertOrEditParsedEntity(
    "users/initial_admin", "j",
    JSON.stringify({
      "Class": "@[users]",
      "Username": "initial_admin",
      "Description": "@[users/initial_admin/desc]",
    }),
  );
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
    "scalar parameters", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Scalar parameters",
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
        "Special attributes": [
            ["Tag", "string", "mandatory"],
            // Use purely lowercase tags only when the Description is left out.
            ["Scale type", "@[scale types]", "mandatory"],
        ],
        "Description": "@[qualities/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "scale types", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Scale types",
        "Special attributes": [
            ["Name", "string", "mandatory"],
            ["Description", "x", "mandatory"],
        ],
        "Description": "@[scale types/desc]",
    }),
  );

    /* Some scale types */
  dataInserter.insertOrEditParsedEntity(
    "scale types/percentage scale", "j", 
    JSON.stringify({
        "Class": "@[scale types]",
        "Name": "Percentage scale",
        "Description": "@[scale types/percentage scale/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "scale types/relative scale", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Relative scale",
        "Description": "@[scale types/relative scale/desc]",
        // Description should say that 'this scale type is treated as the
        // 0-10-star scale type, until a point when it is changed to an
        // unbounded relative scale,' and then go on to describe this
        // unbounded scale type. Once this change happens, we can then also
        // uprate a 'better representation' for this entity, without the
        //0-10-star-scale part of the description.
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "scale types/value scale", "j", 
    JSON.stringify({
        "Class": "@[classes]",
        "Name": "Value scale",
        "Description": "@[scale types/value scale/desc]",
    }),
  );

    // "0-10-star qualities", "j", 
    // JSON.stringify({
    //     "Class": "@[classes]",
    //     "Name": "0–10-star qualities",
    //     "Parent class": "@[relative qualities]",
    //     "Description": "@[0-10-star qualities/desc]",
    //     // (We use 0-10-star qualities initially, before "upgrading" to the
    //     // unbounded (continuously normalized) relative scales.)
    // ))),

    /* Some qualities */
  dataInserter.insertOrEditParsedEntity(
    "qualities/relevant", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "Relevant",
        "Scale type": "@[scale types/percentage scale]",
        "Description": "@[qualities/relevant/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/probability", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "Probability",
        "Scale type": "@[scale types/percentage scale]",
        "Description": "@[qualities/probability/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/agreement", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "Agreement",
        "Scale type": "@[scale types/percentage scale]",
        "Description": "@[qualities/agreement/desc]",
    }),
  );


  dataInserter.insertOrEditParsedEntity(
    "qualities/good (no desc.)", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "good",
        // We use lowercase when Description is not provided.
        "Scale type": "@[scale types/relative scale]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/funny (no desc.)", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "funny",
        "Scale type": "@[scale types/relative scale]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/good", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "Good",
        // We capitalize first letter when Description is provided.
        "Scale type": "@[scale types/relative scale]",
        "Description": "@[qualities/good/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/funny", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "Funny",
        "Scale type": "@[scale types/relative scale]",
        "Description": "@[qualities/funny/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/spoilers", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "Spoilers",
        "Scale type": "@[scale types/relative scale]",
        "Description": "@[qualities/spoilers/desc]",
    }),
  );

  dataInserter.insertOrEditParsedEntity(
    "qualities/price", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "Price",
        "Scale type": "@[scale types/value scale]",
        "Description": "@[qualities/price/desc]",
    }),
  );
  dataInserter.insertOrEditParsedEntity(
    "qualities/durability", "j", 
    JSON.stringify({
        "Class": "@[qualities]",
        "Tag": "Durability",
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
    "relations/Sub-relations", "j", 
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
    "relations/arguments", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Arguments",
        "Subject class": "@[scalars]",
        "Object class": "@[scalars]",
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
    "relations/relevant statements", "j", 
    JSON.stringify({
        "Class": "@[relations]",
        "Title": "Relevant statements",
        "Subject class": "@[statements]",
        "Object class": "@[entities]",
        "Description": "@[relations/relevant statements/desc]",
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

  
}