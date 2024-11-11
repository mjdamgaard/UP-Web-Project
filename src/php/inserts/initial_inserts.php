<?php


$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/err/";
require_once $err_path . "errors.php";



$inserts_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/inserts/";
require_once $inserts_path . "EntityInserter.php";

$inserter = new EntityInserter();
$inserter->insertPublicEntities("1", array(
    // Let's keep the most important entities at the start such that they get
    // the same entIDs across edits.
    "users/initial_admin" => array("j", json_encode(array(
        "Class" => "@[users]",
        "Username" => "initial_admin",
        "Description" => "@[users/initial_admin/desc]",
    ))),
    "entities" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Entities",
        "Special attributes" => array(
            array("Class", "@[classes]", "mandatory"),
            array("Description", "x", "optional"),
        ),
        "Rejects submissions" => true,
        "Description" => "@[entities/desc]",
    ))),
    "entities/desc" => array("x",
        "<h1><class>Entities</class></h1>".
        "..."
    ),
    "classes" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Classes",
        "Special attributes" => array(
            array("Name", "string", "mandatory"),
            array(
                "Parent class",
                "@[classes]=@[entities]",
                // (When missing, the parent class is the 'Entities' class.)
                "optional"
            ),
            array(
                "Special attributes",
                "[[Attribute name,Type,Option]]",
                "optional"
            ),
            array("Rejects submissions", "bool=false", "optional"),
            array("Anonymous creators only", "bool=false", "optional"),
            // ('false' is the default value when missing)
            array("Description", "x", "mandatory"), // (Overwrites "optional")
        ),
        "Description" => "@[classes/desc]",
    ))),
    "classes/desc" => array("x", // ('x' for 'XML,' or simply 'teXt.')
        "<h1>Classes</h1>".
        "<h2>Description</h2>".
        "<p>A class of all class entities (including itself). ".
        "Classes both serve as a broad way of categorizing entities, ".
        "and they are also used to define the meaning of their instances, ".
        "as their <attr>description</attr> will be shown on the info page ".
        "of each of their instances.".
        "</p>".
        "<p>As an example, this description of the <class>class</class> ".
        "entity will be shown on the info page of all class entities, just ".
        "above the description of the general <class>entity</class> class.".
        "</p>".
        "<p>The <attr>description</attr> of a class should include a ".
        "section of 'special attributes,' if it defines a new attribute ".
        "or redefines an attribute of a superclass (opposite of 'subclass'). ".
        "As an example, since the <class>class</class> class introduces an ".
        "optional <attr>superclass</attr> attribute and expands on the ".
        "<attr>description</attr> attribute, the following 'special ".
        "attributes' section will include a description of both these ".
        "attributes.".
        "</p>".
        "<h2>Special attributes</h2>".
        "<h3><attr>description</attr></h3>".
        "<flags><flag>mandatory</flag><flag>extends superclass</flag></flags>".
        "<p>...".
        "</p>".
        "<h3><attr>superclass</attr></h3>".
        "<flags><flag>optional</flag></flags>".
        "<p>...".
        "</p>"
        // TODO: Rewrite and add: Unless otherwise specified, entities with
        // more popular duplicates are always excluded from the class.
        // I might also add a general statement about not including specific
        // versions or "modes," unless otherwise specified, but to stick to the
        // level of abstraction that is the most obvious (if not defined) for
        // the class..
    ),
    "users" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Users",
        "Special attributes" => array(
            array("Username", "string", "mandatory"),
        ),
        "Rejects submissions" => true,
        "Description" => "@[users/desc]",
    ))),
    "scales" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Scales",
        "Special attributes" => array(
            array("Relation", "@[relations]", "mandatory"),
            array("Object", "@[entities]", "mandatory"),
            array("Quality", "@[qualities]", "mandatory"),
            array("Description", "", "removed"),
        ),
        "Anonymous creators only" => true,
        "Description" => "@[scales/desc]",
    ))),
    "scales/desc" => array("x",
        "<h1>Scales</h1>".
        "..."
    ),

    "scalar parameters" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Scalar parameters",
        "Special attributes" => array(
            array("Scale", "@[scales]", "mandatory"),
            array("Subject", "@[entities]", "mandatory"),
            array("Description", "", "removed"),
        ),
        "Anonymous creators only" => true,
        "Description" => "@[scalar parameters/desc]",
    ))),

    "qualities" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Qualities",
        "Special attributes" => array(
            array("Tag", "string", "mandatory"),
            // Use purely lowercase tags only when the Description is left out.
            array("Scale type", "@[scale types]", "mandatory"),
        ),
        "Description" => "@[qualities/desc]",
    ))),
    "scale types" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Scale types",
        "Special attributes" => array(
            array("Name", "string", "mandatory"),
            array("Description", "x", "mandatory"),
        ),
        "Description" => "@[scale types/desc]",
    ))),

    /* Some scale types */
    "scale types/percentage scale" => array("j", json_encode(array(
        "Class" => "@[scale types]",
        "Name" => "Percentage scale",
        "Description" => "@[scale types/percentage scale/desc]",
    ))),
    "scale types/relative scale" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Relative scale",
        "Description" => "@[scale types/relative scale/desc]",
        // Description should say that 'this scale type is treated as the
        // 0-10-star scale type, until a point when it is changed to an
        // unbounded relative scale,' and then go on to describe this
        // unbounded scale type. Once this change happens, we can then also
        // uprate a 'better representation' for this entity, without the
        //0-10-star-scale part of the description.
    ))),
    "scale types/value scale" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Value scale",
        "Description" => "@[scale types/value scale/desc]",
    ))),

    // "0-10-star qualities" => array("j", json_encode(array(
    //     "Class" => "@[classes]",
    //     "Name" => "0–10-star qualities",
    //     "Parent class" => "@[relative qualities]",
    //     "Description" => "@[0-10-star qualities/desc]",
    //     // (We use 0-10-star qualities initially, before "upgrading" to the
    //     // unbounded (continuously normalized) relative scales.)
    // ))),

    /* Some qualities */
    "qualities/usefulness" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "Usefulness",
        "Scale type" => "@[scale types/percentage scale]",
        "Description" => "@[qualities/usefulness/desc]",
    ))),
    "qualities/probability" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "Probability",
        "Scale type" => "@[scale types/percentage scale]",
        "Description" => "@[qualities/probability/desc]",
    ))),
    "qualities/agreement" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "Agreement",
        "Scale type" => "@[scale types/percentage scale]",
        "Description" => "@[qualities/agreement/desc]",
    ))),


    "qualities/good (no desc.)" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "good",
        // We use lowercase when Description is not provided.
        "Scale type" => "@[scale types/relative scale]",
    ))),
    "qualities/funny (no desc.)" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "funny",
        "Scale type" => "@[scale types/relative scale]",
    ))),
    "qualities/good" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "Good",
        // We capitalize first letter when Description is provided.
        "Scale type" => "@[scale types/relative scale]",
        "Description" => "@[qualities/good/desc]",
    ))),
    "qualities/funny" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "Funny",
        "Scale type" => "@[scale types/relative scale]",
        "Description" => "@[qualities/funny/desc]",
    ))),
    "qualities/spoilers" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "Spoilers",
        "Scale type" => "@[scale types/relative scale]",
        "Description" => "@[qualities/spoilers/desc]",
    ))),

    "qualities/price" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "Price",
        "Scale type" => "@[scale types/value scale]",
        "Description" => "@[qualities/price/desc]",
    ))),
    "qualities/durability" => array("j", json_encode(array(
        "Class" => "@[qualities]",
        "Tag" => "Durability",
        "Scale type" => "@[scale types/value scale]",
        "Description" => "@[qualities/durability/desc]",
    ))),


    /* Relations */
    "relations" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Relations",
        "Special attributes" => array(
            array("Title", "string", "mandatory"),
            array("Subject class", "@[classes]", "mandatory"),
            array("Object class", "@[classes]", "mandatory"),
            // array("Description", "x", "mandatory"),
        ),
        "Description" => "@[relations/desc]",
    ))),
    "relations/members" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Members",
        "Subject class" => "@[entities]",
        "Object class" => "@[classes]",
        "Description" => "@[relations/members/desc]",
    ))),
    "relations/subclasses" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Subclasses",
        "Subject class" => "@[classes]",
        "Object class" => "@[classes]",
        "Description" => "@[relations/subdesc]",
    ))),
    "relations/relations" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Useful relations",
        "Subject class" => "@[relations]",
        "Object class" => "@[entities]",
        "Description" => "@[relations/relations/desc]",
    ))),
    "relations/relations for members" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Relations for members",
        "Subject class" => "@[relations]",
        "Object class" => "@[classes]",
        "Description" => "@[relations/relations for members/desc]",
    ))),
    "relations/Sub-relations" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Sub-relations",
        "Subject class" => "@[relations]",
        "Object class" => "@[relations]",
        "Description" => "@[relations/sub-relations/desc]",
    ))),
    "relations/qualities" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Qualities",
        "Subject class" => "@[qualities]",
        "Object class" => "@[entities]",
        "Description" => "@[relations/qualities/desc]",
    ))),
    "relations/qualities for members" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Qualities for members",
        "Subject class" => "@[qualities]",
        "Object class" => "@[classes]",
        "Description" => "@[relations/qualities for members/desc]",
    ))),


    "relations/arguments" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Arguments",
        "Subject class" => "@[scalars]",
        "Object class" => "@[scalars]",
        "Description" => "@[relations/arguments/desc]",
    ))),
    "relations/comments" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Comments",
        "Subject class" => "@[comments]",
        "Object class" => "@[entities]",
        "Description" => "@[relations/comments/desc]",
    ))),
    "relations/reaction comments" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Reaction comments",
        "Subject class" => "@[comments]", // ('comments' is intentional)
        "Object class" => "@[entities]",
        "Description" => "@[relations/reaction comments/desc]",
    ))),
    "relations/informative comments" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Informative comments",
        "Subject class" => "@[comments]", // (also intentional)
        "Object class" => "@[entities]",
        "Description" => "@[relations/informative comments/desc]",
    ))),
    "relations/relevant statements" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Relevant statements",
        "Subject class" => "@[statements]",
        "Object class" => "@[entities]",
        "Description" => "@[relations/relevant statements/desc]",
    ))),
    "relations/discussions" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Discussions",
        "Subject class" => "@[statements]",
        "Object class" => "@[entities]",
        "Description" => "@[relations/discussions/desc]",
    ))),
    "relations/facts" => array("j", json_encode(array(
        "Class" => "@[relations]",
        "Title" => "Facts",
        "Subject class" => "@[statements]",
        "Object class" => "@[entities]",
        "Description" => "@[relations/facts/desc]",
    ))),


    "statements" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Statements",
        "Special attributes" => array(
            array("Text", "x", "mandatory"),
            array("Is claimed by the creator", "bool=false", "optional"),
            array("Is objective", "bool=false", "optional"),
            array("Description", "", "removed"),
        ),
        "Description" => "@[statements/desc]",
    ))),
    "comments" => array("j", json_encode(array(
        "Class" => "@[classes]",
        "Name" => "Comments",
        "Parent class" => "@[statements]",
        "Special attributes" => array(
            array("Topic", "@[entities]", "mandatory"),
            array("Is claimed by the creator", "", "removed"),
        ),
        "Description" => "@[comments/desc]",
    ))),
));


