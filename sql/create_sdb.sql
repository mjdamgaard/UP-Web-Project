
/* Semantic inputs */
DROP TABLE SemanticInputs;
DROP TABLE RecordedInputs;
/* Indexes */
DROP TABLE IndexedEntities;

/* Entities */
DROP TABLE Entities;

-- /* Data */
-- DROP TABLE SimpleEntityData;
-- DROP TABLE AssocEntityData;
-- DROP TABLE FormalEntityData;
-- DROP TABLE PropertyTagData;
-- DROP TABLE StatementData;
-- DROP TABLE ListData;
-- DROP TABLE PropertyDocData;
-- DROP TABLE TextData;
-- DROP TABLE BinaryData;
-- DROP TABLE UserData;
-- DROP TABLE NativeBotData;

/* Users and Bots */
DROP TABLE Users;
DROP TABLE AggregationBots;

/* Ancillary data for aggregation bots */
DROP TABLE AncillaryBotData1e2d;
DROP TABLE AncillaryBotData1e4d;

/* Private user data */
DROP TABLE Private_UserData;
DROP TABLE Private_Sessions;
DROP TABLE Private_EMails;



/* Semantic inputs */

/* Semantic inputs are the statements that the users (or aggregation bots) give
 * as input to the semantic network. A central feature of this semantic system
 * is that all such statements come with a numerical value which represents the
 * degree to which the user deems that the statement is correct (like when
 * answering a survey).
 * The statements in this system are always formed from a tag entity and an
 * instance entity. The user thus states that the latter is an instance of the
 * given tag. The rating then tells how well the tag first the instance.
 **/

CREATE TABLE SemanticInputs (
    -- User (or bot) who states the statement.
    user_id BIGINT UNSIGNED NOT NULL,

    -- Subject of the statement (might be nothing, represented by 0).
    subj_id BIGINT UNSIGNED NOT NULL DEFAULT 0,

    -- Tag or relation of the statement (a tag if subj_id = 0, else a relation).
    tag_id BIGINT UNSIGNED NOT NULL,

    -- Rating value of how well the tag fits the entity. The first byte
    -- of the TINYINT runs from 1 to 255, where 1
    -- means 'absolutely/perfectly not,' 128 means 'doesn't particularly fit or
    -- not fit,' and 255 means 'absolutely/perfectly.'
    rat_val TINYINT UNSIGNED NOT NULL,
    CHECK (rat_val != 0),

    -- The object of the tag/relation.
    obj_id BIGINT UNSIGNED NOT NULL,

    -- Resulting semantic input: "User #<user_id> states that entity 
    -- #<obj_id> fits the tag #<tag_id>(#<subj_id>) on a scale specified
    -- by the tag/relation entity (or by its class).

    PRIMARY KEY (
        user_id,
        subj_id,
        tag_id,
        rat_val,
        obj_id
    ),

    UNIQUE INDEX (user_id, subj_id, tag_id, obj_id)
);
-- TODO: Compress this table and its sec. index, as well as some other tables
-- and sec. indexes below. (But compression is a must for this table.)
-- There is also the option to create a sec. index: (tag_id, inst_id, rat_val,
-- user_id), but I actually think that it is better to implement semantically,
-- e.g. by using the "statement_user_rater_bot," namely since this better
-- allows for filtering such user lists.. 




-- RecordedInputs can first of all be used by time-dependent bots (e.g. a mean-
-- of-recent-inputs bot), and can also potentially used by bots that update on
-- scheduled events rather than immediately when the input is received. And
-- furthermore, they can also potentially be used by third-party bots and by
-- SDB peers.
CREATE TABLE RecordedInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    -- tag_id BIGINT UNSIGNED NOT NULL,
    -- inst_id BIGINT UNSIGNED NOT NULL,
    stmt_id BIGINT UNSIGNED NOT NULL,
    -- A rating value of NULL means 'take my rating away,' making it 'missing'/
    -- 'deleted.'
    rat_val TINYINT UNSIGNED,

    -- UNIQUE INDEX (tag_id, inst_id, id)
    UNIQUE INDEX (stmt_id, id)
);




