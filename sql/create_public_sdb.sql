-- USE mydatabase;



DELETE FROM Sets;
DELETE FROM SemanticInputs;

DELETE FROM UserGroups;
DELETE FROM Users;

DELETE FROM Categories;
DELETE FROM StandardTerms;
DELETE FROM Relations;
DELETE FROM KeywordStrings;

-- DELETE FROM SavedSets;

DELETE FROM Creators;

DELETE FROM Texts;
DELETE FROM Lists;
DELETE FROM Binaries;


-- DROP TABLE Sets;
-- DROP TABLE SemanticInputs;
--
-- DROP TABLE UserGroups;
-- DROP TABLE Users;
--
-- DROP TABLE Categories;
-- DROP TABLE StandardTerms;
-- DROP TABLE Relations;
-- DROP TABLE KeywordStrings;
--
-- DROP TABLE SavedSets;
--
-- DROP TABLE Creators;
--
-- DROP TABLE Texts;
-- DROP TABLE Lists;
-- DROP TABLE Binaries;






/* Types */
-- SET @start_dist = 0x1000000000000000;
--
-- SET @bot_start = 0x0000000000000000;
-- SET @user_start = 0x1000000000000000;



-- (07.03.23, 12:31) Okay, jeg tror faktisk, at jeg bare vil implementere
-- det på en ikke-effektiv måde, som til gengæld er mere overskulig, fra
-- starten her, nemlig ved at jeg simpelthen indfører user_t, subj_t og obj_t,
-- som jeg havde det engang, og hvor jeg endda simpelthen siger fuck it og
-- lader disse typer være CHAR(3)'s! (hvilket de nemlig bliver i det indledende
-- query-format).


CREATE TABLE Sets (
    -- user or user group who states the statement.
    user_t CHAR(3),
    user_id BIGINT UNSIGNED,

    -- subject of relation.
    subj_t CHAR(3),
    subj_id BIGINT UNSIGNED,

    -- relation.
    rel_id BIGINT UNSIGNED,

    PRIMARY KEY (
        user_t,
        user_id,
        subj_t,
        subj_id,
        rel_id
    ),

    set_id BIGINT UNSIGNED NOT NULL UNIQUE
    -- Sets are not Terms, so IDs take any value.

    -- CONSTRAINT CHK_Sets_user CHECK (
    --     user_id BETWEEN 0 AND 0x2000000000000000 - 1
    -- ),

    -- relations cannot be users/bots or any data terms (0x70 and up). They
    -- can only be "semantic terms" in other words.
    -- CONSTRAINT CHK_Sets_rel_is_semantic CHECK (
    --     rel_id BETWEEN 0x2000000000000000 AND 0x7000000000000000 - 1
    -- )


);



-- (12:56, 07.03.23) Jeg tror faktisk, at jeg vil sige, at både Users og
-- UserGroups bare holder en VARBINARY i stedet for rat_val og anden data,
-- og så sørger jeg bare for at denne "rat_data" bliver en del af nøglen.
-- Serveren skal så bare give al rat_data med i applikationen, så det går
-- ligesom udover brugerne selv, hvis de vælger at uploade mere data end
-- nødvendigt, både den ene vej fordi de så forbruger mere af deres
-- månedntlige upload-data-kvote, som jeg nemlig lidt forestiller mig, at
-- de skal have, men også den anden vej fordi det så tager længere tid at
-- downloade denne data --- og det forbruger mere af download-kvoten, som
-- jeg altså også forestiller mig, skal være.
-- Nå ja, og det fine er jo så, at VARBINARY vist ligesom VARCHAR ordnes
-- alfanummerisk, hvilket vil sige, at brugere og brugergrupper sådan set
-- bare skal sørger for, at den første byte, eller de første par bytes,
-- bliver betydende for, hvor højt objektet er placeret i mængden (når denne
-- enten ordnes efter ascending eller descending order). (13:04)
-- ..(13:12) Ah, og så kan vi forresten også samle SemanticUserInputs og
-- SemanticUserGroupInputs igen til bare SemanticInputs..
-- (14:50) Hm, jeg tror nu, at jeg alligevel vil kalde det 'rat_val' i stedet
-- for rat_data, og så bliver det bare underforstået, at val også kan
-- indeholde data på de mindre betydende bytes.


