USE mydatabase;

-- DROP TABLE SemanticInputs;
DROP TABLE Users;
-- DROP TABLE Bots;
-- DROP TABLE SimpleTerms;

-- DROP TABLE StandardTerms;
-- DROP TABLE RelationalPredicates;

DROP TABLE Strings;
-- DROP TABLE Binaries;
-- DROP TABLE Lists;



/* Types */
-- SET @empty_t = -1;
-- SET @bot_t = 0;
-- SET @user_t = 1;
-- SET @simple_t = 2;
-- SET @standard_t = 3;
-- SET @relpred_t = 4;
-- SET @string_t = 5;
-- SET @binary_t = 6;
-- SET @list_t = 7;


-- Jeg tror måske jeg laver det om, så at vi bare forestiller os, at Termerne
-- holder de felter, jeg har beskrevet herunder, og så i stedet bare gør
-- udelukkende brug af en forfatter-siger-bot til at definere ikke-data-.. tja,
-- eller måske egentligt bare alle termerne... (10:13)



/* Statements which the users (or bots) give as input to the semantic network.
 * A central feature of this semantic system is that all such statements come
 * with a numerical value which represents the degree to which the user deems
 * that the statement is correct (like when answering a survey).
 **/
CREATE TABLE SemanticInputs (
    -- subject of predicate or relation.
    subj_t TINYINT,
    subj_id BIGINT UNSIGNED,

    -- user or bot who states the statement.
    user_t TINYINT,
    user_id BIGINT UNSIGNED,

    -- relation or predicate.
    rel_t TINYINT CHECK (
        rel_t = 2 OR rel_t = 4 -- SimpleTerm og StandardTerm.
    ),
    rel_id BIGINT UNSIGNED,

    -- relation object (second input, so to speak) if pred_or_rel is a relation.
    obj_t TINYINT,
    obj_id BIGINT UNSIGNED,
    -- FOREIGN KEY (pred_or_rel) REFERENCES Term(id),


    -- numerical value (signed) which defines the degree to which the users
    -- (or bot) deems the statement to be true/fitting. When dividing the int
    -- sitting at the first four bytes with
    -- 2^31, this value runs from -1 to (almost) 1. And then -1 is taken to mean
    -- "very far from true/fitting," 0 is taken to mean "not sure / not
    -- particularly fitting or unfitting," and 1 is taken to mean "very much
    -- true/fitting."
    rat_val INT,
    opt_data VARBINARY(255),
    -- (Could have size=255, but might as well restrict..) ..Then again, let me
    -- actually just implement that restriction at the control layer..

    -- In this version, a user or bot can only have one rating value per
    -- statement, which means that the combination of user and statement
    -- (subject, pred_or_rel and object) is unique for each row.
    PRIMARY KEY (
        subj_t, subj_id,
        user_t, user_id,
        rel_t, rel_id,
        obj_t, obj_id
    ),


    CHECK (
        user_t = 0 OR -- @bot_t
        user_t = 1    -- @user_t
    ),

    -- prevent that relation--object combinations are saved as predicates,
    -- and thus that relation--object predicates are always saved in their
    -- exploded version in the StatementInputs rows.
    CHECK (
        -- either pred_or_rel is NOT a relational predicate term...
        rel_t <> 4 -- @relpred_t
        -- ...or if it is, then it cannot be a predicate, and object thus has to
        -- not be an empty object.
        OR obj_t <> -1 -- @empty_t
        -- (Apparently you cannot write a @ right after the -- in a comment!x))
    ),

    CHECK (rat_val <> 0x80000000)
    -- This makes max and min values equal to 2^31 - 1 and -2^31 + 1, resp.
    -- Divide by 2^31 to get floating point number strictly between -1 and 1.



    /* timestamp */
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE Bots (
    -- bot ID.
    -- type TINYINT = 0,
    id BIGINT UNSIGNED AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    -- description_t is not needed; it is always String type.
    description_id BIGINT UNSIGNED
);