/* Indexes */

CREATE TABLE IndexedEntities (
    -- Index entity which defines the restrictions on the entity keys.
    idx_id BIGINT UNSIGNED NOT NULL,

    /* The entity index */
    -- Given some constants for the above two columns, the "entity indexes"
    -- contain the "entity keys," which are each just the secondary index of an
    -- entity.
    key_str VARCHAR(255) NOT NULL,


    ent_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        idx_id,
        key_str,
        ent_id -- (A single key might in principle index several entities.) 
    )
);
-- (Also needs compressing.)

-- I intend to at some point copy at least one of these indexes (with a
-- specific idx_id) over in another table with a FULLTEXT index on the str
-- column. But I will do this in another file, then.





/* Entities */

CREATE TABLE Entities (
    -- Entity ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Template ID: An entity that this entity inherits properties from.
    -- the a template entity holds a template property which is a JSON object
    -- containing the properties of the instance entities, where some of the
    -- property values might include placeholders of the form '%e0', '%e1',
    -- etc.,
    -- or of the form '%b', '%t', or '%t1', '%t2', etc. ('%' is escaped by
    -- '\%'.)
    template_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    -- (A majority of entities will have a tmpl, so we use 0 instead of NULL.)

    -- Template entity (ID) inputs: A list of integer inputs separated by ',',
    -- which substitutes the /%e[0-9]/ placeholders of the template.
    template_entity_inputs VARCHAR(209) NOT NULL DEFAULT "",

    -- Template string inputs: A list of string inputs separated by '|',
    -- which substitutes the /%s[0-9]/ placeholders of the template.
    -- ('|' is escaped by '\|'.)
    -- One can also use '%s' instead, which is substituted by the whole string
    -- (and '|' is then not taken as a special character).
    template_string_inputs VARCHAR(255) NOT NULL DEFAULT "",

    -- Own property data structure (struct) containing the specific properties
    -- of this entity, and formatted as a JSON object. If a property value is
    -- an array, it is interpreted as a set (used for one-to-many properties,
    -- such as e.g. movie->actor). An array nested directly inside of an array
    -- is interpreted as a ordered list, however. (When in doubt of whether to
    -- define an entity via an ordered list or a set, use a set.) 
    own_prop_struct TEXT DEFAULT NULL,
    own_prop_struct_hash VARCHAR(56) NOT NULL DEFAULT (
        CASE
            WHEN own_prop_struct IS NULL OR own_prop_struct = "" THEN ""
            ELSE SHA2(own_prop_struct, 224)
        END
    ),


    -- Data input: A TEXT or BLOB that which can be large enough that one might
    -- want to only serve to the client upon specific request, and not whenever
    -- the client looks up defining data for the entity. This inputs either
    -- replaces the '%b' or '%t' placeholder ('b' for binary, 't' for text) in
    -- the template, which is the own_prop_struct of the template_id entity,
    -- or it is also split into multiple strings using '|'
    -- as a delimiter, in case of the '%t<num>' placeholders. ('|' is also
    -- escaped by '\|' here.)
    -- If the entity has no template (template_id = 0), then data_input is
    -- always interpreted as the 'description' of the entity.
    data_input LONGBLOB DEFAULT NULL,
    data_input_hash VARCHAR(56) NOT NULL DEFAULT (
        CASE
            WHEN data_input IS NULL OR data_input = "" THEN ""
            ELSE SHA2(data_input, 224)
        END
    ),
    -- (Any size restriction on this BLOB is implemented in the control layer,
    -- or in the interface with it, i.e. in the "input procedures.")


    UNIQUE INDEX (
        template_id, data_input_hash, own_prop_struct_hash,
        template_entity_inputs, template_string_inputs
    ),


    -- ID of the creator, i.e. the user who uploaded this entity.
    creator_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    -- (A majority of entities will have a creator.)

    UNIQUE INDEX (creator_id, id)
);


/* Some initial inserts */

