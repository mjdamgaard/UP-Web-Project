USE mydatabase;

-- DROP TABLE Users;
-- DROP TABLE SemanticInputs;
-- DROP TABLE Statements;
DROP TABLE DescribedEntities;
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



/* Semantic inputs which the users (or bots) state. A fundamental feature of
 * this semantic system is that all such statements comes ...
 **/
CREATE TABLE SemanticInputs (
    /* primary fields */
    -- subject of predicate or relation
    subject BIGINT,
    -- user (or bot) who states the semantic input.
    user BIGINT,
    value BIGINT,

    /* database types (tables) of primary fields */
        /* user types */
        -- allowed user types: only User (so no flag needed).

        /* statement types */
        -- allowed statement types: only Statement (so no flag needed).

        /* value types */
        -- allowed value types: any (so no constraints).
        value_type TINYINT,
    /**/

    /* timestamp */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- type code for User: 0.
CREATE TABLE Users (
    /* user ID */
    id BIGINT AUTO_INCREMENT=0x0000000000000000,
    PRIMARY KEY(id),

    /* primary fields */
    -- TBD.

    /* timestamp */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


--
-- -- type code for Statement: 2.
-- CREATE TABLE Statements (
--     /* statement ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* primary fields */
--     subject BIGINT,
--     predicate BIGINT,
--
--     /* database types (tables) of primary fields */
--         /* subject types */
--         -- allowed subject types: any (so no constraints).
--         subject_type TINYINT
--
--         /* predicate types */
--         -- allowed predicate types: Predicate (so no flag needed).
--     /**/
-- );








/* Objects, Relations and Categories each fall into two subtypes: "Categorized"
 * and "Simple" ones. Both subtypes take two inputs each in all three cases,
 * which we will call descriptors (1 and 2).
 *
 * The "Simple" subtype takes as its first descriptor a string denoting af
 * lexical item (a semantically meaningful part of a sentence). Examples of lex-
 * ical items could be: "the number pi", "is subset of" (or "belongs to"), "has
 * related link:", and "is funny".
 * The second descriptor of the Simple subtype is an (optional) text descrip-
 * tion, which can be used to explain the lexical item more thoroughly, and to
 * clear up any potential ambiguities.
 *
 * The "Categorized" subtype, on the other hand, takes as its first descriptor
 * a list of two element which are themselves lists. The first of these two sub-
 * lists is a list of "categorizing predicates," which we will abbreviate as
 * 'cpreds,' and the second sublist is a list of "specification relations,"
 * which we will abbreviate as 'srels.'
 * The list of cpreds... Hm, jeg tænkte lige for lidt siden, om ikke man bare
 * skulle lave cpreds om til en liste af kategorier i stedet, men besluttede
 * nej. Nu er jeg så lige blevet i tvivl igen: Skal cpreds ikke bare ændres til
 * cats?.. (11:44)
 **/


-- type code for Objects: 3.
CREATE TABLE Objects (
    /* described term ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    -- /* primary fields */
    -- -- List of two lists: A (possibly empty) list of category predicates
    -- -- (cpreds), and a list of specification relations (srels), the latter of
    -- -- which, together with the srel_inputs (also a list), specifies the entity
    -- -- within the given category defined by the cpreds.
    -- cpreds_and_srels BIGINT,
    -- -- List of input to each specification relation (srel) in the second list
    -- -- within cpreds_and_srels. The order of the srel inputs is taken to match
    -- -- the order of the srels, and the lengths of these two lists should thus be
    -- -- the same.
    -- srel_inputs BIGINT,

    descriptor_1 BIGINT,
    descriptor_2 BIGINT,

    /* database types (tables) of primary fields */
        /* "category predicates and specification relations" types */
        -- allowed cpreds_and_srels types: L2List (so no flag needed).

        /* srel_inputs types */
        -- allowed srel_inputs types: any List types.
        srel_inputs_type TINYINT CHECK (
            srel_inputs_type >= 40 -- all List types
        )
    /**/
);



-- type code for Predicate: 4.
CREATE TABLE Predicates (
    /* predicate ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    -- /* primary fields */
    -- -- "relation" can here be either an attribute name or verb (if the mydatabase
    -- -- type is a TVarChar) or a (described) relation if the database type is a
    -- -- DescribedEntity.
    -- relation BIGINT,
    -- -- Input in the relation, sentence object of the verb, or value of the
    -- -- attribute, depending on the database type of "relation."
    -- input BIGINT,

    descriptor_1 BIGINT,
    descriptor_2 BIGINT,

    /* database types (tables) of primary fields */
        /* relation/verb/attribute types */
        -- allowed relation types: DescripedEntity (if rel.) or TVarChar (else).
        relation_type TINYINT CHECK (
            relation_type = 3 OR -- DescripedEntity
            relation_type = 21   -- TVarChar
        ),

        /* input types */
        -- allowed input types: any (so no constraints).
        input_type TINYINT
    /**/
);

-- type code for Relations: 5.
CREATE TABLE Relations (
    /* predicate ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),


    descriptor_1 BIGINT,
    descriptor_2 BIGINT,

    /* database types (tables) of primary fields */
        /* relation/verb/attribute types */
        -- allowed relation types: DescripedEntity (if rel.) or TVarChar (else).
        relation_type TINYINT CHECK (
            relation_type = 3 OR -- DescripedEntity
            relation_type = 21   -- TVarChar
        ),

        /* input types */
        -- allowed input types: any (so no constraints).
        input_type TINYINT
    /**/
);

-- type code for Categories: 6.
CREATE TABLE Categories (
    /* predicate ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),


    descriptor_1 BIGINT,
    descriptor_2 BIGINT,

    /* database types (tables) of primary fields */
        /* relation/verb/attribute types */
        -- allowed relation types: DescripedEntity (if rel.) or TVarChar (else).
        relation_type TINYINT CHECK (
            relation_type = 3 OR -- DescripedEntity
            relation_type = 21   -- TVarChar
        ),

        /* input types */
        -- allowed input types: any (so no constraints).
        input_type TINYINT
    /**/
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
