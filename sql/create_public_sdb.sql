USE mydatabase;

-- DROP TABLE Users;
-- DROP TABLE SemanticInputs;
-- DROP TABLE Statements;
-- DROP TABLE DescribedEntities;
-- DROP TABLE Predicates;
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



-- type code for User: 0.
CREATE TABLE Users (
    /* user ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    public_encryption_key BIGINT,

    /* database types (tables) of primary fields */
        /* public_encryption_key types */
        -- allowed public_encryption_key types: TBLOB (so no flag needed).
    /**/

    /* timestamp */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- type code for SemanticInput: 1.
CREATE TABLE SemanticInputs (
    /* semantic input ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    user BIGINT,
    statement BIGINT,
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


-- type code for Statement: 2.
CREATE TABLE Statements (
    /* statement ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    subject BIGINT,
    predicate BIGINT,

    /* database types (tables) of primary fields */
        /* subject types */
        -- allowed subject types: any (so no constraints).
        subject_type TINYINT

        /* predicate types */
        -- allowed predicate types: Predicate (so no flag needed).
    /**/
);



-- type code for DescribedEntity: 3.
CREATE TABLE DescribedEntities (
    /* described term ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    -- List of two lists: A (possibly empty) list of category predicates
    -- (cpreds), and a list of specification relations (srels), the latter of
    -- which, together with the srel_inputs (also a list), specifies the entity
    -- within the given category defined by the cpreds.
    cpreds_and_srels BIGINT,
    -- List of input to each specification relation (srel) in the second list
    -- within cpreds_and_srels. The order of the srel inputs is taken to match
    -- the order of the srels, and the lengths of these two lists should thus be
    -- the same.
    srel_inputs BIGINT,

    /* database types (tables) of primary fields */
        /* "category predicates and specification relations" types */
        -- allowed cpreds_and_srels types: L2List (so no flag needed).

        /* srel_inputs types */
        -- allowed srel_inputs types: any List types.
        srel_inputs TINYINT CHECK (
            srel_inputs >= 40 -- all List types
        )
    /**/
);



-- type code for Predicate: 4.
CREATE TABLE Predicates (
    /* predicate ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    -- "relation" can here be either an attribute name or verb (if the mydatabase
    -- type is a TVarChar) or a (described) relation if the database type is a
    -- DescribedEntity.
    relation BIGINT,
    -- Input in the relation, sentence object of the verb, or value of the
    -- attribute, depending on the database type of "relation."
    input BIGINT,

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
    /* length 2 list ID */
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

-- type code for L3List: 44.
CREATE TABLE L4Lists (
    /* length 2 list ID */
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

-- saving larger lists for later.
