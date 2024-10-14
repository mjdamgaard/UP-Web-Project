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
        "class" => "@[classes/user]",
        "description" => "@[users/initial_admin/desc]",
        "username" => "initial_admin"
    ))),
    "classes/class" => array("j", json_encode(array(
        "class" => "@[classes/class]",
        "description" => "@[classes/class/desc]",
        "title" => "class"
    ))),
    "classes/class/desc" => array("x", // ('x' for 'XML,' or simply 'teXt.')
        "<h1><class>class</class></h1>".
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
    "classes/entity" => array("j", json_encode(array(
        "class"=>"@[classes/class]",
        "description"=>"@[classes/entity/desc]",
        "title"=>"entity"
    ))),
    "classes/entity/desc" => array("x",
        "<h1><class>entity</class></h1>".
        "..."
    ),
    "classes/user" => array("j", json_encode(array(
        "class" => "@[classes/class]",
        "description" => "@[classes/user/desc]",
        "title" => "user"
    ))),
    "classes/tests/test1" => array("j", json_encode(array(
        "class" => "@[classes/class]",
        "parent class" => "@[classes/user]",
        "description" => "@[classes/user/desc]",
        "title" => "test class 1"
    ))),
    "classes/tests/test2" => array("j", json_encode(array(
        "class" => "@[classes/class]",
        "parent class" => "@[classes/tests/test1]",
        "description" => "@[classes/entity/desc]",
        "title" => "test class 2"
    ))),
));




?>
