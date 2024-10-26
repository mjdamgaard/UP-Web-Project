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
        "Class" => "@[classes/users]",
        "Username" => "initial_admin",
        "Description" => "@[users/initial_admin/desc]",
    ))),
    "classes/entities" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Entities",
        "Special attributes" => array(
            array("Class", "@[classes/classes]", "mandatory"),
            array("Description", "x", "optional"),
        ),
        "Rejects submissions" => true,
        "Description" => "@[classes/entities/desc]",
    ))),
    "classes/entities/desc" => array("x",
        "<h1><class>Entities</class></h1>".
        "..."
    ),
    "classes/classes" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Classes",
        "Special attributes" => array(
            array("Name", "string", "mandatory"),
            array("Parent class", "@[classes/classes]", "optional"),
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
        "Description" => "@[classes/classes/desc]",
    ))),
    "classes/classes/desc" => array("x", // ('x' for 'XML,' or simply 'teXt.')
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
    "classes/users" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Users",
        "Special attributes" => array(
            array("username", "string", "mandatory"),
        ),
        "Rejects submissions" => true,
        "Description" => "@[classes/users/desc]",
    ))),
    "classes/scales" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Scales",
        "Special attributes" => array(
            array("Domain", "@[classes/classes]", "mandatory"),
        ),
        "Description" => "@[classes/scales/desc]",
    ))),
    "classes/scales/desc" => array("x",
        "<h1>Scales</h1>".
        "..."
    ),
    "classes/scalars" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Scalars",
        "Special attributes" => array(
            array("Scale", "@[classes/scales]", "mandatory"),
            array("Subject", "@[classes/entities]", "mandatory"),
            array("Description", "", "removed"),
        ),
        "Description" => "@[classes/scalars/desc]",
    ))),
    "scales/likelihood scale" => array("j", json_encode(array(
        "Class" => "@[classes/scales]",
        "Name" => "Likelihood scale",
        "Domain" => "@[classes/statements]",
        "Description" => "@[scales/likelihood scale/desc]",
    ))),
    "classes/scales/relevancy scales" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Relevancy scales",
        "Parent class" => "@[classes/scales]",
        "Special attributes" => array(
            array("Description", "", "removed"),
        ),
        "Description" => "@[classes/scales/relevancy scales/desc]",
    ))),
    "classes/scales/rating scales" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Rating scales",
        "Parent class" => "@[classes/scales]",
        "Special attributes" => array(
            array("Tag", "@[classes/tags]", "mandatory"),
            array("Description", "", "removed"),
        ),
        "Anonymous creators only" => true,
        "Description" => "@[classes/scales/rating scales/desc]",
    ))),
    "classes/tags" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Tags",
        "Special attributes" => array(
            array("Name", "string", "mandatory"),
            array("Description", "x", "mandatory"),
        ),
        "Description" => "@[classes/tags/desc]",
    ))),
    "classes/scales/value scales" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Value scales",
        "Parent class" => "@[classes/scales]",
        "Special attributes" => array(
            array("Function", "@[classes/functions]", "mandatory"),
            array("Description", "", "removed"),
        ),
        "Anonymous creators only" => true,
        "Description" => "@[classes/scales/rating scales/desc]",
    ))),
    "classes/functions" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Functions",
        "Special attributes" => array(
            array("Name", "string", "mandatory"),
            array("Description", "x", "mandatory"),
        ),
        "Description" => "@[classes/functions/desc]",
    ))),
    "classes/relational classes" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Relational classes",
        "Special attributes" => array(
            array("Relation", "@[classes/relations]", "mandatory"),
            array("Object", "@[classes/entities]", "mandatory"),
            array("Description", "", "removed"),
        ),
        "Anonymous creators only" => true,
        "Description" => "@[classes/relational classes/desc]",
    ))),
    "classes/relations" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Relations",
        "Special attributes" => array(
            array("Noun", "string", "mandatory"),
            array("Member class", "@[classes/classes]", "mandatory"),
            array("Object class", "@[classes/classes]", "mandatory"),
            array("Description", "x", "mandatory"),
        ),
        "Description" => "@[classes/relations/desc]",
    ))),
    "relations/useful relations" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Useful relations",
        "Member class" => "@[classes/relations]",
        "Object class" => "@[classes/entities]",
        "Description" => "@[relations/useful relations/desc]",
    ))),
    "relations/useful sub-relations" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Useful sub-relations",
        "Member class" => "@[classes/relations]",
        "Object class" => "@[classes/relations]",
        "Description" => "@[relations/useful sub-relations/desc]",
    ))),
    "relations/useful subclasses" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Useful subclasses",
        "Member class" => "@[classes/classes]",
        "Object class" => "@[classes/classes]",
        "Description" => "@[relations/useful subclasses/desc]",
    ))),
    "relations/relevant tags" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Relevant tags",
        "Member class" => "@[classes/tags]",
        "Object class" => "@[classes/classes]",
        "Description" => "@[relations/relevant tags/desc]",
    ))),
    "relations/arguments" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Arguments",
        "Member class" => "@[classes/scalars]",
        "Object class" => "@[classes/scalars]",
        "Description" => "@[relations/arguments/desc]",
    ))),
    "relations/comments" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Comments",
        "Member class" => "@[classes/comments]",
        "Object class" => "@[classes/entities]",
        "Description" => "@[relations/comments/desc]",
    ))),
    "relations/reaction comments" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Reaction comments",
        "Member class" => "@[classes/comments]", // ('comments' is intentional)
        "Object class" => "@[classes/entities]",
        "Description" => "@[relations/reaction comments/desc]",
    ))),
    "relations/informative comments" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Informative comments",
        "Member class" => "@[classes/comments]", // (also intentional)
        "Object class" => "@[classes/entities]",
        "Description" => "@[relations/informative comments/desc]",
    ))),
    "relations/relevant statements" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Relevant statements",
        "Member class" => "@[classes/statements]",
        "Object class" => "@[classes/entities]",
        "Description" => "@[relations/relevant statements/desc]",
    ))),
    "relations/discussions" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Discussions",
        "Member class" => "@[classes/statements]",
        "Object class" => "@[classes/entities]",
        "Description" => "@[relations/discussions/desc]",
    ))),
    "relations/facts" => array("j", json_encode(array(
        "Class" => "@[classes/relations]",
        "Noun" => "Facts",
        "Member class" => "@[classes/statements]",
        "Object class" => "@[classes/entities]",
        "Description" => "@[relations/facts/desc]",
    ))),
    "classes/statements" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Statements",
        "Special attributes" => array(
            array("Text", "x", "mandatory"),
            array("Is claimed by user", "bool=false", "optional"),
            array("Description", "", "removed"),
        ),
        "Description" => "@[classes/statements/desc]",
    ))),
    "classes/comments" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Name" => "Comments",
        "Parent class" => "@[classes/statements]",
        "Special attributes" => array(
            array("Is claimed by user", "", "removed"),
        ),
        "Description" => "@[classes/comments/desc]",
    ))),
));