CREATE TABLE Users (
    -- user ID.
    -- type TINYINT = 1,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    /* primary fields */
    -- TBD.

    /* timestamp */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- SET @user_start = 0x0100000000000000;
-- ALTER TABLE Users AUTO_INCREMENT = @user_start; -- 0x0100000000000000;
INSERT INTO Users (id) VALUES (0x0100000000000000);


CREATE TABLE SimpleTerms (
    -- simple term ID.
    id BIGINT UNSIGNED AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* A SimpleTerm takes as its first descriptor a string denoting af
     * lexical item (a semantically meaningful part of a sentence). Examples of
     * lexical items could be: "the number pi", "is subset of",
     * "has related link:", "is funny", "is" and "funny".
     * The description is an (optional) text description, which can be used to
     * explain the lexical item more thoroughly, and to clear up any potential
     * ambiguities.
     **/

    -- defining lexical item.
    full_lexical_item TEXT,
    -- abbreviated lexical item (such as ".Lexical item=", ".is:" or ".is a:").
    abbr_lexical_item VARCHAR(255),
    -- description.
    description TEXT
);






-- TODO: Make changes and deletions below.

--
-- CREATE TABLE SimpleTerms (
--     -- simple term ID.
--     -- type TINYINT = 2,
--     id BIGINT UNSIGNED AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* The "Simple" subtype takes as its first descriptor a string denoting af
--      * lexical item (a semantically meaningful part of a sentence). Examples of
--      * lexical items could be: "the number pi", "is subset of" (or "belongs to"),
--      * "has related link:", and "is funny".
--      * The second descriptor of the Simple subtype is an (optional) text descrip-
--      * tion, which can be used to explain the lexical item more thoroughly, and to
--      * clear up any potential ambiguities.
--      **/
--
--     -- specifying lexical item.
--     -- spec_lexical_item_t is not needed; it is always String type.
--     spec_lexical_item_id BIGINT UNSIGNED,
--
--     -- description.
--     -- description_t is not needed; it is always String type.
--     description_id BIGINT UNSIGNED
-- );


CREATE TABLE StandardTerms (
    /* standard term ID */
    -- type TINYINT = 3,
    id BIGINT UNSIGNED AUTO_INCREMENT,
    PRIMARY KEY(id),


    -- specifying parent predicates.
    -- spec_parent_preds_t not needed; it is always List type.
    spec_parent_preds_id BIGINT UNSIGNED,

    -- specifying child predicates.
    -- spec_child_preds_t not needed; it is always List type.
    spec_child_preds_id BIGINT UNSIGNED
);


CREATE TABLE RelationalPredicates (
    /* relational predicate ID */
    -- type TINYINT = 4,
    id BIGINT UNSIGNED AUTO_INCREMENT,
    PRIMARY KEY(id),


    -- relation.
    relation_t TINYINT CHECK (
        relation_t = 2 OR relation_t = 4 -- SimpleTerm og StandardTerm.
    ),
    relation_id BIGINT UNSIGNED,

    -- realtion object (or perhaps function input).
    object_t TINYINT,
    object_id BIGINT UNSIGNED
);




CREATE TABLE Strings (
    /* variable character string ID */
    -- type TINYINT = 5,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    /* data */
    str VARCHAR(500) UNIQUE
    -- FULLTEXT idx (str)
);

CREATE TABLE Binaries (
    /* variable character string ID */
    -- type TINYINT = 6,
    id BIGINT UNSIGNED AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    bin BLOB
);

-- Remember that this table has to be compressed so that nulled elements (and
-- tail) require no extra storage.
CREATE TABLE Lists (
    /* variable character string ID */
    -- type TINYINT = 7,
    id BIGINT UNSIGNED AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    length SMALLINT UNSIGNED,

    elem1_t TINYINT,
    elem1_id BIGINT UNSIGNED,
    elem2_t TINYINT,
    elem2_id BIGINT UNSIGNED,
    elem3_t TINYINT,
    elem3_id BIGINT UNSIGNED,
    elem4_t TINYINT,
    elem4_id BIGINT UNSIGNED,
    elem5_t TINYINT,
    elem5_id BIGINT UNSIGNED,
    elem6_t TINYINT,
    elem6_id BIGINT UNSIGNED,
    elem7_t TINYINT,
    elem7_id BIGINT UNSIGNED,
    elem8_t TINYINT,
    elem8_id BIGINT UNSIGNED,
    elem9_t TINYINT,
    elem9_id BIGINT UNSIGNED,
    elem10_t TINYINT,
    elem10_id BIGINT UNSIGNED,

    -- tail_t not needed; it is always List type.
    tail_id BIGINT UNSIGNED
);


-- Hm, no I don't think I need this view after all.
-- CREATE VIEW Terms AS
-- SELECT (type, id, descriptor_1, descriptor_2) FROM
--     SELECT (
--         type, id,
--         spec_lexical_item AS descriptor_1,
--         description       AS descriptor_2
--     )
--     FROM SimpleTerms
--     UNION
--     SELECT (
--         type, id,
--         spec_parent_preds AS descriptor_1,
--         spec_child_preds  AS descriptor_2
--     )
--     FROM StandardTerms
--     UNION
--     SELECT (
--         type, id,
--         rel_or_fun AS descriptor_1,
--         input      AS descriptor_2
--     )
--     FROM RelationalPredicates;



-- TODO: change these type codes.
-- type code for DateTime: 6.
-- type code for Year: 7.
-- type code for Date: 8.
-- type code for Time: 9.

-- type code for Bool 10.
-- type code for TinyInt: 11.
-- type code for SmallInt: 12.
-- type code for MediumInt: 13.
-- type code for Int: 14.
-- type code for BigInt: 18.






-- -- type code for MBlob: 38.
-- CREATE TABLE MBlobs (
--     /* medium BLOB ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* data */
--     bin MEDIUMBLOB
-- );
--
-- -- saving LBlobs for later.
--
--
--
-- -- (List0 does not need its own table.)
-- -- type code for L0List: 40.
--
-- -- type code for L1List: 41.
-- CREATE TABLE L1Lists (
--     /* length 1 list ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* primary fields */
--     element_1 BIGINT,
--
--     /* database types (tables) of primary fields */
--         /* element types */
--         -- allowed element types: any (so no constraints).
--         element_1_type TINYINT
--     /**/
-- );
--
-- -- type code for L2List: 42.
-- CREATE TABLE L2Lists (
--     /* length 2 list ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* primary fields */
--     element_1 BIGINT,
--     element_2 BIGINT,
--
--     /* database types (tables) of primary fields */
--         /* element types */
--         -- allowed element types: any (so no constraints).
--         element_1_type TINYINT,
--         element_2_type TINYINT
--     /**/
-- );
--
-- -- type code for L3List: 43.
-- CREATE TABLE L3Lists (
--     /* length 3 list ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* primary fields */
--     element_1 BIGINT,
--     element_2 BIGINT,
--     element_3 BIGINT,
--
--     /* database types (tables) of primary fields */
--         /* element types */
--         -- allowed element types: any (so no constraints).
--         element_1_type TINYINT,
--         element_2_type TINYINT,
--         element_3_type TINYINT
--     /**/
-- );
--
-- -- type code for L4List: 44.
-- CREATE TABLE L4Lists (
--     /* length 4 list ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* primary fields */
--     element_1 BIGINT,
--     element_2 BIGINT,
--     element_3 BIGINT,
--     element_4 BIGINT,
--
--     /* database types (tables) of primary fields */
--         /* element types */
--         -- allowed element types: any (so no constraints).
--         element_1_type TINYINT,
--         element_2_type TINYINT,
--         element_3_type TINYINT,
--         element_4_type TINYINT
--     /**/
-- );
--
-- -- saving larger fixed-length lists for later.
--
--
-- -- type code for LongList: 51.
-- CREATE TABLE LongLists (
--     /* long (+10) length list ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* primary fields */
--     element_1 BIGINT,
--     element_2 BIGINT,
--     element_3 BIGINT,
--     element_4 BIGINT,
--     element_5 BIGINT,
--     element_6 BIGINT,
--     element_7 BIGINT,
--     element_8 BIGINT,
--     element_9 BIGINT,
--     element_10 BIGINT,
--     tail BIGINT,
--
--     /* database types (tables) of primary fields */
--         /* element types */
--         -- allowed element types: any (so no constraints).
--         element_1_type TINYINT,
--         element_2_type TINYINT,
--         element_3_type TINYINT,
--         element_4_type TINYINT,
--         element_5_type TINYINT,
--         element_6_type TINYINT,
--         element_7_type TINYINT,
--         element_8_type TINYINT,
--         element_9_type TINYINT,
--         element_10_type TINYINT,
--
--         /* tail types */
--         -- allowed tail types: any List types.
--         tail_type TINYINT CHECK (
--             tail_type >= 40 -- all List types
--         )
--     /**/
-- );