/* Statements which the users (or bots) give as input to the semantic network.
 * A central feature of this semantic system is that all such statements come
 * with a numerical value which represents the degree to which the user deems
 * that the statement is correct (like when answering a survey).
 **/
CREATE TABLE SemanticInputs (
    /* Set */
    -- set id.
    set_id BIGINT UNSIGNED,
    -- (while identifying a set uniquely, set_id is not part of the key for
    -- the Sets table and should therefore not be searched for.)

    /* Member */
    -- The members of sets include a rating value and a Term.

    -- -- rat_val is a numerical rating value (signed) which defines the
    -- -- degree to which the user/user group of the set deems the statement
    -- -- to be true/fitting.
    -- -- When dividing rat_val with 128, this value runs from -1 to (almost) 1.
    -- -- And then -1 is taken to mean "very far from true/fitting," 0 is taken
    -- -- to mean "not sure" / "not particularly fitting or unfitting," and 1 is
    -- -- taken to mean "very much true/fitting."
    -- -- inv_rat_val is the multiplicational inverse of rat_val, meaning that
    -- -- it is rat_val with its sign flipped.
    -- inv_rat_val TINYINT,
    rat_val VARBINARY(255) NOT NULL,

    -- object of the relation defining the set (i.e. the primary part of the
    -- member of which the rating is about).
    obj_t CHAR(3),
    obj_id BIGINT UNSIGNED,

    -- PRIMARY KEY (
    --     set_id, -- suggested abbr.: sid
    --     rat_val,  -- suggested abbr.: rval
    --     rat_w, -- suggested abbr.: rw
    --     obj_id -- suggested abbr.: oid
    -- ),

    PRIMARY KEY (
        set_id,
        -- inv_rat_val,
        rat_val,
        obj_t,
        obj_id
    )

    -- -- w_exp is a nummerical value which gives the weight of the rating
    -- -- when plugged into the equation w = 2^(w_exp / 32).
    -- -- inv_w_exp is the multiplicational inverse of w_exp, meaning that
    -- -- w = 2^(- inv_w_exp / 32).
    -- inv_w_exp_t32 TINYINT UNSIGNED NOT NULL


    -- CONSTRAINT CHK_rat_val_not_min CHECK (rat_val <> 0x80)
    -- -- This makes max and min values equal to 127 and -127, respectively.
    -- -- Divide by 127 to get floating point number strictly between -1 and 1.
    -- Maybe rat_val = 0x80 can be used as a report for removal flag..

);

INSERT INTO SemanticInputs (
    set_id,
    rat_val,
    obj_t,
    obj_id
)
VALUES (
    1,
    2,
    "cat",
    4
);





-- CREATE TABLE SemanticUserGroupInputs (
--     /* Set */
--     -- set id.
--     set_id BIGINT UNSIGNED,
--     -- (while identifying a set uniquely, set_id is not part of the key for
--     -- the Sets table and should therefore not be searched for.)
--
--     /* Member */
--     -- The members of sets include a rating value and a Term.
--
--     -- -- rat_val is a numerical rating value (signed) which defines the
--     -- -- degree to which the user/user group of the set deems the statement
--     -- -- to be true/fitting.
--     -- -- When dividing rat_val with 128, this value runs from -1 to (almost) 1.
--     -- -- And then -1 is taken to mean "very far from true/fitting," 0 is taken
--     -- -- to mean "not sure" / "not particularly fitting or unfitting," and 1 is
--     -- -- taken to mean "very much true/fitting."
--     -- -- inv_rat_val is the multiplicational inverse of rat_val, meaning that
--     -- -- it is rat_val with its sign flipped.
--     -- inv_rat_val TINYINT,
--     rat_data VARBINARY(255) NOT NULL,
--
--     -- -- wc_exp_t4 is a nummerical value which gives a weighted user count
--     -- -- of how many users in the user group have given their voice to the
--     -- -- rating. If the user group has equal weights for all its members, the
--     -- -- weigthed count would be the actual count of users.
--     -- -- When plugged into the equation,
--     -- -- wc_lb = floor(2^(wc_exp_t4 / 4)),
--     -- -- one gets a lower bound, wc_lb, on the weighted count. In other words,
--     -- -- if wc is the actual weighted count, then
--     -- -- floor(2^(wc_exp_t4 / 4)) <= wc <= floor(2^((wc_exp_t4 + 1) / 4)).
--     -- -- inv_wc_exp_t4 is then given by inv_wc_exp_t4 = 254 - wc_exp_t4.
--     -- -- This means that when inv_wc_exp_t4 runs from 0 to 255, then wc_exp_t4
--     -- -- runs from 254 to -1.
--     -- inv_wc_exp_t4 TINYINT UNSIGNED,
--
--     -- object of the relation defining the set (i.e. the primary part of the
--     -- member of which the rating is about).
--     obj_t CHAR(3),
--     obj_id BIGINT UNSIGNED,
--
--
--     PRIMARY KEY (
--         set_id,
--         inv_rat_val,
--         inv_wc_exp_t4,
--         obj_t,
--         obj_id
--     )
--
--     -- CONSTRAINT CHK_rat_val_not_min CHECK (rat_val <> 0x80)
--     -- -- This makes max and min values equal to 127 and -127, respectively.
--     -- -- Divide by 127 to get floating point number strictly between -1 and 1.
--     -- Maybe rat_val = 0x80 can be used as a report for removal flag..
--
-- );

