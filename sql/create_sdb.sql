
/* Scores */
DROP TABLE EntityLists;
DROP TABLE ListMetadata;

/* Requests */
DROP TABLE ScheduledRequests;

/* Entities */
DROP TABLE Entities;
DROP TABLE EntitySecKeys;

/* Indexes */
-- DROP TABLE FulltextIndexedEntities;

/* Private user data */
DROP TABLE Private_UserData;
-- DROP TABLE Private_Sessions;
-- DROP TABLE Private_EMails;

/* Debugging */
DROP TABLE DebugLogEntries;
-- DROP PROCEDURE logMsg;





/* Data structures  */

-- Note that the column types of the DataStructures can be converted at some
-- point when we implement a more compressed way of storing the data,
-- underneath the database's API.

CREATE TABLE DataStructures_SingleIndex (

    handler_id BIGINT UNSIGNED NOT NULL, -- Type can be changed.

    reader_whitelist_id BIGINT UNSIGNED NOT NULL, -- Type can be changed.

    format_ident TINYINT UNSIGNED NOT NULL,

    struct_key VARCHAR(64) -- Type can be resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    entry_key_data VARCHAR(64) -- Type can be resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    entry_payload_data VARCHAR(32) -- Type can be resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    PRIMARY KEY (
        handler_id,
        reader_whitelist_id,
        format_ident,
        struct_key,
        entry_key_data,
        entry_payload_data
    )
)
ROW_FORMAT = COMPRESSED;


CREATE TABLE DataStructures_TwoIndexes (

    handler_id BIGINT UNSIGNED NOT NULL, -- Type can be changed.

    reader_whitelist_id BIGINT UNSIGNED NOT NULL, -- Type can be changed.

    format_ident TINYINT UNSIGNED NOT NULL,

    struct_key VARCHAR(64) -- Type can be resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    entry_score_data VARCHAR(64) -- Type can be resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    entry_key_data VARCHAR(32) -- Type can be resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    entry_payload_data VARCHAR(32) -- Type can be resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    PRIMARY KEY (
        handler_id,
        reader_whitelist_id,
        format_ident,
        struct_key,
        entry_key_data
    )

    UNIQUE INDEX (
        handler_id,
        reader_whitelist_id,
        format_ident,
        struct_key,
        entry_score_data,
        entry_key_data
    )
)
ROW_FORMAT = COMPRESSED;



CREATE TABLE DataStructureFormats (

    handler_id BIGINT UNSIGNED NOT NULL,

    format_ident TINYINT UNSIGNED NOT NULL,

    format_def VARCHAR(255) -- Type can resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    PRIMARY KEY (
        handler_id,
        format_ident,
        format_def
    )
);
-- ROW_FORMAT = COMPRESSED;






/* Fulltext indexes */

-- TODO: Fulltext indexed tables should actually instead be created and
-- updated on demand from user groups that has pooled enough "upload data
-- cost" to do so, as described in my notes. *But at first, I will just use one
-- and only one such fulltext index table.

CREATE TABLE FulltextIndexEntries (

    ent_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    text_str VARCHAR(700) CHARACTER SET utf8mb4 NOT NULL,

    FULLTEXT idx (text_str)

)
ENGINE = InnoDB;








-- CREATE TABLE EntityLists (

--     list_id BIGINT UNSIGNED NOT NULL,

--     score_1 FLOAT NOT NULL,

--     score_2 FLOAT NOT NULL DEFAULT 0,

--     -- on_index_data VARBINARY(16) NOT NULL DEFAULT "", -- can be resized.

--     subj_id BIGINT UNSIGNED NOT NULL,

--     -- off_index_data VARBINARY(16) NOT NULL DEFAULT "", -- can be resized.

--     other_data VARBINARY(16) NOT NULL DEFAULT "", -- can be resized.

--     -- unix_time INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),

--     PRIMARY KEY (
--         list_id,
--         subj_id
--     ),

--     UNIQUE INDEX sec_idx (
--         list_id,
--         score_1,
--         score_2,
--         -- on_index_data,
--         subj_id
--     )
-- )
-- ROW_FORMAT = COMPRESSED;





-- CREATE TABLE ListMetadata (

--     list_id BIGINT UNSIGNED PRIMARY KEY,

--     list_len BIGINT UNSIGNED NOT NULL DEFAULT 0,

--     pos_list_len BIGINT UNSIGNED NOT NULL DEFAULT 0,

--     score_1_sum DOUBLE NOT NULL DEFAULT 0,

--     score_2_sum DOUBLE NOT NULL DEFAULT 0,

--     paid_upload_data_cost FLOAT NOT NULL DEFAULT 0
-- )
-- ROW_FORMAT = COMPRESSED;













