USE mydatabase;

DROP TABLE Users;
DROP TABLE SemanticInputs;
DROP TABLE Statements;
DROP TABLE DescribedTerms;
DROP TABLE DescriptionSchemas;
-- DROP TABLE Strings;
DROP TABLE TTexts;
DROP TABLE STexts;
DROP TABLE MTexts;
-- DROP TABLE Binaries;
DROP TABLE TBlobs;
DROP TABLE SBlobs;
DROP TABLE MBlobs;
DROP TABLE L1Lists;
DROP TABLE L2Lists;
DROP TABLE L3Lists;
DROP TABLE L4Lists;



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
            -- (OBSOLETE: allowed value types: only BIGINT (so no flag needed).)
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



-- type code for DescribedEntities: 3.
CREATE TABLE DescribedEntity (
    /* described term ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    -- List of attributes (i.e. the attribute names), predicates, relations,
    -- categories, etc., which all defines the overall type and category of the
    -- entity.
    categorizing_list BIGINT,
    -- List of input specifically to each attribute and relation in the catego-
    -- rizing list (with all other elements of that list ignored) in the same
    -- order as how the attributes and relations appear in that list. 
    input_list BIGINT,

    /* database types (tables) of primary fields */
        /* categorizing_list types */
        -- allowed categorizing_list types: any List types.
        categorizing_list_type TINYINT CHECK (
            categorizing_list_type >= 40 -- all List types
        ),

        /* input_list types */
        -- allowed input_list types: any List types.
        input_list_type TINYINT CHECK (
            input_list_type >= 40 -- all List types
        )
    /**/
);


-- -- type code for DescriptionSchemas: 4.
-- CREATE TABLE DescriptionSchemas (
--     /* description schema ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* data (text defining the description schema) */
--     str TEXT
-- );


-- type code for Predicate: 4.
CREATE TABLE Predicates (
    /* predicate ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* primary fields */
    rel_or_att BIGINT, -- relation or attribute depending on the database type.
    inpput BIGINT, -- object of the realtion or value of the attribute.
    -- (these two fields combine into one "Description" of the Term in question)

    /* database types (tables) of primary fields */
        /* relation/attribute types */
        -- allowed rel_or_att types: DescripedEntity (if rel) or TText (if att).
        rel_or_att_type TINYINT CHECK (
            rel_or_att_type = 3 OR -- DescripedEntity
            rel_or_att_type = 21   -- TText
        ),

        /* inpput types */
        -- allowed inpput types: any (so no constraints).
        inpput_type TINYINT
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



-- -- type code for Strings: 20.
-- CREATE TABLE Strings (
--     /* string data entity ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* data */
--     str VARCHAR(16383)
-- );


-- type code for TText: 21.
CREATE TABLE TTexts (
    /* tiny text ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    str TINYTEXT
);

-- type code for SText: 22.
CREATE TABLE STexts (
    /* small text ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    str TEXT
);

-- type code for MText: 23.
CREATE TABLE MTexts (
    /* medium text ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    str MEDIUMTEXT
);


-- saving LTexts for later.
-- saving DeltaTexts and CompoundTexts for later.



-- -- type code for Binary: 30.
-- CREATE TABLE Binaries (
--     /* string data entity ID */
--     id BIGINT AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* data */
--     bin VARBINARY(65535)
-- );

-- type code for TBlob: 31.
CREATE TABLE TBlobs (
    /* tiny BLOB ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    bin TINYBLOB
);

-- type code for SBlob: 32.
CREATE TABLE SBlobs (
    /* small BLOB ID */
    id BIGINT AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* data */
    bin BLOB
);

-- type code for MBlob: 33.
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





-- insert some users
INSERT INTO Users (public_encryption_key) VALUES (NULL);
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();

-- --test timestamp
-- DO SLEEP(1);
-- UPDATE Users SET public_encryption_key = 0xAAAA WHERE id = 1;