$inserter->insertPublicEntities("0", array(
    "scales/entities->subclasses" => array("j",
        json_encode(array(
            "Class" => "@[scales]",
            "Relation" => "@[relations/subclasses]",
            "Object" => "@[entities]",
            "Quality" => "@[qualities/usefulness]",
        )
    )),
    // "scales/entities->members" => array("j",
    //     json_encode(array(
    //         "Class" => "@[scales]",
    //         "Relation" => "@[relations/members]",
    //         "Object" => "@[entities]",
    //         "Quality" => "@[qualities/usefulness]",
    //     )
    // )),
    // "scales/classes->subclasses" => array("j",
    //     json_encode(array(
    //         "Class" => "@[scales]",
    //         "Relation" => "@[relations/subclasses]",
    //         "Object" => "@[classes]",
    //         "Quality" => "@[qualities/usefulness]",
    //     )
    // )),
    // "scales/classes->members" => array("j",
    //     json_encode(array(
    //         "Class" => "@[scales]",
    //         "Relation" => "@[relations/members]",
    //         "Object" => "@[classes]",
    //         "Quality" => "@[qualities/usefulness]",
    //     )
    // )),
));


// $inserter->addEntitiesToList(
//     "1", "scales/classes->members", array(
//         array("classes", "1"),
//         array("entities", "1"),
//         array("users", "0.8"),
//         array("scales", "0.5"),
//         array("statements", "1"),
//         array("comments", "0.95"),
//     )
// );
// $inserter->addEntitiesToList(
//     "1", "scales/classes->subclasses", array(
//         array("users", "0.8"),
//         array("scales", "0.8"),
//         array("statements", "1"),
//         array("comments", "0.95"),
//     )
// );

// $inserter->addEntitiesToList(
//     "1", "scales/entities->members", array(
//         array("classes", "1"),
//         array("entities", "1"),
//         array("users", "0.8"),
//         array("scales", "0.5"),
//         array("statements", "1"),
//         array("comments", "0.95"),
//     )
// );
// $inserter->addEntitiesToList(
//     "1", "scales/entities->subclasses", array(
//         array("classes", "1"),
//         array("users", "0.8"),
//         array("scales", "0.8"),
//         array("statements", "1"),
//         array("comments", "0.95"),
//     )
// );

?>