INSERT INTO Entities (
    id, template_id, template_entity_inputs, template_string_inputs,
    own_prop_struct, data_input
)
VALUES
    -- TODO: Add 'initial description's (with data_input text as the value).
    (1, 0, '', '', CONCAT(
        '{"class":"@1","title":"class"}'
    ), CONCAT(
        "A class of all class entities, including this entity itself. ",
        "One benefit of using entities as classes, rather than just writing ",
        "a string (like the value of the 'title' property of this entity, ",
        "which is 'class'), is that they can provide an additional ",
        "description to the class, like the one that you are reading now."
    )),
    (2, 0, '', '', CONCAT(
        '{"class":"@1","title":"tag"}'
    ), CONCAT(
        "A class of the so-called 'tags,' which are essential to this ",
        "semantic system. A tag is essentially a function that takes ",
        "an 'instance' (of any given class) entity and produces a rating ",
        "scale, which can e.g. ",
        "be how good a product or a piece of media is, perhaps measured on a ",
        "scale from 1 to 5 stars, how durable a product is, perhaps measured ",
        "in months, or how much it generally costs, perhaps measured in USD. ",
        "For every pair of tag and subject, the users can then rate the ",
        "resulting rating scale. If a tag has no specific ",
        "description of the scale, then the default interpretation is a ",
        "1–5 rating scale of how well the tag fits the given instance. ",
        "The description of the rating scale can be defined by the tag ",
        "entity itself, or by its class, or by the relation entity if it is ",
        "formed by a relation and a subject."
    )),
    (3, 0, '', '', CONCAT(
        '{"class":"@1","title":"template"}'
    ), CONCAT(
        "A class of the so-called 'templates,' which are entities that ",
        "can be used to define new entities with property structs that ",
        "follow a specific template. The only property that defines an ",
        "entity of this 'template' class, other than the 'class' property, ",
        "is the 'template' property, which is a variable property structure ",
        "that has placeholders for substitution. ...TODO: Continue."
    )),
    (4, 0, '', '', CONCAT(
        '{"class":"@1","title":"user"}'
    ), CONCAT(
        "A class of the users of this Semantic Network. Whenever a ",
        "new user is created, an entity of this 'user' class is created to ",
        "represent this new user."
    )),
    (5, 0, '', '', CONCAT(
        '{"class":"@3","template":{"class":"@4","username":"%s"}}'
    ), NULL),
    (6, 0, '', '', CONCAT(
        '{"class":"@3","template":{"title":"%s"}}'
    ), NULL),
    (7, 0, '', '', CONCAT(
        '{"class":"@1","title":"relation"}'
    ), CONCAT(
        "A class of so-called 'relation,' which are essentially functions ",
        "that take a subject entity, perhaps of a specified class, and ",
        "produces a ",
        "tag. This tag can then be used to create a rating scale, often ",
        "saying how well the relation fits the subject entity and the object ",
        "entity, which is the entity that is being rated as the instance of ",
        "the tag."
    )),
    (8, 0, '', '', CONCAT(
        '{"class":"@1","superclass":"@7","title":"property relation"}'
    ), CONCAT(
        "A class of so-called 'property relations,' which constitute a ",
        "standard way ",
        "to make semantic relations in this semantic system. A property ",
        "relation is ",
        "always represented by a singular (potentially composite) noun. ",
        "For instance, a movie might have an 'director' property. ",
        "And the 'property relation' class being defined here can be seen to ",
        "have both a 'class', a 'superclass', and a 'title' ",
        "property. Note that when defining a new entity, you don't ",
        "necessarily need this class, since any string like 'director' or ",
        "'class' will automatically be interpreted as a property anyway. ",
        "This class ought therefore only be used when wanting to further ",
        "elaborate on what exactly the given property means, what its ",
        "value(s) should be, and potentially also information about how the ",
        "rating scale of the resulting tags are supposed to be interpreted."
    )),
    (9, 0, '', '', CONCAT(
        '{"class":"@3","template":{"class":"@8","title":"%s",",
        "object class":"%e1" "subject class":"%e2","description":"%t"}}'
    ), NULL),
    (10, 0, '', '', CONCAT(
        '{"class":"@1","superclass":"@2","title":"property tag"}'
    ), CONCAT(
        "A class of 'property tags,' which are tags of a very specific ",
        "structure used to form semantic relations in this semantic system. ",
        "A property tag is always constructed from just a 'property' entity ",
        "(of the 'property relation' class) and another 'subject' entity ",
        "(of any class). The resulting rating scale is then how well the ",
        "given instance entity fits the given property of the subject entity. "
        "For instance, we might have a movie entity as our subject entity, ",
        "and 'director' as our property entity, and have 'John Doe' ",
        "as the instance entity, which says that John Doe is the ",
        "director of the given movie. If the property entity has no ",
        "further description, then the rating scale is just a 1–5 scale of ",
        "how well the ",
        "instance (e.g. John Doe) fits the given tag, e.g. the 'director ",
        "of the given movie.' But the property entity might also specify ",
        "this rating further in its description. (For instance, it might ", 
        "specify that the main director always ought to be given 5 stars on ",
        "the rating scale from 1 to 5, e.g.)"
    )),
    (11, 0, '', '', CONCAT(
        '{"class":"@3","template":{',
            '"class":"@10",',
            '"subject":"%e1",',
            '"property":"%e2",',
        '}}'
    ), NULL),
    (12, 0, '', '', CONCAT(
        '{"class":"@1","title":"entity"}'
    ), CONCAT(
        "A class of all entities of this Semantic Network. All entities ",
        "automatically has this class without needing to specify so in their ",
        "definition."
    )),
    (13, 5, '', 'initial_user', NULL, NULL),
    (14, 0, '', '', CONCAT(
        '{"class":"@1","title":"list"}'
    ), CONCAT(
        "A class of all (ordered) lists. The only property of ",
        "this class, other than the 'class' property itself, is an 'elements' ",
        "property that includes a list of all the elements. Note that lists ",
        "are written in property structs as e.g. '",
        '"elements":[[elem_1, elem_2, elem_3]]',
        "', whereas '[elem_1, elem_2, elem_3]' (with no nesting) is ",
        "interpreted as an unordered set of valid property values (used for ",
        "one-to-many properties)."
    )),
    (15, 0, '', '', CONCAT(
        '{"class":"@3","template":{"class":"@14","elements":[["%s%t"]]}'
    ), NULL),
    (16, 0, '', '', CONCAT(
        '{"class":"@3","template":{"class":"@2","title":"%s",',
        '"instance class":"%e1","description":"%t"}'
    ), NULL),
    (17, 9, '8', 'relevant property', NULL, CONCAT(
        "A property relation where the objects are the property relations ",
        "that are relevant to the subject entity."
    )),
    (18, 9, '8,1', 'relevant property of class instances', NULL, CONCAT(
        "A property relation where the objects are the property relations ",
        "that are relevant to all the instances of the subject class."
    )),
    (19, 11, '12,18', '', NULL, NULL),
    (20, 11, '2,18', '', NULL, NULL),
    (21, 0, '', '', CONCAT(
        '{"class":"@1","title":"set"}'
    ), CONCAT(
        "A class of all sets (unordered lists). The only property of ",
        "this class, other than the 'class' property itself, is an 'elements' ",
        "property holding an array of all the elements of the set. ",
        "Note that sets are written in property structs as e.g. '",
        '"elements":[elem_1, elem_2, elem_3]',
        "', whereas '[[elem_1, elem_2, elem_3]]' (a nested array) is ",
        "interpreted as a (ordered) list instead. "
        "Whenever a set entity is the value of a property in a property ",
        "struct, the interpretation is that all the elements fits the given ",
        "property, not the set itself. To sey that a set entity itself is ",
        "the value of a property, simply wrap it in another set, either ",
        "using the '[]' syntax or by creating another set entity with the ",
        "given set as its only element."
    )),
    (22, 0, '', '', CONCAT(
        '{"class":"@3","template":{"class":"@21","elements":["%s%t"]}'
    ), NULL),
    -- 
    (NULL, 6, '', 'exAmpLe of A noT very usefuL enTiTy', NULL, NULL);