CREATE TABLE ScheduledRequests (

    req_type VARBINARY(100) NOT NULL,

    req_data VARBINARY(2900) NOT NULL,

    is_handled_externally TINYINT NOT NULL DEFAULT 0,

    fraction_of_computation_cost_paid FLOAT NOT NULL,
    fraction_of_upload_data_cost_paid FLOAT NOT NULL,
    computation_cost_required FLOAT NOT NULL,
    upload_data_cost_required FLOAT NOT NULL,

    PRIMARY KEY (
        req_type,
        req_data
    ),

    UNIQUE INDEX sec_idx (
        is_handled_externally,
        fraction_of_computation_cost_paid,
        fraction_of_upload_data_cost_paid,
        computation_cost_required,
        upload_data_cost_required,
        req_type,
        req_data
    )
);

























/* Entities */


CREATE TABLE Entities (
    -- Entity ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Type identifier.
    ent_type CHAR NOT NULL,

    -- A string (possibly a JSON object) that defines the entity. The format
    -- depends on ent_type.
    def_str LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    -- The user who submitted the entity, unless creator_id = 0, which means
    -- that the creator is anonymous.
    creator_id BIGINT UNSIGNED NOT NULL DEFAULT 0,

    -- List of the users allowed to view the entity. Can also just be a single
    -- user ID (the creator, i.e.). Also, reader_whitelist_id = 0 means that
    -- everyone can view it.
    reader_whitelist_id BIGINT UNSIGNED NOT NULL DEFAULT 0,

    -- Whether the creator can edit the entity or not. (is_editable = 1 will
    -- also typically mean that the creator's profile info (username and
    -- possibly profile icon) is shown as well when rendering the entity.)
    -- Even when is_editable = 0, however, the creator is still able to
    -- substitute any '@[<path>]' placeholders with real entity ID references.
    is_editable TINYINT UNSIGNED NOT NULL DEFAULT 0, CHECK (is_editable <= 1),

    -- If creator_id = 0, then the entity cannot be edited. 
    CHECK (creator_id != 0 OR is_editable = 0),

    -- A (slowly decaying) counter that can be increased to prevent deletion.
    -- (An entity will only be deleted if the space is needed, though.)  
    paid_upload_data_cost FLOAT NOT NULL DEFAULT 80
);



/* Entity indexes */

CREATE TABLE EntitySecKeys (

    ent_type CHAR NOT NULL,

    reader_whitelist_id BIGINT UNSIGNED NOT NULL DEFAULT 0, -- (0 means public.)

    -- is_hashed TINYINT UNSIGNED NOT NULL, CHECK (is_hashed <= 1),

    def_key VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    ent_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        ent_type,
        reader_whitelist_id,
        def_key
    )
);








/* Initial entities */

INSERT INTO Entities (
    id, ent_type, def_str
)
VALUES
    -- (2, "t", "u"),
    -- (3, "t", "e"),
    -- (4, "t", "s"),
    -- (5, "t", "f"),
    -- (7, "t", "h"),
    -- (8, "t", "8"),
    -- (18, "d", "original_DB_node"),
    (19, "p", "initial_admin");

INSERT INTO Entities (
    id, ent_type, def_str, creator_id, is_editable
)
VALUES (20, "e", '{}', 19, 1);




INSERT INTO EntitySecKeys (
    ent_type, def_key, ent_id
)
VALUES
    -- ("t", "u", 2),
    -- ("t", "e", 3),
    -- ("t", "s", 4),
    -- ("t", "f", 5),
    -- ("t", "h", 7),
    -- ("t", "8", 8),
    -- ("d", "original_DB_node", 18),
    ("p", "initial_admin", 19);
    -- No sec. key for ("e", '{}', 9).











CREATE TABLE RecentlyEditedEntities (

    entry_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    ent_id BIGINT UNSIGNED NOT NULL
)

















-- /* Some initial inserts */

