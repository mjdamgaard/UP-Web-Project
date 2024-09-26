
/* Ratings */
DROP TABLE AtomicStatementScores;
DROP TABLE PredicativeStatementScores;
DROP TABLE RelationalStatementScores;

DROP TABLE RecordedInputs;

/* Indexes */
DROP TABLE IndexedEntities;

/* Entities */
DROP TABLE Entities;

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
 * is that all such statements come with a numerical value which qualifies
 * the statement.
 **/


CREATE TABLE AtomicStatementScores (
    -- User (or bot) who scores the statement.
    user_id BIGINT UNSIGNED NOT NULL,

    -- Statement.
    stmt_id BIGINT UNSIGNED NOT NULL,

    -- Score value. This value qualifies the statement. It might represent a
    -- grade that scores the statement on some grading scale, or a likelihood
    -- of how probable the stmt is, or it might even represent a quantity. For
    -- instance 'x costs money' might be qualified by a score in units of the
    -- money that x is believed to cost.
    score_val FLOAT NOT NULL,

    -- Rating error (standard deviation).
    score_err FLOAT UNSIGNED NOT NULL,

    PRIMARY KEY (
        user_id,
        stmt_id
    )

    -- Still better to use a bot for this instead:
    -- -- Index to look up users who has rated the statement.
    -- UNIQUE INDEX (stmt_id, score_val, score_err, user_id)
);


CREATE TABLE PredicativeStatementScores (
    -- User (or bot) who scores the statement.
    user_id BIGINT UNSIGNED NOT NULL,

    -- Predicate that forms the statement together with the subject.
    pred_id BIGINT UNSIGNED NOT NULL,

    -- Subject that forms the statement together with the predicate.
    subj_id BIGINT UNSIGNED NOT NULL,

    -- --"--
    score_val FLOAT NOT NULL,
    -- --"--
    score_err FLOAT UNSIGNED NOT NULL,

    PRIMARY KEY (
        user_id,
        pred_id,
        score_val,
        subj_id,
        score_err
    ),

    -- Index to look up specific rating (and restricting one rating pr. user.)
    UNIQUE INDEX (user_id, pred_id, subj_id)

    -- Still better to use a bot for this instead:
    -- -- Index to look up users who has rated the stmt / rating scale.
    -- UNIQUE INDEX (pred_id, subj_id, score_val, score_err, user_id)
);



CREATE TABLE RelationalStatementScores (
    -- User (or bot) who scores the statement.
    user_id BIGINT UNSIGNED NOT NULL,

    -- Relation that forms the stmt together with the object and subject.
    rel_id BIGINT UNSIGNED NOT NULL,

    -- Object that forms the stmt together with the relation and subject.
    obj_id BIGINT UNSIGNED NOT NULL,

    -- Subject that forms the stmt together with the relation and object.
    subj_id BIGINT UNSIGNED NOT NULL,

    -- --"--
    score_val FLOAT NOT NULL,
    -- --"--
    score_err FLOAT UNSIGNED NOT NULL,

    PRIMARY KEY (
        user_id,
        obj_id,
        rel_id,
        score_val,
        subj_id,
        score_err
    ),

    -- Index to look up specific rating (and restricting one rating pr. user.)
    UNIQUE INDEX (user_id, obj_id, rel_id, subj_id)

    -- Still better to use a bot for this instead:
    -- -- Index to look up users who has rated the stmt / rating scale.
    -- UNIQUE INDEX (obj_id, rel_id, subj_id, score_val, score_err, user_id)

    -- All relations are directional, so we don't need:
    -- UNIQUE INDEX (user_id, subj_id, rel_id, obj_id)
);