-- [...] If data_input is a binary file, '%b' is used, but this should
-- conventionally only be used for special file classes (which defines the
-- file format but no other metadata about the file). 
-- Special characters are '%', '@', which are escaped with backslashes,
-- as well as the other special characters of JSON, of course (escaped the
-- JSON way), in case of the propStruct. For the tmplInput, the separator '|'
-- is also special, also escaped by a backslash.
-- '@' is used to write IDs, namely by writing e.g. '"@6"' which refers the the
-- "initial_user" entity.







/* Users */

CREATE TABLE Users (
    -- User data key (private).
    data_key BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL,
    -- TODO: Consider adding more restrictions.

    public_keys_for_authentication TEXT,
    -- (In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need to exchange passwords
    -- between databases.) (This could also be other data than encryption keys,
    -- and in principle it could even just be some ID to use for authenticating
    -- the user via a third party.)

    UNIQUE INDEX (username)
);


/* Native aggregation bots (or simply 'bots' for short) */

CREATE TABLE AggregationBots (
    -- Aggregation bot data key (private).
    data_key BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    bot_name VARCHAR(255) NOT NULL,

    bot_description TEXT,

    UNIQUE INDEX (bot_name)
);






/* Ancillary data for aggregation bots */


CREATE TABLE AncillaryBotData1e2d (
    -- Name of the bot that uses this data.
    bot_name VARCHAR(255) NOT NULL,
    -- Entity which the data is about.
    ent_id BIGINT UNSIGNED NOT NULL,

    -- Data.
    -- data_1 BIGINT UNSIGNED NOT NULL,
    -- data_2 BIGINT UNSIGNED NOT NULL,
    data_1 BIGINT UNSIGNED,
    data_2 BIGINT UNSIGNED,
    -- TODO: Check mean_bots.sql to see if it is okay to make these  columns
    -- NOT NULL, and if not, change mean_bots.sql so that it can be done.

    PRIMARY KEY (
        bot_name,
        ent_id
    )
);
-- TODO: Compress.