-- INSERT INTO Entities (
--     id, def_str
-- )
-- VALUES
--     (1, CONCAT(
--         '"',
--         "<h1><class>class</class></h1>",
--         "<h2>Description</h2>",
--         "<p>A class of all class entities (including itself). ",
--         "Classes both serve as a broad way of categorizing entities, ",
--         "and they are also used to define the meaning of their instances, ",
--         "as their <attr>description</attr> will be shown on the info page ",
--         "of each of their instances.",
--         "</p>",
--         "<p>As an example, this description of the <class>class</class> ",
--         "entity will be shown on the info page of all class entities, just ",
--         "above the description of the general <class>entity</class> class.",
--         "</p>",
--         "<p>The <attr>description</attr> of a class should include a ",
--         "section of 'special attributes,' if it defines a new attribute ",
--         "or redefines an attribute of a superclass (opposite of 'subclass'). ",
--         "As an example, since the <class>class</class> class introduces an ",
--         "optional <attr>superclass</attr> attribute and expands on the ",
--         "<attr>description</attr> attribute, the following 'special ",
--         "attributes' section will include a description of both these ",
--         "attributes.",
--         "</p>",
--         "<h2>Special attributes</h2>",
--         "<h3><attr>description</attr></h3>",
--         "<flags><flag>mandatory</flag><flag>extends superclass</flag></flags>",
--         "<p>...",
--         "</p>",
--         "<h3><attr>superclass</attr></h3>",
--         "<flags><flag>optional</flag></flags>",
--         "<p>...",
--         "</p>",
--         '"'
--     )),
--     (2, CONCAT(
--         '{"classes":["@this"],"description":["@1"],"title":"class"}'
--     )),
--     (3, CONCAT(
--         '"',
--         "A class of all entities (including itself).\n",
--         '"'
--     )),
--     (4, CONCAT(
--         '{"classes":["@2"],"descriptions":["@3"],"title":"entity"}'
--     )),
--     (NULL, '"exAmpLe of A noT very usefuL enTiTy"');
--     -- (1, 1, SHA2(CONCAT(
--     --     "A class of all 'statement' entities, which can be scored by the ",
--     --     "users in order to express their opinions and beliefs. ",
--     --     "A statement can for instance be '<Movie> is funny,' which might ",
--     --     "be scored by the users on a grading scale (A, B, C, D, F), and/or "
--     --     "a n-star scale. ",
--     --     "It can also be something like '<Movie> is an animated movie,' which ",
--     --     "might then be scored on a true-false scale (i.e. a likelihood ",
--     --     "scale) instead. ",
--     --     "Or it can be a statement concerning some quantity, such as ",
--     --     "'<Movie> has a length of x h,' where x here is taken to reference ",
--     --     "the score itself with which the users can qualify the ",
--     --     "statement. ",
--     --     "Note that it is the job of a 'statement' entity to define the scale ",
--     --     "that it is qualified by.\n"
--     --     "Unless otherwise specified (by the @13 subclass), statements ",
--     --     "Always talk about the thing that the entity represents, and not the ",
--     --     "representation itself."
--     -- ), 256), SHA2(CONCAT(
--     --     '{"title":"statement"}'
--     -- ), 256), ""),
--     -- (1, 1, SHA2(CONCAT(
--     --     "A class of all 'predicate' entities, which can be combined with a ",
--     --     "another 'subject' entity in order to form a @3 entity. ",
--     --     "Predicates must not require any specification other than said ",
--     --     "subject entity in order to form a well-formed @3 entity."
--     -- ), 256), SHA2(CONCAT(
--     --     '{"title":"predicate"}'
--     -- ), 256), ""),
--     -- (1, 1, SHA2(CONCAT(
--     --     "A class of all 'relation' entities, which can be combined with a ",
--     --     "another 'object' entity in order to form a @4 entity. ",
--     --     "Relations must not require any specification other than said ",
--     --     "object entity in order to form a well-formed @4 entity. ",
--     --     "Note that since predicates also takes a subject in order to form a ",
--     --     "@3 entity, this means that relations are essentially binary ",
--     --     "functions that returns a statement."
--     -- ), 256), SHA2(CONCAT(
--     --     '{"title":"relation"}'
--     -- ), 256), ""),
--     -- (1, 1, SHA2(CONCAT(
        
--     -- ), 256), SHA2(CONCAT(
        
--     -- ), 256), ""),
--     -- (6, 1, 0, '', '', CONCAT(
--     --     '{"title":"template"}'
--     -- ), CONCAT(
--     --     "A class of all 'template' entities, which ",
--     --     "can be used to define new entities with defining data that ",
--     --     "follow a specific format. The only property that defines an ",
--     --     "entity of this template class ",
--     --     "is the 'template' property, which is a variable property structure ",
--     --     "that has placeholders for substitution. ...TODO: Continue."
--     -- ), NULL),
--     -- (7, 1, 0, '', '', CONCAT(
--     --     '{"title":"user"}'
--     -- ), CONCAT(
--     --     "A class of the users of this Semantic Network. Whenever a ",
--     --     "new user is created, an entity of this 'user' class is created to ",
--     --     "represent this new user."
--     -- ), NULL),
--     -- (8, 6, 0, '', '', CONCAT(
--     --     '{"template":{"username":"%s"}}' -- "class":"@7"
--     -- ), CONCAT(
--     --     "A @6 used to create user entities."
--     -- ), CONCAT(
--     --     "A @7 of this Semantic Network."
--     -- )),
--     -- (9, 1, 0, '', '', CONCAT(
--     --     '{"title":"text"}'
--     -- ),  CONCAT(
--     --     "A class of texts. These are all strings of characters that has some ",
--     --     "(at least partial) meaning attached to them. ",
--     --     "Some text entities might also have more data (metadata) about them. ",
--     --     "For instance, and article or a comment might also include an author ",
--     --     "and a date."
--     -- ), NULL),
--     -- -- Note that we don't need a pure text data class/template, since we
--     -- -- already the ability to write texts in other_props and in data_input.
--     -- (10, 1, 0, '', '', CONCAT(
--     --     '{"title":"lexical item","superclass":"@9"}'
--     -- ),  CONCAT(
--     --     "A class of lexical items, which are any part of a sentence that can ",
--     --     "be said to have a meaning of its own, even if it cannot stand alone ",
--     --     "in a well-formed sentence. An example is a compound verb. ",
--     --     "Lexical items form a general class of what one might look up in a ",
--     --     "an extended dictionary that also includes things like phrases, and ",
--     --     "not just words." 
--     -- ), NULL),
--     -- (11, 1, 0, '', '', CONCAT(
--     --     '{"title":"word","superclass":"@10"}'
--     -- ),  CONCAT(
--     --     "A class of words. This class also includes compound words such as ",
--     --     "e.g. 'apple tree' and 'turned off.' Proper nouns are also included." 
--     -- ), NULL),
--     -- (12, 1, 0, '', '', CONCAT(
--     --     '{"title":"scale type"}'
--     -- ),  CONCAT(
--     --     "A class the descriptions and accompanying data structures (structs) ",
--     --     "that goes ",
--     --     "into defining the scales that qualifies the @3 entities when these ",
--     --     "are scored by the users."
--     -- ), NULL),
--     -- (13, 1, 0, '', '', CONCAT(
--     --     '{"title":"data statement","superclass":"@3"}'
--     -- ), CONCAT(
--     --     "A class of all statements that do not talk about the thing that ",
--     --     "the entities represent, but talk about the representation of the ",
--     --     "entities, i.e. the defining data of the entities in the database. "
--     --     "A good example is a statement saying that a subject is a more ",
--     --     "popular duplicate of the same entity. "
--     --     "Or that a subject is a better/more useful representation of the ",
--     --     'entity (giving us a way to essentially "edit" entities).'
--     -- ), NULL),
--     -- (14, 1, 0, '', '', CONCAT(
--     --     '{"title":"data predicate","superclass":"@4"}'
--     -- ), CONCAT(
--     --     "A class of all @4 entities that is used to form @13 entities."
--     -- ), NULL),
--     -- (15, 1, 0, '', '', CONCAT(
--     --     '{"title":"data relation","superclass":"@5"}'
--     -- ), CONCAT(
--     --     "A class of all @5 entities that is used to form @14 and ",
--     --     "@13 entities."
--     -- ), NULL),
--     -- (16, 6, 0, '', '', CONCAT(
--     --     -- "class":"@3"
--     --     '{"template":{"statement":"%s","scale type":"@21"}}'
--     -- ), CONCAT(
--     --     "A @6 that can be used to create @3 entities from texts, ",
--     --     "scored on the @21."
--     -- ), CONCAT(
--     --     "A @3 stating that @[Statement] is true, scored on the @21."
--     -- )),
--     -- (17, 6, 0, '', '', CONCAT(
--     --     -- "class":"@4"
--     --     '{"template":{"predicate":"%s","subject class":"%e1",',
--     --     '"statement":"@[Subject] fits @[Predicate]",',
--     --     '"scale type":"@22"}}'
--     -- ), CONCAT(
--     --     "A @6 that can be used to create @4 entities from adjectives or ",
--     --     "verbs, scored on the @22.\n",
--     --     -- "@[Predicate] should either be a (compound) adjective, ",
--     --     -- "a (compound) verb, or a (compound) noun, in which case we interpret ",
--     --     -- "the predicate to be 'is a/an @[Predicate]'. If you want to..."
--     --     "@[Predicate] should either be a (compound) adjective or ",
--     --     "a (compound) verb. However, by writing e.g. 'is a'/'is an', or ",
--     --     "'has'/'contains' in a parenthesis at the beginning of @[Predicate], ",
--     --     "the app can cut away this parenthesis when rendering the title of ",
--     --     "the entity in most cases. For instance, you might write '(is a) ",
--     --     "sci-fi movie' as @[Predicate], which can then be rendered as ",
--     --     "'sci-fi movie,' since the 'is a' part will generally be implicitly ",
--     --     "understood anyway. Or you might write '(has) good acting', which ",
--     --     "can then be rendered simply as 'good acting.' And as a last ",
--     --     "example, one could also write '(contains) spoilers' as ",
--     --     "@[Predicate], which can then be rendered simply as 'spoilers.'"
--     -- ), CONCAT(
--     --     "A @4 formed from an adjective or a verb (@[Predicate]), ",
--     --     "scored on the @21."
--     -- )),
--     -- (18, 6, 0, '', '', CONCAT(
--     --     -- "class":"@4"
--     --     '{"template":{"statement":"%s","subject class":"%e1",',
--     --     '"scale type":"@22"}}'
--     -- ), CONCAT(
--     --     "A @6 that can be used to create @4 entities with complicated ",
--     --     "formulations, scored on the @22.\n",
--     --     "@[Statement] should be a complicated sentence describing a ",
--     --     "predicate, referring directly to '@[Subject]'. If the predicate can ",
--     --     "be formulated simply as '@[Subject] <some verb>', use @17 instead."
--     -- ), CONCAT(
--     --     "A @4 formed from a whole statement, referring to @[Subject] ",
--     --     "as the subject of the predicate. It is scored on the @22."
--     -- )),
--     -- (19, 6, 0, '', '', CONCAT(
--     --     -- "class":"@5"
--     --     '{"template":{"noun":"%s",',
--     --     '"subject class":"%e1","object class":"%e2",',
--     --     '"predicate":"is the %s of @[Object]",',
--     --     '"statement":"@[Subject] is the %s of @[Object]",',
--     --     '"scale type":"@21"}}'
--     -- ), CONCAT(
--     --     "A @6 that can be used to create factual @5 entities from ",
--     --     "(singular) nouns, scored on the @21.\n",
--     --     "@[Noun] should be a singular (compound) noun."
--     -- ), CONCAT(
--     --     "A factual @5 formed from a (singular) noun, stating the @[Noun] ",
--     --     "of @[Object] is the @[Subject]. As a factual @5, it is scored on ",
--     --     "the @21."
--     -- )),
--     -- (20, 6, 0, '', '', CONCAT(
--     --     -- "class":"@5"
--     --     '{"template":{"noun (pl.)":"%s1",',
--     --     '"subject class":"%e1","object class":"%e2",',
--     --     '"graded w.r.t.":"%s2",',
--     --     '"predicate":"is an instance of the %s1 of @[Object], graded ',
--     --     'with respect to %s2",',
--     --     '"statement":"@[Subject] is an instance of the %s1 of @[Object], ',
--     --     'graded with respect to %s2",',
--     --     '"scale type":"@22"}}'
--     -- ), CONCAT(
--     --     "A @6 that can be used to create one-to-many @5 entities from ",
--     --     "(plural) nouns, scored on the @22 according to @[Graded w.r.t.] ",
--     --     "These entity lists should also be filtered ",
--     --     "according to the corresponding factual version of this relation, ",
--     --     "created from @27.\n",
--     --     "@[Noun (pl.)] should be a plural (compound) noun."
--     -- ), CONCAT(
--     --     "A one-to-many @5 formed from a (plural) noun, stating that ",
--     --     "@[Subject] is an instance of the @[Noun (pl.)] of @[Object], graded ",
--     --     "according to @[Graded w.r.t.] on the @22.\n",
--     --     "These entity lists should also be filtered ",
--     --     "according to the corresponding factual version of this relation, ",
--     --     "created from @27."
--     -- )),
--     -- (21, 12, 0, '', '', CONCAT(
--     --     '{"title":"Likelihood scale"}'
--     -- ), CONCAT(
--     --     "A scale to score the truth/falsity of a (factual) statement, or more ",
--     --     "precisely the likelihood with which the scoring users deem the ",
--     --     "statement to be true. ",
--     --     "This scale have a fixed interval, going from 0 % to 100 %."
--     -- ), NULL),
--     -- (22, 12, 0, '', '', CONCAT(
--     --     '{"title":"Grading scale"}'
--     -- ), CONCAT(
--     --     "A scale to score how well entities fit a certain predicate. ",
--     --     "This scale is intended for most instances where you need to score ",
--     --     "a class of entities among themselves in relation to some quality.\n",
--     --     "The entities with the highest scores should be the ones that you ",
--     --     "want to see at the top of the list if you are looking for the given ",
--     --     "quality specifically, and lowest-scored entities should be the ones ",
--     --     "you want to see last. ",
--     --     "And if you adjust a search/feed algorithm to give more weight to ",
--     --     "entities with this quality, the added weight should then generally ",
--     --     "be proportional to the score, i.e. the highest scored entities are ",
--     --     "boosted the most.\n",
--     --     "The interval of the scale is unlimited, but the default interval ",
--     --     "runs from approximately 0 to 10. And it is the intention that for ",
--     --     "most qualities, when the classes include enough entities, the ",
--     --     "curve over the combined user scores of all the entities should ",
--     --     "a bell curve, approximately. To remind the users of this, we will ",
--     --     "draw a bell curve in the background of the actual curve. And the ",
--     --     "bots that aggregate the user scores might even stretch or shrink ",
--     --     "the scale, or add an offset to it, such that it normalizes to a ",
--     --     "bell curve.\n",
--     --     "We will also divide the interval into grades, from F--A (skipping ",
--     --     "E), where F denotes 'among worst in terms of achieving the given ",
--     --     "quality, D denotes 'among the bad at achieving ...', C denotes ",
--     --     "'among the middling ...', B denotes 'among the good ...', and A ",
--     --     "denotes 'among the best in terms of achieving the given quality'."
--     -- ), NULL),
--     -- (23, 6, 0, '', '', CONCAT(
--     --     -- "class":"@3"
--     --     '{"template":{"predicate":"%e1","subject":"%e2"}}'
--     -- ), CONCAT(
--     --     "A @6 for creating @3 entities by applying @[Predicate] to ",
--     --     "@[Subject]."
--     -- ), CONCAT(
--     --     "A @3 formed by applying @[Predicate] to @[Subject]."
--     -- )),
--     -- (24, 6, 0, '', '', CONCAT(
--     --     -- "class":"@13"
--     --     '{"template":{"predicate":"%e1","subject":"%e2"}}'
--     -- ), CONCAT(
--     --     "A @6 for creating @13 entities by applying @[Predicate] to ",
--     --     "@[Subject]."
--     -- ), CONCAT(
--     --     "A @13 formed by applying @[Predicate] to @[Subject]."
--     -- )),
--     -- (25, 6, 0, '', '', CONCAT(
--     --     -- "class":"@4"
--     --     '{"template":{"relation":"%e1","object":"%e2"}}'
--     -- ), CONCAT(
--     --     "A @6 for creating @4 entities by applying @[Relation] to ",
--     --     "@[Object]."
--     -- ), CONCAT(
--     --     "A @4 formed by applying @[Relation] to @[Object]."
--     -- )),
--     -- (26, 6, 0, '', '', CONCAT(
--     --     -- "class":"@14"
--     --     '{"template":{"relation":"%e1","object":"%e2"}}'
--     -- ), CONCAT(
--     --     "A @6 for creating @14 entities by applying @[Relation] to ",
--     --     "@[Object]."
--     -- ), CONCAT(
--     --     "A @14 formed by applying @[Relation] to @[Object]."
--     -- )),
--     -- (27, 6, 0, '', '', CONCAT(
--     --     -- "class":"@5"
--     --     '{"template":{"noun (pl.)":"%s",',
--     --     '"subject class":"%e1","object class":"%e2",',
--     --     '"predicate":"is an instance of the %s of @[Object]",',
--     --     '"statement":"@[Subject] is an instance of the %s of @[Object]",',
--     --     '"scale type":"@21"}}'
--     -- ), CONCAT(
--     --     "A @6 that can be used to create factual one-to-many @5 entities ",
--     --     "from (plural) nouns, scored on the @21 in terms of whether they are ",
--     --     "instances of the @[Noun (pl.)] of @[Object].\n",
--     --     "@[Noun (pl.)] should be a plural (compound) noun."
--     -- ), CONCAT(
--     --     "A one-to-many @5 formed from a (plural) noun, stating that ",
--     --     "@[Subject] is an instance of the @[Noun (pl.)] of @[Object], scored ",
--     --     "on the @21."
--     -- )),
--     -- -- (10, 1, 0, '', '', CONCAT(
--     -- --     '{"superclass":"@2","title":"property tag"}'
--     -- -- ), CONCAT(
--     -- --     "A class of 'property tags,' which are tags of a very specific ",
--     -- --     "structure used to form semantic relations in this semantic system. ",
--     -- --     "A property tag is always constructed from just a 'property' entity ",
--     -- --     "(of the 'property relation' class) and another 'subject' entity ",
--     -- --     "(of any class). The resulting rating scale is then how well the ",
--     -- --     "given instance entity fits the given property of the subject entity. "
--     -- --     "For instance, we might have a movie entity as our subject entity, ",
--     -- --     "and 'director' as our property entity, and have 'John Doe' ",
--     -- --     "as the instance entity, which says that John Doe is the ",
--     -- --     "director of the given movie. If the property entity has no ",
--     -- --     "further description, then the rating scale is just a 1–5 scale of ",
--     -- --     "how well the ",
--     -- --     "instance (e.g. John Doe) fits the given tag, e.g. the 'director ",
--     -- --     "of the given movie.' But the property entity might also specify ",
--     -- --     "this rating further in its description. (For instance, it might ", 
--     -- --     "specify that the main director always ought to be given 5 stars on ",
--     -- --     "the rating scale from 1 to 5, e.g.)"
--     -- -- ), NULL),
--     -- -- (11, 3, 0, '', '', CONCAT(
--     -- --     '{"format":{',
--     -- --         -- '"class":"@10",',
--     -- --         '"subject":"%e1",',
--     -- --         '"property":"%e2",',
--     -- --     '}}'
--     -- -- ), NULL),
--     -- -- (12, 1, 0, '', '', CONCAT(
--     -- --     '{"title":"entity"}'
--     -- -- ), CONCAT(
--     -- --     "A class of all entities of this Semantic Network. All entities ",
--     -- --     "automatically has this class without needing to specify so in their ",
--     -- --     "definition."
--     -- -- ), NULL),
--     -- -- (13, 4, 5, '', 'initial_user', NULL, NULL),
--     -- -- (14, 1, 0, '', '', CONCAT(
--     -- --     '{"title":"list"}'
--     -- -- ), CONCAT(
--     -- --     "A class of all (ordered) lists. The only property of ",
--     -- --     "this class, other than the 'class' property itself, is an 'elements' ",
--     -- --     "property that includes a list of all the elements. Note that lists ",
--     -- --     "are written in property structs as e.g. '",
--     -- --     '"elements":[[elem_1, elem_2, elem_3]]',
--     -- --     "', whereas '[elem_1, elem_2, elem_3]' (with no nesting) is ",
--     -- --     "interpreted as an unordered set of valid property values (used for ",
--     -- --     "one-to-many properties)."
--     -- -- ), NULL),
--     -- -- (15, 3, 0, '', '', CONCAT(
--     -- --     '{"format":{"elements":[["%s%t"]]}' -- "class":"@14"
--     -- -- ), NULL),
--     -- -- (16, 3, 0, '', '', CONCAT(
--     -- --     -- "class":"@3"
--     -- --     '{"format":{"class":"@2","title":"%s",',
--     -- --     '"instance class":"%e1","description":"%t"}'
--     -- -- ), NULL),
--     -- -- (17, 8, 9, '8', 'relevant property', NULL, CONCAT(
--     -- --     "A property relation where the objects are the property relations ",
--     -- --     "that are relevant to the subject entity."
--     -- -- ), NULL),
--     -- -- (18, 8, 9, '8,1', 'relevant property of class instances', NULL, CONCAT(
--     -- --     "A property relation where the objects are the property relations ",
--     -- --     "that are relevant to all the instances of the subject class."
--     -- -- ), NULL),
--     -- -- (19, 10, 11, '12,18', '', NULL, NULL),
--     -- -- (20, 10, 11, '2,18', '', NULL, NULL),
--     -- -- (21, 1, 0, '', '', CONCAT(
--     -- --     '{"title":"set"}'
--     -- -- ), CONCAT(
--     -- --     "A class of all sets (unordered lists). The only property of ",
--     -- --     "this class, other than the 'class' property itself, is an 'elements' ",
--     -- --     "property holding an array of all the elements of the set. ",
--     -- --     "Note that sets are written in property structs as e.g. '",
--     -- --     '"elements":[elem_1, elem_2, elem_3]',
--     -- --     "', whereas '[[elem_1, elem_2, elem_3]]' (a nested array) is ",
--     -- --     "interpreted as a (ordered) list instead. "
--     -- --     "Whenever a set entity is the value of a property in a property ",
--     -- --     "struct, the interpretation is that all the elements fits the given ",
--     -- --     "property, not the set itself. To sey that a set entity itself is ",
--     -- --     "the value of a property, simply wrap it in another set, either ",
--     -- --     "using the '[]' syntax or by creating another set entity with the ",
--     -- --     "given set as its only element."
--     -- -- ), NULL),
--     -- -- (22, 3, 0, '', '', CONCAT(
--     -- --     '{"format":{"elements":["%s%t"]}' -- "class":"@21"
--     -- -- ), NULL),
--     -- -- 
--     -- (NULL, 1, 6, '', 'exAmpLe of A noT very usefuL enTiTy', NULL, NULL, NULL);