-- TODO: Compress these tables and their sec. index, as well as other tables
-- and sec. indexes below.




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
    rat_val FLOAT UNSIGNED,

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

    -- Class ID: An entity that represents the main class of this entity.
    class_id BIGINT UNSIGNED NOT NULL,
    CHECK (class_id != 0),

    -- Template ID: An entity that this entity inherits properties from.
    -- the a template entity holds a format property which is a JSON object
    -- containing the properties of the instance entities, where some of the
    -- property values might include placeholders of the form '%e0', '%e1',
    -- etc.,
    -- or of the form '%b', '%t', or '%t1', '%t2', etc. ('%' is escaped by
    -- '\%'.)
    template_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    -- (A majority of entities will have a tmpl, so we use 0 instead of NULL.)

    -- Template entity (ID) input: A list of integers separated by ',',
    -- which substitutes the /%e[0-9]/ placeholders of the template.
    template_entity_input VARCHAR(209) NOT NULL DEFAULT "",

    -- Template entity ID lists: A list of integers separated by ','
    -- and '|', which substitutes the /%l[0-9]/ placeholders of the template.
    -- Each '%l<n>' is substituted by the nth comma-separated list, each list
    -- separated by the '|'s.
    template_list_input VARCHAR(209) NOT NULL DEFAULT "",

    -- Template string input: A list of string inputs separated by '|',
    -- which substitutes the /%s[0-9]/ placeholders of the template.
    -- ('|' is escaped by '\|'.)
    -- One can also use '%s' instead, which is substituted by the whole string
    -- (and '|' is then not taken as a special character).
    template_string_input VARCHAR(255)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT "",


    -- Other properties: A data structure containing the specific properties
    -- of this entity, and formatted as a JSON object. If a property value is
    -- an array, it is interpreted as a set (used for one-to-many properties,
    -- such as e.g. movie->actor). An array nested directly inside of an array
    -- is interpreted as a ordered list, however. (When in doubt of whether to
    -- define an entity via an ordered list or a set, use a set.) 
    main_props TEXT(1000) DEFAULT NULL, -- (Can be resized.)

    own_desc TEXT(10000) DEFAULT NULL, -- (Can be resized.)
    inst_desc TEXT(10000) DEFAULT NULL, -- (Can be resized.)

    ref_text TEXT(10000) DEFAULT NULL,

    other_props TEXT(1000) DEFAULT NULL, -- (Can be resized.)


    -- Binary data: A blob storing.. 
    binary_data LONGBLOB DEFAULT NULL,
    -- (Size restrictions on this BLOB can be implemented in the control layer,
    -- or in the interface with it, i.e. in the "input procedures.")

    CHECK (
        main_props  != "" AND
        own_desc    != "" AND
        inst_desc   != "" AND
        ref_text    != "" AND
        other_props != "" AND
        binary_data != ""
    ),

    CHECK (
        template_id = 0 OR
            main_props IS NULL AND
            inst_desc  IS NULL
            -- binary_data IS NULL
    ),


    data_hash VARCHAR(56) NOT NULL DEFAULT (
        CASE WHEN (
            main_props  IS NULL AND
            own_desc    IS NULL AND
            inst_desc   IS NULL AND
            ref_text    IS NULL AND
            other_props IS NULL AND
            binary_data IS NULL
        )
        THEN ""
        ELSE SHA2(CONCAT(
            IFNULL(SHA2(main_props,  224), "null"),
            IFNULL(SHA2(own_desc,    224), "null"),
            IFNULL(SHA2(inst_desc,   224), "null"),
            IFNULL(SHA2(ref_text,    224), "null"),
            IFNULL(SHA2(other_props, 224), "null"),
            IFNULL(SHA2(binary_data, 224), "null")
        ), 224)
        END
    ),

    UNIQUE INDEX (
        class_id, template_id,
        data_hash,
        template_entity_input, template_list_input, template_string_input
    ),


    -- ID of the creator, i.e. the user who uploaded this entity.
    creator_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    -- (A majority of entities will have a creator.)

    UNIQUE INDEX (creator_id, id)
);


/* Some initial inserts */