-- INSERT INTO SemanticUserGroupInputs (
--     set_id,
--     inv_rat_val,
--     inv_wc_exp_t4,
--     obj_id
-- )
-- VALUES (
--     1,
--     2,
--     3,
--     4
-- );




-- CREATE VIEW SemanticInputs AS
-- SELECT
--     set_id,
--     - inv_rat_val AS rat_val,
--     - inv_w_exp_t32 AS w_exp_t32,
--     NULL AS wc_exp_t4,
--     obj_t,
--     obj_id
-- FROM SemanticUserInputs
-- UNION
-- SELECT
--     set_id,
--     - inv_rat_val AS rat_val,
--     NULL AS w_exp_t32,
--     254 - inv_wc_exp_t4 AS wc_exp_t4,
--     obj_t,
--     obj_id
-- FROM SemanticUserGroupInputs;





-- CREATE TABLE SemanticInputs (
--     -- subject of relation or predicate.
--     subj_id BIGINT UNSIGNED,
--
--     -- user, native bot or user group who states the statement.
--     user_id BIGINT UNSIGNED,
--
--     -- relation or predicate id.
--     rel_id BIGINT UNSIGNED,
--
--     -- relation object (second input, so to speak) if rel is a relation.
--     -- if rel is a predicate, then obj_id has to be 0.
--     obj_id BIGINT UNSIGNED,
--     -- FOREIGN KEY (pred_or_rel) REFERENCES Term(id),
--
--
--     -- date.
--     created_at DATE DEFAULT (CURRENT_DATE),
--
--     -- numerical value (signed) which defines the degree to which the users
--     -- (or bot) deems the statement to be true/fitting.
--     -- When dividing the TINYINT with 128,
--     -- this value runs from -1 to (almost) 1. And then -1 is taken to mean
--     -- "very far from true/fitting," 0 is taken to mean "not sure / not
--     -- particularly fitting or unfitting," and 1 is taken to mean "very much
--     -- true/fitting."
--     rat_val TINYINT,
--     opt_data VARBINARY(255),
--
--
--
--
--     PRIMARY KEY (
--         subj_id,
--         user_id,
--         rel_id,
--         obj_id,
--         created_at
--     ),
--
--
--     CONSTRAINT CHK_SemanticInputs_user_id CHECK (
--         user_id BETWEEN 0 AND 0x2000000000000000 - 1
--     ),
--
--     -- relations cannot be users/bots or any data terms (0x70 and up). They
--     -- can only be "semantic terms" in other words.
--     CONSTRAINT CHK_SemanticInputs_rel_is_semantic CHECK (
--         rel_id BETWEEN 0x2000000000000000 AND 0x7000000000000000 - 1
--     ),
--
--     -- if rel is a derived (i.e. functional) term, then it cannot be a
--     -- predicate, meaning that obj_id cannot be 0.
--     CONSTRAINT CHK_SemanticInputs_obj_not_zero_if_rel_is_derived CHECK (
--         NOT (rel_id BETWEEN 0x2000000000000000 AND 0x3000000000000000 - 1)
--         OR NOT (obj_id = 0)
--     )
--
--
--     -- CONSTRAINT CHK_rat_val_not_min CHECK (rat_val <> 0x80)
--     -- -- This makes max and min values equal to 127 and -127, respectively.
--     -- -- Divide by 127 to get floating point number strictly between -1 and 1.
--
--
--
-- );



