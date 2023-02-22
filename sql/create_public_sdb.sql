USE mydatabase;

-- DROP TABLE StatementInputs;
-- DROP TABLE Users;
-- DROP TABLE Bots;

-- DROP TABLE Terms;
-- DROP TABLE Predicates;
-- DROP TABLE Relations;
-- DROP TABLE Categories;
-- DROP TABLE TVarChars;
-- DROP TABLE TTexts;
-- DROP TABLE STexts;
-- DROP TABLE MTexts;
-- DROP TABLE TVarBinaries;
-- DROP TABLE TBlobs;
-- DROP TABLE SBlobs;
-- DROP TABLE MBlobs;
-- DROP TABLE L1Lists;
-- DROP TABLE L2Lists;
-- DROP TABLE L3Lists;
-- DROP TABLE L4Lists;
-- DROP TABLE LongLists;



/* Statements which the users (or bots) give as input to the semantic network.
 * A central feature of this semantic system is that all such statements come
 * with a numerical value which represents the degree to which the user deems
 * that the statement is correct (like when answering a survey).
 **/
CREATE TABLE StatementInputs (
    -- subject of predicate or relation.
    subject BIGINT UNSIGNED,
    -- FOREIGN KEY (subject) REFERENCES Term(id),

    -- user or bot who states the statement.
    user BIGINT UNSIGNED,
    -- FOREIGN KEY (user) REFERENCES Users(id),

    -- predicate or relation.
    pred_or_rel BIGINT UNSIGNED,
    -- FOREIGN KEY (pred_or_rel) REFERENCES Term(id),

    -- relation object (second input, so to speak) if pred_or_rel is a relation.
    object BIGINT UNSIGNED,
    -- FOREIGN KEY (pred_or_rel) REFERENCES Term(id),


    -- numerical value (signed) which defines the degree to which the users
    -- (or bot) deems the statement to be true/fitting. When dividing with
    -- 2^63, this value runs from -1 to (almost) 1. And then -1 is taken to mean
    -- "very far from true/fitting," 0 is taken to mean "not sure / not
    -- particularly fitting or unfitting," and 1 is taken to mean "very much
    -- true/fitting."
    rating_value BIGINT UNSIGNED,

    -- In this version, a user or bot can only have one rating value per
    -- statement, which means that the combination of user and statement
    -- (subject, pred_or_rel and object) is unique for each row.
    PRIMARY KEY(subject, user, pred_or_rel, object),
    -- Additionally, I intend to create a clustered index on
    -- (subject, user, pred_or_rel) (in that order). (Part of the reason why
    -- is that I intend to implement all aggregates, such as average, via bots,
    -- which are also implemented as "Users.")


    -- preventing that relation--object combinations are saved as predicates,
    -- and thus that relation--object predicates are always saved in their
    -- exploded version in the StatementInputs rows.
    CHECK (
        -- either pred_or_rel is NOT a compound term...
        (pred_or_rel NOT BETWEEN 0x0300000000000000 AND 0x0400000000000000 - 1)
        -- ...or if it is, then it cannot be a predicate, and object thus has to
        -- not be null.
        OR object != NULL
    )



    /* timestamp */
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE Users (
    -- user ID.
    id BIGINT UNSIGNED CHECK (
        -- type code for User: 0x01.
        id >= 0x0100000000000000 AND
        id <  0x0200000000000000
        -- (This is in case Users are included as Terms in a future version.)
    ),
    PRIMARY KEY(id),

    /* primary fields */
    -- TBD.

    /* timestamp */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Bots (
    /* bot ID */
    id BIGINT UNSIGNED CHECK (
        -- type code for Bot: 0x00.
        id BETWEEN 0x0000000000000000 AND 0x0100000000000000 - 1
        -- (This is in case Bots are included as Terms in a future version.)
    ),
    PRIMARY KEY(id),

    /* primary fields */
    description Text
);




-- * and "Simple" ones. Both subtypes take two inputs each in all three cases,
-- * which we will call descriptors (1 and 2).
-- *
-- * The "Simple" subtype takes as its first descriptor a string denoting af
-- * lexical item (a semantically meaningful part of a sentence). Examples of lex-
-- * ical items could be: "the number pi", "is subset of" (or "belongs to"), "has
-- * related link:", and "is funny".
-- * The second descriptor of the Simple subtype is an (optional) text descrip-
-- * tion, which can be used to explain the lexical item more thoroughly, and to
-- * clear up any potential ambiguities.
-- *
-- * The "Categorized" subtype, on the other hand, takes as its first descriptor
-- * a list of two element which are themselves lists. The first of these two sub-
-- * lists is a list of "categorizing predicates," which we will abbreviate as
-- * 'cpreds,' and the second sublist is a list of "specification relations,"
-- * which we will abbreviate as 'srels.'
-- * The list of cpreds... Hm, jeg tænkte lige for lidt siden, om ikke man bare
-- * skulle lave cpreds om til en liste af kategorier i stedet, men besluttede
-- * nej. Nu er jeg så lige blevet i tvivl igen: Skal cpreds ikke bare ændres til
-- * cats?.. (11:44)


/* Terms each fall into three subtypes: Simple, Standard, and Compound Terms.
 *
 * The "Simple" subtype takes as its first descriptor a string denoting af
 * lexical item (a semantically meaningful part of a sentence). Examples of
 * lexical items could be: "the number pi", "is subset of" (or "belongs to"),
 * "has related link:", and "is funny".
 * The second descriptor of the Simple subtype is an (optional) text descrip-
 * tion, which can be used to explain the lexical item more thoroughly, and to
 * clear up any potential ambiguities.
 **/


CREATE TABLE SimpleTerms (
    -- simple term ID.
    id BIGINT UNSIGNED CHECK (
        -- type code for SimpleTerm: 0x02.
        id >= 0x0200000000000000 AND
        id <  0x0300000000000000
    ),
    PRIMARY KEY(id),

    /* The "Simple" subtype takes as its first descriptor a string denoting af
     * lexical item (a semantically meaningful part of a sentence). Examples of
     * lexical items could be: "the number pi", "is subset of" (or "belongs to"),
     * "has related link:", and "is funny".
     * The second descriptor of the Simple subtype is an (optional) text descrip-
     * tion, which can be used to explain the lexical item more thoroughly, and to
     * clear up any potential ambiguities.
     **/

    -- specifying lexical item.
    spec_lexical_item BIGINT,

    -- specifying description.
    spec_description BIGINT
);


CREATE TABLE StandardTerms (
    /* standard term ID */
    id BIGINT UNSIGNED CHECK (
        -- type code for StandardTerm: 0x03.
        id >= 0x0300000000000000 AND
        id <  0x0400000000000000
    ),
    PRIMARY KEY(id),


    -- specifying parent predicates.
    spec_parent_preds BIGINT,

    -- specifying child predicates.
    spec_child_preds BIGINT
);



CREATE TABLE CompoundTerms (
    /* compound term ID */
    id BIGINT UNSIGNED CHECK (
        -- type code for CompoundTerm: 0x04.
        id >= 0x0400000000000000 AND
        id <  0x0500000000000000
    ),
    PRIMARY KEY(id),


    -- relation (or perhaps function).
    rel_or_fun BIGINT,

    -- realtion object (or perhaps function input).
    input BIGINT
);


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



-- type code for TVarChar: 21.
CREATE TABLE TVarChars (
    /* variable character string ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    str VARCHAR(255)
);

-- saving SVarChars for later.


-- type code for TText: 26.
CREATE TABLE TTexts (
    /* tiny text ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    str TINYTEXT
);

-- type code for SText: 27.
CREATE TABLE STexts (
    /* small text ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    str TEXT
);

-- type code for MText: 28.
CREATE TABLE MTexts (
    /* medium text ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    str MEDIUMTEXT
);

-- saving LTexts for later.

-- saving DeltaTexts and CompoundTexts for later.



-- type code for TVarBinary: 31.
CREATE TABLE TVarBinaries (
    /* string data entity ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    bin VARBINARY(255)
);

-- saving SVarBinaries for later.


-- type code for TBlob: 36.
CREATE TABLE TBlobs (
    /* tiny BLOB ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    bin TINYBLOB
);

-- type code for SBlob: 37.
CREATE TABLE SBlobs (
    /* small BLOB ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    bin BLOB
);

-- type code for MBlob: 38.
CREATE TABLE MBlobs (
    /* medium BLOB ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    bin MEDIUMBLOB
);

-- saving LBlobs for later.



-- (List0 does not need its own table.)
-- type code for L0List: 40.

-- type code for L1List: 41.
CREATE TABLE L1Lists (
    /* length 1 list ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    element_1 BIGINT,

    /* database types (tables) of primary fields */
        /* element types */
        -- allowed element types: any (so no constraints).
        element_1_type TINYINT
    /**/
);

-- type code for L2List: 42.
CREATE TABLE L2Lists (
    /* length 2 list ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    element_1 BIGINT,
    element_2 BIGINT,

    /* database types (tables) of primary fields */
        /* element types */
        -- allowed element types: any (so no constraints).
        element_1_type TINYINT,
        element_2_type TINYINT
    /**/
);

-- type code for L3List: 43.
CREATE TABLE L3Lists (
    /* length 3 list ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    element_1 BIGINT,
    element_2 BIGINT,
    element_3 BIGINT,

    /* database types (tables) of primary fields */
        /* element types */
        -- allowed element types: any (so no constraints).
        element_1_type TINYINT,
        element_2_type TINYINT,
        element_3_type TINYINT
    /**/
);

-- type code for L4List: 44.
CREATE TABLE L4Lists (
    /* length 4 list ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    element_1 BIGINT,
    element_2 BIGINT,
    element_3 BIGINT,
    element_4 BIGINT,

    /* database types (tables) of primary fields */
        /* element types */
        -- allowed element types: any (so no constraints).
        element_1_type TINYINT,
        element_2_type TINYINT,
        element_3_type TINYINT,
        element_4_type TINYINT
    /**/
);

-- saving larger fixed-length lists for later.


-- type code for LongList: 51.
CREATE TABLE LongLists (
    /* long (+10) length list ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    element_1 BIGINT,
    element_2 BIGINT,
    element_3 BIGINT,
    element_4 BIGINT,
    element_5 BIGINT,
    element_6 BIGINT,
    element_7 BIGINT,
    element_8 BIGINT,
    element_9 BIGINT,
    element_10 BIGINT,
    tail BIGINT,

    /* database types (tables) of primary fields */
        /* element types */
        -- allowed element types: any (so no constraints).
        element_1_type TINYINT,
        element_2_type TINYINT,
        element_3_type TINYINT,
        element_4_type TINYINT,
        element_5_type TINYINT,
        element_6_type TINYINT,
        element_7_type TINYINT,
        element_8_type TINYINT,
        element_9_type TINYINT,
        element_10_type TINYINT,

        /* tail types */
        -- allowed tail types: any List types.
        tail_type TINYINT CHECK (
            tail_type >= 40 -- all List types
        )
    /**/
);