$inserter->insertPublicEntities("0", array(
    "relevancy scales/classes RS" => array("j", json_encode(array(
        "Class" => "@[classes/relevancy scales]",
        "Domain" => "@[classes/classes]",
    ))),
    "classes/classes/->useful subclasses" => array("j",
        json_encode(array(
            "Class" => "@[classes/relational classes]",
            "Relation" => "@[relations/useful subclasses]",
            "Object" => "@[classes/classes]",
        )
    )),
    "relevancy scales/classes->useful subclasses RS" => array("j",
        json_encode(array(
            "Class" => "@[classes/relevancy scales]",
            "Domain" => "@[classes/classes/->useful subclasses]",
        )
    )),
    "classes/statements/->useful subclasses" => array("j",
        json_encode(array(
            "Class" => "@[classes/relational classes]",
            "Relation" => "@[relations/useful subclasses]",
            "Object" => "@[classes/statements]",
        )
    )),
    "classes/comments/->useful subclasses" => array("j",
        json_encode(array(
            "Class" => "@[classes/relational classes]",
            "Relation" => "@[relations/useful subclasses]",
            "Object" => "@[classes/comments]",
        )
    )),
));


$inserter->addEntitiesToList(
    "1", "relevancy scales/classes RS", array(
        array("classes/classes", "1"),
        array("classes/entities", "1"),
        array("classes/users", "0.8"),
        array("classes/scales", "0.5"),
        array("classes/relevancy scales", "0.6"),
        array("classes/rating scales", "0.6"),
        array("classes/value scales", "0.55"),
        array("classes/statements", "1"),
        array("classes/comments", "0.95"),
    )
);
$inserter->addEntitiesToList(
    "1", "relevancy scales/classes->useful subclasses RS", array(
        array("classes/classes", "1"),
        array("classes/entities", "1"),
        array("classes/users", "0.8"),
        array("classes/scales", "0.5"),
        array("classes/relevancy scales", "0.6"),
        array("classes/rating scales", "0.6"),
        array("classes/value scales", "0.55"),
        array("classes/statements", "1"),
        array("classes/comments", "0.95"),
    )
);

?>