-- CREATE TABLE NativeBots (
--     -- bot ID.
--     id BIGINT UNSIGNED PRIMARY KEY,
--     -- type code = 0x00, -- (but all types start from 0x..00000000000001)
--
--     /* primary fields */
--     -- description_t is not needed; it is always String type.
--     description_id BIGINT UNSIGNED
-- );
-- -- INSERT INTO NativeBots (id) VALUES (0x0000000000000000);


CREATE TABLE UserGroups (
    -- user group ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "ugr".

    -- id of the creating user group (or user or bot).
    creator_id BIGINT UNSIGNED,

    -- This is not the date at which the user group was created as a term.
    -- Rather, it is the date at which the weights within the creating user
    -- group are measured (if creator is not a single user or bot). Thus, if
    -- the creating user group is dynamic and its weights thus changes after
    -- this "effective creation date," these changes will then not affect this
    -- user group.
    effective_creation_date DATE,
    -- If effective_creation_date is a date in the future, or if it is NULL,
    -- it might mean (if this functionality is implemented) that the creating
    -- group is also allowed change in time. But this functionality will
    -- probably not be useful enough compared to the cost to be implemented,
    -- however. (But I just wanted to note the possibility, should we realize
    -- that it will be useful at some point.)

    -- date after which, if it is not NULL, all ratings are frozen and no new
    -- ratings are recorded for the user group. The end date can start out as
    -- NULL and then be set to a value at a later date, if the group decides
    -- to stop being active. It might also happen that the server decides to
    -- discontinue a group due to cost of maintaining, in which case an end
    -- date will also be set.
    end_date DATE,

    -- Flag (interpreted as a BOOL) that tells if the user group is dynamic,
    -- meaning that the creating user group (which will probably either be a
    -- "constant" user group, or will be effectively constant due to the
    -- effective_creation_date) is allowed to continously change the weights
    -- of this user group. A "constant" user group (with is_dynamic = FALSE),
    -- on the other hand, has constant weights which are set at the "effective
    -- creation date" and not changed after that.
    is_dynamic TINYINT -- BOOL,

    -- -- Flag (interpreted as a BOOL) telling is the user group is live, meaning
    -- -- that the servers will make sure to continously update its semantic
    -- -- inputs (which generally always include a weighted average of the
    -- -- ratings from the user group).
    -- -- If the flag is 0, then the user group is live. If it is not 0, the user
    -- -- group is either in the proces of being created (i.e. before the
    -- -- "effective creation date" has been set), or it has been discontinued
    -- -- by the servers. The value of the flag might signal the reason.
    -- is_inactive TINYINT -- BOOL
);
-- -- ALTER TABLE UserGroups AUTO_INCREMENT = CONV(0x0000000000000001, 16, 10);
-- -- 0x0000000000000001 = 1.
-- ALTER TABLE UserGroups AUTO_INCREMENT = 1;