CREATE TABLE AncillaryBotData1e4d (
    -- Name of the bot that uses this data.
    bot_name VARCHAR(255) NOT NULL,
    -- Entity which the data is about.
    ent_id BIGINT UNSIGNED NOT NULL,

    -- Data.
    data_1 BIGINT UNSIGNED NOT NULL,
    data_2 BIGINT UNSIGNED NOT NULL,
    data_3 BIGINT UNSIGNED NOT NULL,
    data_4 BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        bot_name,
        ent_id
    )
);
-- TODO: Compress.
-- TODO: Add other BotData_n_m tables if need be (and BotData_1_4 is only for
-- show right now).



/* Private user data */

CREATE TABLE Private_UserData (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    password_hash VARBINARY(255),

    username VARCHAR(50) NOT NULL UNIQUE,
    -- TODO: Consider adding more restrictions.

    public_keys_for_authentication TEXT,
    -- (In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need to exchange passwords
    -- between databases.) (This could also be other data than encryption keys,
    -- and in principle it could even just be some ID to use for authenticating
    -- the user via a third party.)


    -- TODO: Implement managing of and restrictions on these fields when it
    -- becomes relevant:
    private_upload_vol_today BIGINT NOT NULL DEFAULT 0,
    private_download_vol_today BIGINT NOT NULL DEFAULT 0,
    private_upload_vol_this_month BIGINT NOT NULL DEFAULT 0,
    private_download_vol_this_month BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE Private_Sessions (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    session_id VARBINARY(255) NOT NULL,
    expiration_time BIGINT UNSIGNED NOT NULL -- unix timestamp.
);

CREATE TABLE Private_EMails (
    e_mail_address VARCHAR(255) PRIMARY KEY,
    number_of_accounts TINYINT UNSIGNED NOT NULL,
    -- This field is only temporary, until the e-mail address holder has
    -- confirmed the new account:
    account_1_user_id BIGINT UNSIGNED
);
