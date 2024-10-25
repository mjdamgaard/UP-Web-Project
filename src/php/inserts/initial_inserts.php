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
    "classes/classes" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Title" => "Classes",
        "Special attributes" => array(
            array("Title", "string", "mandatory"),
            array("Parent class", "@[classes/classes]", "optional"),
            array("Special attributes", "[[Name,Type,Option]]", "optional"),
        ),
        "Description" => "@[classes/classes/desc]",
    ))),
    "classes/classes/desc" => array("x", // ('x' for 'XML,' or simply 'teXt.')
        "<h1><class>Classes</class></h1>".
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
    ),
    "classes/entities" => array("j", json_encode(array(
        "Class"=>"@[classes/classes]",
        "Title"=>"Entities",
        "Special attributes" => array(
            array("Class", "@[classes/classes]", "mandatory"),
            array("Description", "x", "optional"),
        ),
        "Description"=>"@[classes/entities/desc]",
    ))),
    "classes/entities/desc" => array("x",
        "<h1><class>Entities</class></h1>".
        "..."
    ),
    "classes/users" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Title" => "Users",
        "Special attributes" => array(
            array("username", "string", "mandatory"),
        ),
        "Description" => "@[classes/users/desc]",
    ))),
    "classes/scales" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Title" => "Scales",
        "Description" => "@[classes/scales/desc]",
    ))),
    "classes/scales/desc" => array("x",
        "<h1><class>Scales</class></h1>".
        "..."
    ),
    "classes/scales/likelihood scales" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Title" => "Likelihood scales",
        "Parent class" => "@[classes/scales]",
        "Special attributes" => array(
            array("Description", "x", "removed"),
            array("Predicate", "@[classes/classes]", "mandatory"),
        ),
        "Description" => "@[classes/scales/likelihood scales/desc]",
    ))),
    "classes/scales/rating scales" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Title" => "Rating scales",
        "Parent class" => "@[classes/scales]",
        "Special attributes" => array(
            array("Domain", "@[classes/classes]", "mandatory"),
            array("Predicate", "@[classes/scalar predicates]", "mandatory"),
        ),
        "Description" => "@[classes/scales/rating scales/desc]",
    ))),
    "classes/scalar predicates" => array("j", json_encode(array(
        "Class" => "@[classes/classes]",
        "Title" => "Scalar predicates",
        "Special attributes" => array(
            array("Title", "string", "mandatory"),
        ),
        "Description" => "@[classes/scales/scalar predicates/desc]",
    ))),
));




?>
