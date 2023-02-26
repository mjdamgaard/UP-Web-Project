USE mydatabase;



DELETE FROM SemanticInputs;
DELETE FROM Bots;
DELETE FROM Users;

DELETE FROM NextIDPointers;

DELETE FROM Lists;
DELETE FROM Binaries;
DELETE FROM Blobs;
DELETE FROM Strings;
DELETE FROM Texts;


-- DROP TABLE SemanticInputs;
-- DROP TABLE Bots;
-- DROP TABLE Users;
--
-- DROP TABLE NextIDPointers;
-- DROP PROCEDURE  SelectNextRelPredID;
-- DROP PROCEDURE SelectNextTermID;
--
-- DROP TABLE Lists;
-- DROP TABLE Binaries;
-- DROP TABLE Blobs;
-- DROP TABLE Strings;
-- DROP TABLE Texts;






/* Types */
-- SET @start_dist = 0x1000000000000000;
--
-- SET @bot_start = 0x0000000000000000;
-- SET @user_start = 0x1000000000000000;


/* Statements which the users (or bots) give as input to the semantic network.
 * A central feature of this semantic system is that all such statements come
 * with a numerical value which represents the degree to which the user deems
 * that the statement is correct (like when answering a survey).
 **/
CREATE TABLE SemanticInputs (
    -- subject of predicate or relation.
    -- subj_t TINYINT,
    subj_id BIGINT UNSIGNED,

    -- user or bot who states the statement.
    -- user_t TINYINT,
    user_id BIGINT UNSIGNED,

    -- relation or predicate.
    -- rel_t TINYINT CHECK (
    --     rel_t = 2 OR rel_t = 4 -- SimpleTerm og StandardTerm.
    -- ),
    rel_id BIGINT UNSIGNED,

    -- relation object (second input, so to speak) if pred_or_rel is a relation.
    -- obj_t TINYINT,
    obj_id BIGINT UNSIGNED,
    -- FOREIGN KEY (pred_or_rel) REFERENCES Term(id),


    -- numerical value (signed) which defines the degree to which the users
    -- (or bot) deems the statement to be true/fitting.
    -- When dividing the TINYINT with 128,
    -- this value runs from -1 to (almost) 1. And then -1 is taken to mean
    -- "very far from true/fitting," 0 is taken to mean "not sure / not
    -- particularly fitting or unfitting," and 1 is taken to mean "very much
    -- true/fitting."
    rat_val TINYINT,
    opt_data VARBINARY(255),


    /* date */
    created_at DATE DEFAULT (CURRENT_DATE),


    PRIMARY KEY (
        subj_id,
        user_id,
        rel_id,
        obj_id,
        created_at
    ),


    CONSTRAINT CHK_user_id CHECK (
        user_id BETWEEN 0 AND 0x200000000000000 - 1
    ),

    -- relations cannot be users/bots, relational predicates (0x20) or any
    -- data terms (0x70 and up).
    CONSTRAINT CHK_rel_id CHECK (
        rel_id BETWEEN 0x300000000000000 AND 0x700000000000000 - 1
    )


    -- CONSTRAINT CHK_rat_val CHECK (rat_val <> 0x80000000) -- or 0x8000..
    -- -- This makes max and min values equal to 2^31 - 1 and -2^31 + 1, resp.
    -- -- Divide by 2^31 to get floating point number strictly between -1 and 1.



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
INSERT INTO Bots (id) VALUES (0x0000000000000000);


CREATE TABLE Users (
    -- user ID.
    -- type TINYINT = 1,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    num_inserts_today INT,

    /* timestamp */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO Users (id) VALUES (0x1000000000000000);



CREATE TABLE NextIDPointers (
    type_code TINYINT UNSIGNED PRIMARY KEY,
    next_id_pointer BIGINT UNSIGNED
);
INSERT INTO NextIDPointers (type_code, next_id_pointer)
VALUES
    (0x20, 0x2000000000000001),
    (0x30, 0x3000000000000001)
;


DELIMITER //
CREATE PROCEDURE SelectNextRelPredID ()
BEGIN
    SELECT next_id_pointer
    FROM NextRelPredIDs
    WHERE type_code = 0x20
    FOR UPDATE;

    UPDATE NextRelPredIDs
    SET next_id_pointer = next_id_pointer + 1
    WHERE type_code = 0x20;
END //
-- DELIMITER ;
-- DELIMITER //
CREATE PROCEDURE SelectNextTermID ()
BEGIN
    SELECT next_id_pointer
    FROM NextIDPointers
    WHERE type_code = 0x30
    FOR UPDATE;

    UPDATE NextIDPointers
    SET next_id_pointer = next_id_pointer + 1
    WHERE type_code = 0x30;
END //
DELIMITER ;

-- CREATE TABLE NextRelPredIDs (
--     next_id_pointer BIGINT UNSIGNED
-- );
-- INSERT INTO NextRelPredIDs (next_id_pointer) VALUES (0x2000000000000001);
--
-- CREATE TABLE NextTermIDs (
--     next_id_pointer BIGINT UNSIGNED
-- );
-- INSERT INTO NextTermIDs (next_id_pointer) VALUES (0x3000000000000001);







-- CREATE TABLE SimpleTerms (
--     -- simple term ID.
--     id BIGINT UNSIGNED AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--     /* A SimpleTerm takes as its first descriptor a string denoting af
--      * lexical item (a semantically meaningful part of a sentence). Examples of
--      * lexical items could be: "the number pi", "is subset of",
--      * "has related link:", "is funny", "is" and "funny".
--      * The description is an (optional) text description, which can be used to
--      * explain the lexical item more thoroughly, and to clear up any potential
--      * ambiguities.
--      **/
--
--     -- defining lexical item.
--     full_lexical_item TEXT,
--     -- abbreviated lexical item (such as ".Lexical item=", ".is:" or ".is a:").
--     abbr_lexical_item VARCHAR(255),
--     -- description.
--     description TEXT
-- );

-- CREATE TABLE StandardTerms (
--     /* standard term ID */
--     -- type TINYINT = 3,
--     id BIGINT UNSIGNED AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--
--     -- specifying parent predicates.
--     -- spec_parent_preds_t not needed; it is always List type.
--     spec_parent_preds_id BIGINT UNSIGNED,
--
--     -- specifying child predicates.
--     -- spec_child_preds_t not needed; it is always List type.
--     spec_child_preds_id BIGINT UNSIGNED
-- );
--
-- CREATE TABLE RelationalPredicates (
--     /* relational predicate ID */
--     -- type TINYINT = 4,
--     id BIGINT UNSIGNED AUTO_INCREMENT,
--     PRIMARY KEY(id),
--
--
--     -- relation.
--     relation_t TINYINT CHECK (
--         relation_t = 2 OR relation_t = 4 -- SimpleTerm og StandardTerm.
--     ),
--     relation_id BIGINT UNSIGNED,
--
--     -- realtion object (or perhaps function input).
--     object_t TINYINT,
--     object_id BIGINT UNSIGNED
-- );




CREATE TABLE Lists (
    /* list ID */
    id BIGINT UNSIGNED AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* creator */
    user_id BIGINT UNSIGNED,

    /* data */
    len SMALLINT UNSIGNED,

    elems VARBINARY(248),

    -- elem1_t TINYINT,
    -- elem1_id BIGINT UNSIGNED,
    -- elem2_t TINYINT,
    -- elem2_id BIGINT UNSIGNED,
    -- elem3_t TINYINT,
    -- elem3_id BIGINT UNSIGNED,
    -- elem4_t TINYINT,
    -- elem4_id BIGINT UNSIGNED,
    -- elem5_t TINYINT,
    -- elem5_id BIGINT UNSIGNED,
    -- elem6_t TINYINT,
    -- elem6_id BIGINT UNSIGNED,
    -- elem7_t TINYINT,
    -- elem7_id BIGINT UNSIGNED,
    -- elem8_t TINYINT,
    -- elem8_id BIGINT UNSIGNED,
    -- elem9_t TINYINT,
    -- elem9_id BIGINT UNSIGNED,
    -- elem10_t TINYINT,
    -- elem10_id BIGINT UNSIGNED,

    -- tail_t not needed; it is always List type.
    tail_id BIGINT UNSIGNED
);
INSERT INTO Lists (id) VALUES (0x7000000000000000);





CREATE TABLE Binaries (
    /* variable character string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    /* creator */
    user_id BIGINT UNSIGNED,

    /* data */
    str VARCHAR(500) UNIQUE
    -- FULLTEXT idx (str)
);
INSERT INTO Binaries (id) VALUES (0x8000000000000000);

CREATE TABLE Blobs (
    /* variable character string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT,
    PRIMARY KEY(id),

    /* creator */
    user_id BIGINT UNSIGNED,

    /* data */
    bin BLOB
);
INSERT INTO Blobs (id) VALUES (0x9000000000000000);






CREATE TABLE Strings (
    /* variable character string ID */
    -- type TINYINT = 5,
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    /* creator */
    user_id BIGINT UNSIGNED,

    /* data */
    str VARCHAR(255) UNIQUE,
    FULLTEXT idx (str)
);
INSERT INTO Strings (id) VALUES (0xA000000000000000);

CREATE TABLE Texts (
    /* variable character string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    /* creator */
    user_id BIGINT UNSIGNED,

    /* data */
    str TEXT
);
INSERT INTO Strings (id) VALUES (0xB000000000000000);








-- type code for DateTime: 6.
-- type code for Year: 7.
-- type code for Date: 8.
-- type code for Time: 9.

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
