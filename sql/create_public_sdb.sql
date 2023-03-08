-- USE mydatabase;



DELETE FROM Sets;
DELETE FROM SemanticInputs;

DELETE FROM UserGroups;
DELETE FROM Users;

DELETE FROM Categories;
DELETE FROM StandardTerms;
DELETE FROM Relations;
DELETE FROM KeywordStrings;
DELETE FROM ConstantSets;
DELETE FROM Lists;
DELETE FROM Texts;
DELETE FROM Binaries;

DELETE FROM Creators;

-- /* Semantic inputs */
-- DROP TABLE Sets;
-- DROP TABLE SemanticInputs;
--
-- /* Terms */
-- DROP TABLE UserGroups;
-- DROP TABLE Users;
--
-- DROP TABLE Categories;
-- DROP TABLE StandardTerms;
-- DROP TABLE Relations;
-- DROP TABLE KeywordStrings;
--
-- DROP TABLE ConstantSets;
--
-- DROP TABLE Lists;
-- DROP TABLE Texts;
-- DROP TABLE Binaries;
--
-- /* Meta data */
-- DROP TABLE Creators;





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





CREATE TABLE UserGroups (
    -- user group ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "grp".

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
    is_dynamic TINYINT -- BOOL
);
-- ALTER TABLE UserGroups AUTO_INCREMENT = 1;


CREATE TABLE Users (
    -- user ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "usr".

    upload_vol_today BIGINT,
    download_vol_today BIGINT,

    upload_vol_this_month BIGINT,
    download_vol_this_month BIGINT,

    -- In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need for exchanging
    -- passwords between (third) parties.
    pub_encr_key VARBINARY(10000)

    -- /* timestamp */
    -- not needed since one should rather just keep a rough(!) count on the
    -- id--date correspondance.
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);









CREATE TABLE Categories (
    -- category ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "cat".

    -- title of the category, preferably a plural noun describing/referencing
    -- the elements in the category.
    title VARCHAR(255) NOT NULL,
    FULLTEXT idx (title),

    -- id of a defining super category.
    super_cat_id BIGINT UNSIGNED NOT NULL,

    UNIQUE INDEX (title, super_cat_id)
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
    cat_id BIGINT UNSIGNED NOT NULL,
    -- Note that 0x2000000000000001 is category of all Terms.

    UNIQUE INDEX (title, cat_id)
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

    obj_cat_id BIGINT UNSIGNED NOT NULL,

    subj_cat_id BIGINT UNSIGNED NOT NULL,

    -- -- flag representing if relation expects only one object (in general) per
    -- -- subject.
    -- is_one_to_one TINYINT NOT NULL,

    -- -- description.
    -- descr TEXT

    UNIQUE INDEX (obj_noun, obj_cat_id, subj_cat_id)

    -- CONSTRAINT CHK_Relations_subj_cat_id CHECK (
    --     subj_cat_id BETWEEN 0x2000000000000000 AND 0x3000000000000000 - 1
    -- ),

    -- CONSTRAINT CHK_Relations_obj_cat_id CHECK (
    --     obj_cat_id BETWEEN 0x2000000000000000 AND 0x3000000000000000 - 1
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









-- Jeg tror at ConstantSets ("set") bare simpelthen skal være en
-- VARBINARY(2**16).. ..eller en BLOB med andre ord.. som så indeholder
-- en liste over (rat_data, (obj_t, obj_id))-tupler..

CREATE TABLE ConstantSets (
    /* saved set ID */
    id BIGINT UNSIGNED PRIMARY KEY,
    -- type = "set".
    -- (We are free to use "set" since the Sets entities are not terms.)

    -- user or user group who states the statement.
    user_t CHAR(3),
    user_id BIGINT UNSIGNED,

    -- subject of relation.
    subj_t CHAR(3),
    subj_id BIGINT UNSIGNED,

    -- relation.
    rel_id BIGINT UNSIGNED,


    /* data */
    elems BLOB
);







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







CREATE TABLE Creators (
    term_t CHAR(3),
    term_id BIGINT UNSIGNED,
    PRIMARY KEY (term_t, term_id),

    -- creator (always has type = "usr").
    user_id BIGINT UNSIGNED,
    INDEX (user_id)
);





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