-- -- [...] If data_input is a binary file, '%b' is used, but this should
-- -- conventionally only be used for special file classes (which defines the
-- -- file format but no other metadata about the file). 
-- -- Special characters are '%', '@', which are escaped with backslashes,
-- -- as well as the other special characters of JSON, of course (escaped the
-- -- JSON way), in case of the propStruct. For the tmplInput, the separator '|'
-- -- is also special, also escaped by a backslash.
-- -- '@' is used to write IDs, namely by writing e.g. '"@6"' which refers the the
-- -- "initial_user" entity.







/* Users */

-- CREATE TABLE Users (
--     -- User data key (private).
--     data_key BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

--     username VARCHAR(50) NOT NULL,
--     -- TODO: Consider adding more restrictions.

--     public_keys_for_authentication TEXT,
--     -- (In order for third parties to be able to copy the database and then
--     -- be able to have users log on, without the need to exchange passwords
--     -- between databases.) (This could also be other data than encryption keys,
--     -- and in principle it could even just be some ID to use for authenticating
--     -- the user via a third party.)

--     UNIQUE INDEX (username)
-- );










/* Private user data */

CREATE TABLE Private_UserData (
    user_id BIGINT UNSIGNED PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,
    -- TODO: Consider adding more restrictions.

    password_salted_hash CHAR(60),

    public_keys_for_authentication TEXT,
    -- TODO: Update column name, and this description.
    -- (In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need to exchange passwords
    -- between databases.) (This could also be other data than encryption keys,
    -- and in principle it could even just be some ID to use for authenticating
    -- the user via a third party.)


    -- download_data_this_week FLOAT NOT NULL DEFAULT 0, -- number pages touched.
    -- download_data_weekly_limit FLOAT NOT NULL DEFAULT 50000000,

    upload_data_this_week FLOAT NOT NULL DEFAULT 0, -- bytes.
    upload_data_weekly_limit FLOAT NOT NULL DEFAULT 1000000,
    computation_usage_this_week FLOAT NOT NULL DEFAULT 0, -- ms.
    computation_usage_weekly_limit FLOAT NOT NULL DEFAULT 500000,

    last_refreshed_at DATE NOT NULL DEFAULT (CURDATE()),

    private_storage_data_usage FLOAT NOT NULL DEFAULT 0, -- bytes.
    private_storage_data_limit FLOAT NOT NULL DEFAULT 10000000,

    user_profile_count FLOAT NOT NULL DEFAULT 0, -- number of user profiles.
    user_profile_limit FLOAT NOT NULL DEFAULT 8
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















CREATE TABLE DebugLogEntries (

    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    msg VARCHAR(1000)
);

DELIMITER //
CREATE PROCEDURE logMsg (
    IN logMessage VARCHAR(1000)
)
BEGIN
    INSERT INTO DebugLogEntries (msg)
    VALUE (logMessage);
END //
DELIMITER ;