CREATE TABLE Users (
    -- user ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "usr".

    -- num_inserts_today INT,

    pub_encr_key VARBINARY(10000),

    /* timestamp */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- -- ALTER TABLE Users AUTO_INCREMENT = CONV(0x1000000000000001, 16, 10);
-- -- -- 0x1000000000000001 = 1152921504606846977.
-- -- A..TABLE UserGroups AUTO_INCREMENT = 1152921504606846977;
-- ALTER TABLE Users AUTO_INCREMENT = 1000000000000000001;









CREATE TABLE Categories (
    -- category ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "cat".

    -- title of the category, preferably a plural noun describing/referencing
    -- the elements in the category.
    title VARCHAR(255) NOT NULL,
    FULLTEXT idx (title),

    -- -- possible empty list of BIGINTs pointing to super categories.
    -- super_cats VARBINARY(248)
    -- -- this is useful when the title is best understood in the context of
    -- -- one or more super categories.

    -- id of a defining super category.
    super_cat BIGINT UNSIGNED NOT NULL,
    -- This is useful when the title is best understood in the context of
    -- a super category.
    -- Note that 0x2000000000000001 is category of all Terms.

    -- -- description.
    -- descr TEXT

    UNIQUE INDEX (title, super_cat)

    -- CONSTRAINT CHK_Categories_super_cat CHECK (
    --     super_cat BETWEEN 0x2000000000000000 AND 0x3000000000000000 - 1
    -- )
);
-- ALTER TABLE Categories AUTO_INCREMENT = 2000000000000000001;

CREATE TABLE StandardTerms (
    -- term ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "std".

    -- title of the term.
    title VARCHAR(255) NOT NULL,
    FULLTEXT idx (title),

    -- id of a defining category.
    cat BIGINT UNSIGNED NOT NULL,
    -- Note that 0x2000000000000001 is category of all Terms.

    UNIQUE INDEX (title, cat)

    -- CONSTRAINT CHK_Terms_super_cat CHECK (
    --     super_cat BETWEEN 0x2000000000000000 AND 0x3000000000000000 - 1
    -- )
);
-- ALTER TABLE StandardTerms AUTO_INCREMENT = 2000000000000000001;



CREATE TABLE Relations (
    -- relation ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "rel".

    -- noun describing the object in terms of what the object is to the
    -- subject of the relation.
    -- TODO: mention forward and backwards syntax for parsing this noun from
    -- the realtion expressed as a verb.
    obj_noun VARCHAR(255) NOT NULL,
    FULLTEXT idx (obj_noun),

    obj_cat BIGINT UNSIGNED NOT NULL,

    subj_cat BIGINT UNSIGNED NOT NULL,

    -- flag representing if relation expects only one object (in general) per
    -- subject.
    is_one_to_one TINYINT NOT NULL,

    -- -- description.
    -- descr TEXT

    UNIQUE INDEX (obj_noun, obj_cat, subj_cat, is_one_to_one)

    -- CONSTRAINT CHK_Relations_subj_cat CHECK (
    --     subj_cat BETWEEN 0x2000000000000000 AND 0x3000000000000000 - 1
    -- ),

    -- CONSTRAINT CHK_Relations_obj_cat CHECK (
    --     obj_cat BETWEEN 0x2000000000000000 AND 0x3000000000000000 - 1
    -- )
);
-- ALTER TABLE Relations AUTO_INCREMENT = 3000000000000000001;


CREATE TABLE KeywordStrings (
    /* keyword string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "kws".

    -- keyword string.
    str VARCHAR(255) NOT NULL UNIQUE,
    FULLTEXT idx (str)
);
-- ALTER TABLE KeywordStrings AUTO_INCREMENT = 4000000000000000001;


-- CREATE TABLE FundamentalTerms (
--     -- simple term ID.
--     id BIGINT UNSIGNED PRIMARY KEY,
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
--     lex_item BIGINT UNSIGNED,
--
--     -- description.
--     descr BIGINT UNSIGNED,
--
--     -- CONSTRAINT CHK_FundamentalTerms_lex_item CHECK (
--     --     lex_item BETWEEN 0xA000000000000000 AND 0xB000000000000000 - 1
--     -- ),
--     --
--     -- CONSTRAINT CHK_FundamentalTerms_descr CHECK (
--     --     descr BETWEEN 0xB000000000000000 AND 0xC000000000000000 - 1
--     -- )
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


-- -- Predicate terms, each formed from an existing relation and a relational
-- -- object.
-- CREATE TABLE RelationalPredicates (
--     /* relational predicate ID */
--     id BIGINT UNSIGNED PRIMARY KEY,
--
--     -- relation.
--     rel_id BIGINT UNSIGNED NOT NULL,
--     -- relational object.
--     obj_id BIGINT UNSIGNED NOT NULL,
--
--     CONSTRAINT CHK_RelationalPredicates_rel_id CHECK (
--         rel_id BETWEEN 0x3000000000000000 AND 0x7000000000000000 - 1
--     ),
--
--     CONSTRAINT UNIQUE_RelationalPredicates_rel_and_obj UNIQUE (rel_id, obj_id)
-- );





-- -- Terms derived from taking a function on an input.
-- CREATE TABLE DerivedTerms (
--     /* relational predicate ID */
--     id BIGINT UNSIGNED PRIMARY KEY,
--
--     -- function.
--     fun BIGINT UNSIGNED NOT NULL,
--     -- input.
--     input BIGINT UNSIGNED NOT NULL,
--
--     CONSTRAINT CHK_DerivedTerms_fun_is_semantic CHECK (
--         fun BETWEEN 0x2000000000000000 AND 0x7000000000000000 - 1
--     ),
--
--     CONSTRAINT UNIQUE_DerivedTerms_fun_input UNIQUE (fun, input)
-- );





-- Jeg tror at SavedSets ("set") bare simpelthen skal være en
-- VARBINARY(2**16).. ..eller en BLOB med andre ord.. som så indeholder
-- en liste over (rat_data, (obj_t, obj_id))-tupler..

CREATE TABLE SavedSets (
    /* saved set ID */
    id BIGINT UNSIGNED PRIMARY KEY,
    -- type = "set".
    -- (We are free to use "set" since the Sets entities are not terms.)

    /* data */
    elems BLOB
);










-- -- I think it will be easiest to use the same procedure for getting next id
-- -- pointers for all terms, so let me actually just make NextIDPointers
-- -- include all types. ..(Then it will also be easier to implement, if I want
-- -- to have several pointers in play for the same type at a time (maybe in
-- -- order to allocate ids..))..
-- CREATE TABLE NextIDPointers (
--     type_code TINYINT UNSIGNED,
--     next_id_pointer BIGINT UNSIGNED,
--
--     -- this id is not intended for any use!
--     id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
--     -- PRIMARY KEY (type_code, id)
-- );
-- INSERT INTO NextIDPointers (type_code, next_id_pointer)
-- VALUES
--     (0x00, 0x0000000000000001),
--     -- (0x06, 0x0600000000000001),
--     (0x10, 0x1000000000000001),
--     (0x20, 0x2000000000000001),
--     (0x30, 0x3000000000000001),
--     (0x70, 0x7000000000000001),
--     (0x80, 0x8000000000000001),
--     (0x90, 0x9000000000000001),
--     (0xA0, 0xA000000000000001),
--     (0xB0, 0xB000000000000001)
-- ;



CREATE TABLE Creators (
    term_t CHAR(3),
    term_id BIGINT UNSIGNED,
    PRIMARY KEY (term_t, term_id),

    -- creator (always has type = "usr").
    user_id BIGINT UNSIGNED,
    INDEX (user_id)
);





-- DELIMITER //
-- CREATE PROCEDURE createTerm (
--     IN tc TINYINT UNSIGNED,
--     IN u_id BIGINT UNSIGNED,
--     OUT new_id BIGINT UNSIGNED
-- )
-- BEGIN
--     SELECT next_id_pointer
--     INTO new_id
--     FROM NextIDPointers
--     WHERE type_code = tc
--     FOR UPDATE;
--
--     UPDATE NextIDPointers
--     SET next_id_pointer = next_id_pointer + 1
--     WHERE type_code = tc;
--
--     INSERT INTO Creators (user_id, term_id)
--     VALUES (u_id, new_id);
-- END //
-- DELIMITER ;







-- CREATE TABLE Strings (
--     /* variable character string ID */
--     id BIGINT UNSIGNED PRIMARY KEY,
--
--     -- /* creator */
--     -- user_id BIGINT UNSIGNED,
--
--     /* data */
--     str VARCHAR(255) UNIQUE,
--     FULLTEXT idx (str)
-- );
-- -- INSERT INTO Strings (id) VALUES (0xA000000000000000);

CREATE TABLE Texts (
    /* text ID */
    id BIGINT UNSIGNED PRIMARY KEY,
    -- type = "txt".

    /* data */
    str TEXT
);
-- INSERT INTO Strings (id) VALUES (0xB000000000000000);





CREATE TABLE Lists (
    /* list ID */
    id BIGINT UNSIGNED PRIMARY KEY,
    -- type = "lst".

    /* data */
    len SMALLINT UNSIGNED NOT NULL,

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
-- INSERT INTO Lists (id) VALUES (0x7000000000000000);



CREATE TABLE Binaries (
    /* binary string ID */
    id BIGINT UNSIGNED PRIMARY KEY,
    -- type = "bin".

    /* data */
    bin BLOB
);
-- INSERT INTO Binaries (id) VALUES (0x8000000000000000);

-- CREATE TABLE Blobs (
--     /* variable character string ID */
--     id BIGINT UNSIGNED PRIMARY KEY,
--
--     /* data */
--     bin BLOB
-- );
-- -- INSERT INTO Blobs (id) VALUES (0x9000000000000000);








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