INSERT INTO Entities (
    id, class_id, template_id, template_entity_input, template_string_input,
    main_props, own_desc, inst_desc
)
VALUES
    (1, 1, 0, '', '', CONCAT(
        '{"title":"class"}'
    ), CONCAT(
        "A class of all 'class' entities, including this entity itself."
    ), NULL),
    (2, 1, 0, '', '', CONCAT(
        '{"title":"entity"}'
    ), CONCAT(
        "A class of all entities, including this entity itself."
    ), NULL),
    (3, 1, 0, '', '', CONCAT(
        '{"title":"statement"}'
    ), CONCAT(
        "A class of all 'statement' entities, which can be scored by the ",
        "users in order to express their opinions and beliefs. ",
        "A statement can for instance be '<Movie> is funny,' which might ",
        "be scored by the users on a grading scale (A, B, C, D, F), and/or "
        "a n-star scale. ",
        "It can also be something like '<Movie> is an animated movie,' which ",
        "might then be scored on a true-false scale (i.e. a likelihood ",
        "scale) instead. ",
        "Or it can be a statement concerning some quantity, such as ",
        "'<Movie> has a length of x h,' where x here is taken to reference ",
        "the score itself with which that the users can qualify the ",
        "statement. ",
        "Note that it is the job of a 'statement' entity to define the scale ",
        "that it is qualified by. "
        "And unless otherwise specified (by the @13c1 subclass), statements ",
        "Always talk about the thing that the entity represents, and not the ",
        "representation itself."
    ), NULL),
    (4, 1, 0, '', '', CONCAT(
        '{"title":"predicate"}'
    ), CONCAT(
        "A class of all 'predicate' entities, which can be combined with a ",
        "another 'subject' entity in order to form a @3c1 entity. ",
        "Predicates must not require any specification other than said ",
        "subject entity in order to form a well-formed @3c1 entity."
    ), NULL),
    (5, 1, 0, '', '', CONCAT(
        '{"title":"relation"}'
    ), CONCAT(
        "A class of all 'relation' entities, which can be combined with a ",
        "another 'object' entity in order to form a @4c1 entity. ",
        "Relations must not require any specification other than said ",
        "object entity in order to form a well-formed @4c1 entity. ",
        "Note that since predicates also takes a subject in order to form a ",
        "@3c1 entity, this means that relations are essentially binary ",
        "functions that returns a statement."
    ), NULL),
    (6, 1, 0, '', '', CONCAT(
        '{"title":"template"}'
    ), CONCAT(
        '{"title":"template"}'
        "A class of all 'template' entities, which ",
        "can be used to define new entities with defining data that ",
        "follow a specific format. The only property that defines an ",
        "entity of this template class ",
        "is the 'template' property, which is a variable property structure ",
        "that has placeholders for substitution. ...TODO: Continue."
    ), NULL),
    (7, 1, 0, '', '', CONCAT(
        '{"title":"user"}'
    ), CONCAT(
        "A class of the users of this Semantic Network. Whenever a ",
        "new user is created, an entity of this 'user' class is created to ",
        "represent this new user."
    ), NULL),
    (8, 6, 0, '', '', CONCAT(
        '{"template":{"username":"%s"}}' -- "class":"@7"
    ), CONCAT(
        "A @6c1 used to create user entities."
    ), CONCAT(
        "A @7c1 of this Semantic Network."
    )),
    (9, 1, 0, '', '', CONCAT(
        '{"title":"text"}'
    ),  CONCAT(
        "A class of texts. These are all strings of characters that has some ",
        "(at least partial) meaning attached to them. ",
        "Some text entities might also have more data (metadata) about them. ",
        "For instance, and article or a comment might also include an author ",
        "and a date."
    ), NULL),
    -- Note that we don't need a pure text data class/template, since we
    -- already the ability to write texts in other_props and in data_input.
    (10, 1, 0, '', '', CONCAT(
        '{"title":"lexical item","superclass@c1":"@9"}'
    ),  CONCAT(
        "A class of lexical items, which are any part of a sentence that can ",
        "be said to have a meaning of its own, even if it cannot stand alone ",
        "in a well-formed sentence. An example is a compound verb. ",
        "Lexical items form a general class of what one might look up in a ",
        "an extended dictionary that also includes things like phrases, and ",
        "not just words." 
    ), NULL),
    (11, 1, 0, '', '', CONCAT(
        '{"title":"word","superclass@c1":"@10"}'
    ),  CONCAT(
        "A class of words. This class also includes compound words such as ",
        "e.g. 'apple tree' and 'turned off.' Proper nouns are also included." 
    ), NULL),
    (12, 1, 0, '', '', CONCAT(
        '{"title":"scale type"}'
    ),  CONCAT(
        "A class the descriptions and accompanying data structures (structs) ",
        "that goes ",
        "into defining the scales that qualifies the @3c1 entities when these ",
        "are scored by the users."
    ), NULL),
    (13, 1, 0, '', '', CONCAT(
        '{"title":"data statement","superclass@c1":"@3"}'
    ), CONCAT(
        "A class of all statements that do not talk about the thing that ",
        "the entities represent, but talk about the representation of the ",
        "entities, i.e. the defining data of the entities in the database. "
        "A good example is a statement saying that a subject is a more ",
        "popular duplicate of the same entity. "
        "Or that a subject is a better/more useful representation of the ",
        'entity (giving us a way to essentially "edit" entities).'
    ), NULL),
    (14, 1, 0, '', '', CONCAT(
        '{"title":"data predicate","superclass@c1":"@4"}'
    ), CONCAT(
        "A class of all @4c1 entities that is used to form @13c1 entities."
    ), NULL),
    (15, 1, 0, '', '', CONCAT(
        '{"title":"data relation","superclass@c1":"@5"}'
    ), CONCAT(
        "A class of all @5c1 entities that is used to form @14c1 and ",
        "@13c1 entities."
    ), NULL),
    (16, 6, 0, '', '', CONCAT(
        -- "class":"@3"
        '{"template":{"statement":"%s","scale type@c12":"@21"}}'
    ), CONCAT(
        "A @6c1 that can be used to create @3c1 entities from texts, ",
        "scored on the @21."
    ), CONCAT(
        "A @3c1 stating that @[Statement] is true, scored on the @21."
    )),
    (17, 6, 0, '', '', CONCAT(
        -- "class":"@4"
        '{"template":{"predicate":"%s","subject class@c1":"%e1",',
        '"statement":"@[Subject] fits @[Predicate]",',
        '"scale type@c12":"@22"}}'
    ), CONCAT(
        "A @6c1 that can be used to create @4c1 entities from adjectives or ",
        "verbs, scored on the @22.\n",
        "@[Predicate] should either be a (compound) adjective ",
        "or a (compound) verb."
    ), CONCAT(
        "A @4c1 formed from an adjective or a verb (@[Predicate]), ",
        "scored on the @21."
    )),
    (18, 6, 0, '', '', CONCAT(
        -- "class":"@4"
        '{"template":{"statement":"%s","subject class@c1":"%e1",',
        '"scale type@c12":"@22"}}'
    ), CONCAT(
        "A @6c1 that can be used to create @4c1 entities with complicated ",
        "formulations, scored on the @22.\n",
        "@[Statement] should be a complicated sentence describing a ",
        "predicate, referring directly to '@[Subject]'. If the predicate can ",
        "be formulated simply as '@[Subject] <some verb>', use @17 instead."
    ), CONCAT(
        "A @4c1 formed from a whole statement, referring to @[Subject] ",
        "as the subject of the predicate. It is scored on the @22."
    )),
    (19, 6, 0, '', '', CONCAT(
        -- "class":"@5"
        '{"template":{"noun":"%s",',
        '"subject class@c1":"%e1","object class@c1":"%e2",',
        '"predicate":"is the %s of @[Object]",',
        '"statement":"@[Subject] is the %s of @[Object]",',
        '"scale type@c12":"@21"}}'
    ), CONCAT(
        "A @6c1 that can be used to create factual @5c1 entities from ",
        "(singular) nouns, scored on the @21.\n",
        "@[Noun] should be a singular (compound) noun."
    ), CONCAT(
        "A factual @5c1 formed from a (singular) noun, stating the @[Noun] ",
        "of @[Object] is the @[Subject]. As a factual @5c1, it is scored on ",
        "the @21."
    )),
    (20, 6, 0, '', '', CONCAT(
        -- "class":"@5"
        '{"template":{"noun (pl.)":"%s1",',
        '"subject class@c1":"%e1","object class@c1":"%e2",',
        '"graded w.r.t.":"%s2",',
        '"predicate":"is an instance of the %s1 of @[Object], graded ',
        'with respect to %s2",',
        '"statement":"@[Subject] is an instance of the %s1 of @[Object], ',
        'graded with respect to %s2",',
        '"scale type@c12":"@22"}}'
    ), CONCAT(
        "A @6c1 that can be used to create one-to-many @5c1 entities from ",
        "(plural) nouns, scored on the @22 according to @[Graded w.r.t.] ",
        "These entity lists should also be filtered ",
        "according to the corresponding factual version of this relation, ",
        "created from @27.\n",
        "@[Noun (pl.)] should be a plural (compound) noun."
    ), CONCAT(
        "A one-to-many @5c1 formed from a (plural) noun, stating that ",
        "@[Subject] is an instance of the @[Noun (pl.)] of @[Object], graded ",
        "according to @[Graded w.r.t.] on the @22.\n",
        "These entity lists should also be filtered ",
        "according to the corresponding factual version of this relation, ",
        "created from @27."
    )),
    (21, 12, 0, '', '', CONCAT(
        '{"title":"Likelihood scale"}'
    ), CONCAT(
        "A scale to score the truth/falsity of a (factual) statement, or more ",
        "precisely the likelihood with which the scoring users deem the ",
        "statement to be true. ",
        "This scale have a fixed interval, going from 0 % to 100 %."
    ), NULL),
    (22, 12, 0, '', '', CONCAT(
        '{"title":"Grading scale"}'
    ), CONCAT(
        "A scale to score how well entities fit a certain predicate. ",
        "This scale is intended for most instances where you need to score ",
        "a class of entities among themselves in relation to some quality.\n",
        "The entities with the highest scores should be the ones that you ",
        "want to see at the top of the list if you are looking for the given ",
        "quality specifically, and lowest-scored entities should be the ones ",
        "you want to see last. ",
        "And if you adjust a search/feed algorithm to give more weight to ",
        "entities with this quality, the added weight should then generally ",
        "be proportional to the score, i.e. the highest scored entities are ",
        "boosted the most.\n",
        "The interval of the scale is unlimited, but the default interval ",
        "runs from approximately 0 to 10. And it is the intention that for ",
        "most qualities, when the classes include enough entities, the ",
        "curve over the combined user scores of all the entities should ",
        "a bell curve, approximately. To remind the users of this, we will ",
        "draw a bell curve in the background of the actual curve. And the ",
        "bots that aggregate the user scores might even stretch or shrink ",
        "the scale, or add an offset to it, such that it normalizes to a ",
        "bell curve.\n",
        "We will also divide the interval into grades, from F--A (skipping ",
        "E), where F denotes 'among worst in terms of achieving the given ",
        "quality, D denotes 'among the bad at achieving ...', C denotes ",
        "'among the middling ...', B denotes 'among the good ...', and A ",
        "denotes 'among the best in terms of achieving the given quality'."
    ), NULL),
    (23, 6, 0, '', '', CONCAT(
        -- "class":"@3"
        '{"template":{"predicate@c4":"%e1","subject":"%e2"}}'
    ), CONCAT(
        "A @6c1 for creating @3c1 entities by applying @[Predicate] to ",
        "@[Subject]."
    ), CONCAT(
        "A @3c1 formed by applying @[Predicate] to @[Subject]."
    )),
    (24, 6, 0, '', '', CONCAT(
        -- "class":"@13"
        '{"template":{"predicate@c14":"%e1","subject":"%e2"}}'
    ), CONCAT(
        "A @6c1 for creating @13c1 entities by applying @[Predicate] to ",
        "@[Subject]."
    ), CONCAT(
        "A @13c1 formed by applying @[Predicate] to @[Subject]."
    )),
    (25, 6, 0, '', '', CONCAT(
        -- "class":"@4"
        '{"template":{"relation@c5":"%e1","object":"%e2"}}'
    ), CONCAT(
        "A @6c1 for creating @4c1 entities by applying @[Relation] to ",
        "@[Object]."
    ), CONCAT(
        "A @4c1 formed by applying @[Relation] to @[Object]."
    )),
    (26, 6, 0, '', '', CONCAT(
        -- "class":"@14"
        '{"template":{"relation@c15":"%e1","object":"%e2"}}'
    ), CONCAT(
        "A @6c1 for creating @14c1 entities by applying @[Relation] to ",
        "@[Object]."
    ), CONCAT(
        "A @14c1 formed by applying @[Relation] to @[Object]."
    )),
    (27, 6, 0, '', '', CONCAT(
        -- "class":"@5"
        '{"template":{"noun (pl.)":"%s",',
        '"subject class@c1":"%e1","object class@c1":"%e2",',
        '"predicate":"is an instance of the %s of @[Object]",',
        '"statement":"@[Subject] is an instance of the %s of @[Object]",',
        '"scale type@c12":"@21"}}'
    ), CONCAT(
        "A @6c1 that can be used to create factual one-to-many @5c1 entities ",
        "from (plural) nouns, scored on the @21 in terms of whether they are ",
        "instances of the @[Noun (pl.)] of @[Object].\n",
        "@[Noun (pl.)] should be a plural (compound) noun."
    ), CONCAT(
        "A one-to-many @5c1 formed from a (plural) noun, stating that ",
        "@[Subject] is an instance of the @[Noun (pl.)] of @[Object], scored ",
        "on the @21."
    )),
    -- (10, 1, 0, '', '', CONCAT(
    --     '{"superclass":"@2","title":"property tag"}'
    -- ), CONCAT(
    --     "A class of 'property tags,' which are tags of a very specific ",
    --     "structure used to form semantic relations in this semantic system. ",
    --     "A property tag is always constructed from just a 'property' entity ",
    --     "(of the 'property relation' class) and another 'subject' entity ",
    --     "(of any class). The resulting rating scale is then how well the ",
    --     "given instance entity fits the given property of the subject entity. "
    --     "For instance, we might have a movie entity as our subject entity, ",
    --     "and 'director' as our property entity, and have 'John Doe' ",
    --     "as the instance entity, which says that John Doe is the ",
    --     "director of the given movie. If the property entity has no ",
    --     "further description, then the rating scale is just a 1–5 scale of ",
    --     "how well the ",
    --     "instance (e.g. John Doe) fits the given tag, e.g. the 'director ",
    --     "of the given movie.' But the property entity might also specify ",
    --     "this rating further in its description. (For instance, it might ", 
    --     "specify that the main director always ought to be given 5 stars on ",
    --     "the rating scale from 1 to 5, e.g.)"
    -- ), NULL),
    -- (11, 3, 0, '', '', CONCAT(
    --     '{"format":{',
    --         -- '"class":"@10",',
    --         '"subject":"%e1",',
    --         '"property":"%e2",',
    --     '}}'
    -- ), NULL),
    -- (12, 1, 0, '', '', CONCAT(
    --     '{"title":"entity"}'
    -- ), CONCAT(
    --     "A class of all entities of this Semantic Network. All entities ",
    --     "automatically has this class without needing to specify so in their ",
    --     "definition."
    -- ), NULL),
    -- (13, 4, 5, '', 'initial_user', NULL, NULL),
    -- (14, 1, 0, '', '', CONCAT(
    --     '{"title":"list"}'
    -- ), CONCAT(
    --     "A class of all (ordered) lists. The only property of ",
    --     "this class, other than the 'class' property itself, is an 'elements' ",
    --     "property that includes a list of all the elements. Note that lists ",
    --     "are written in property structs as e.g. '",
    --     '"elements":[[elem_1, elem_2, elem_3]]',
    --     "', whereas '[elem_1, elem_2, elem_3]' (with no nesting) is ",
    --     "interpreted as an unordered set of valid property values (used for ",
    --     "one-to-many properties)."
    -- ), NULL),
    -- (15, 3, 0, '', '', CONCAT(
    --     '{"format":{"elements":[["%s%t"]]}' -- "class":"@14"
    -- ), NULL),
    -- (16, 3, 0, '', '', CONCAT(
    --     -- "class":"@3"
    --     '{"format":{"class":"@2","title":"%s",',
    --     '"instance class":"%e1","description":"%t"}'
    -- ), NULL),
    -- (17, 8, 9, '8', 'relevant property', NULL, CONCAT(
    --     "A property relation where the objects are the property relations ",
    --     "that are relevant to the subject entity."
    -- ), NULL),
    -- (18, 8, 9, '8,1', 'relevant property of class instances', NULL, CONCAT(
    --     "A property relation where the objects are the property relations ",
    --     "that are relevant to all the instances of the subject class."
    -- ), NULL),
    -- (19, 10, 11, '12,18', '', NULL, NULL),
    -- (20, 10, 11, '2,18', '', NULL, NULL),
    -- (21, 1, 0, '', '', CONCAT(
    --     '{"title":"set"}'
    -- ), CONCAT(
    --     "A class of all sets (unordered lists). The only property of ",
    --     "this class, other than the 'class' property itself, is an 'elements' ",
    --     "property holding an array of all the elements of the set. ",
    --     "Note that sets are written in property structs as e.g. '",
    --     '"elements":[elem_1, elem_2, elem_3]',
    --     "', whereas '[[elem_1, elem_2, elem_3]]' (a nested array) is ",
    --     "interpreted as a (ordered) list instead. "
    --     "Whenever a set entity is the value of a property in a property ",
    --     "struct, the interpretation is that all the elements fits the given ",
    --     "property, not the set itself. To sey that a set entity itself is ",
    --     "the value of a property, simply wrap it in another set, either ",
    --     "using the '[]' syntax or by creating another set entity with the ",
    --     "given set as its only element."
    -- ), NULL),
    -- (22, 3, 0, '', '', CONCAT(
    --     '{"format":{"elements":["%s%t"]}' -- "class":"@21"
    -- ), NULL),
    -- 
    (NULL, 1, 6, '', 'exAmpLe of A noT very usefuL enTiTy', NULL, NULL, NULL);


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
