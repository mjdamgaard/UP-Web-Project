-- USE mydatabase;



-- DELETE FROM Sets;
-- DELETE FROM SemanticInputs;
-- DELETE FROM RecentInputs
--
-- DELETE FROM UserGroups;
-- DELETE FROM Users;
--
-- DELETE FROM Categories;
-- DELETE FROM ElementaryTerms;
-- DELETE FROM Relations;
-- DELETE FROM KeywordStrings;
-- DELETE FROM Lists;
-- DELETE FROM Texts;
-- DELETE FROM Binaries;
--
-- DELETE FROM Creators;

-- /* Semantic inputs */
DROP TABLE Sets;
DROP TABLE SemanticInputs;
DROP TABLE RecentInputs;
--
-- /* Terms */
DROP TABLE UserGroups;
DROP TABLE Users;
--
DROP TABLE Categories;
DROP TABLE ElementaryTerms;
DROP TABLE Terms;
DROP TABLE Relations;
-- DROP TABLE KeywordStrings;
-- DROP TABLE Patterns;
-- DROP TABLE Lists;
-- DROP TABLE Texts;
-- DROP TABLE Binaries;
--
-- /* Meta data */
DROP TABLE Creators;





CREATE TABLE Sets (
    -- set ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "s".

    -- user or user group who states the statement.
    user_id BIGINT UNSIGNED NOT NULL,
    -- subject of relation.
    subj_id BIGINT UNSIGNED NOT NULL,
    -- relation.
    rel_id BIGINT UNSIGNED NOT NULL,

    -- number of elements.
    elem_num BIGINT UNSIGNED NOT NULL,

    UNIQUE INDEX (
        user_id,
        subj_id,
        rel_id
    )

);




/* Statements which the users (or bots) give as input to the semantic network.
 * A central feature of this semantic system is that all such statements come
 * with a numerical value which represents the degree to which the user deems
 * that the statement is correct (like when answering a survey).
 **/
CREATE TABLE SemanticInputs (
    /* Set */
    -- set id.
    set_id BIGINT UNSIGNED NOT NULL,

    /* Member */
    -- The members of sets include a rating value and an object term.
    -- rating value.
    rat_val VARBINARY(255) NOT NULL,

    -- object of the relation defining the set (i.e. the primary part of the
    -- member which the rating is about). (Since the set include info on what
    -- type of objects it contains, only the numerical id is needed.)
    obj_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        set_id,
        rat_val,
        obj_id
    ),

    -- (obj_t, obj_id and set_id will not be redundantly repeated in this
    -- secondary index. The size of the index will thus be the same as the
    -- clustered index.)
    INDEX (obj_id, set_id) -- This index is already unique due to the PK.

    -- -- w_exp is a nummerical value which gives the weight of the rating
    -- -- when plugged into the equation w = 2^(w_exp / 32).
    -- -- inv_w_exp is the multiplicational inverse of w_exp, meaning that
    -- -- w = 2^(- inv_w_exp / 32).
    -- inv_w_exp_t32 TINYINT UNSIGNED NOT NULL

);


CREATE TABLE RecentInputs (
    set_id BIGINT UNSIGNED NOT NULL,

    -- old and new rating value (NULL means nonexistent or removed).
    old_rat_val VARBINARY(255),
    new_rat_val VARBINARY(255),

    obj_id BIGINT UNSIGNED NOT NULL,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
        set_id,
        obj_id,
        changed_at
    )
);


-- CREATE TABLE UserGroups (
--  -- user group ID.
--   id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--  -- type = "grp".
--
--  -- todo: I think I will change (creator_t, creator_id) to just a set_id
--  -- instead.
--
--  -- id of the creating user group (or user or bot).
--  -- creator_t CHAR(1) NOT NULL, ...
--   creator_id BIGINT UNSIGNED NOT NULL,
--
--  -- This is not the date at which the user group was created as a term.
--  -- Rather, it is the date at which the weights within the creating user
--  -- group are measured (if creator is not a single user or bot). Thus, if
--  -- the creating user group is dynamic and its weights thus changes after
--  -- this "effective creation date," these changes will then not affect this
--  -- user group.
--     effective_creation_date DATE,
--  -- If effective_creation_date is a date in the future, or if it is NULL,
--  -- it might mean (if this functionality is implemented) that the creating
--  -- group is also allowed change in time. But this functionality will
--  -- probably not be useful enough compared to the cost to be implemented,
--  -- however. (But I just wanted to note the possibility, should we realize
--  -- that it will be useful at some point.)
--
--
--  -- date after which, if it is not NULL, all ratings are frozen and no new
--  -- ratings are recorded for the user group. The end date can start out as
--  -- NULL and then be set to a value at a later date, if the group decides
--  -- to stop being active. It might also happen that the server decides to
--  -- discontinue a group due to cost of maintaining, in which case an end
--  -- date will also be set.
--   end_date DATE,
--
--  -- Flag (interpreted as a BOOL) that tells if the user group is dynamic,
--  -- meaning that the creating user group (which will probably either be a
--  -- "constant" user group, or will be effectively constant due to the
--  -- effective_creation_date) is allowed to continously change the weights
--  -- of this user group. A "constant" user group (with is_dynamic = FALSE),
--  -- on the other hand, has constant weights which are set at the "effective
--  -- creation date" and not changed after that.
--   is_dynamic TINYINT NOT NULL -- BOOL
-- );


CREATE TABLE Users (
    -- user ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "u".

    -- (I have out-commented these following columns, since they should rather
    -- be part of another table, namely in a private (part of the) database.)
    -- upload_vol_today BIGINT,
    -- download_vol_today BIGINT,
    -- upload_vol_this_month BIGINT,
    -- download_vol_this_month BIGINT,

    -- In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need for exchanging
    -- passwords between (third) parties.
    public_keys_for_authentication TEXT
);





CREATE TABLE Categories (
    -- category ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "c".

    -- title of the category, preferably a plural noun describing/referencing
    -- the elements in the category.
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    -- id of a defining super category.
    super_cat_id BIGINT UNSIGNED NOT NULL,

    UNIQUE INDEX (title, super_cat_id)

);

CREATE TABLE Terms (
    -- term ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "t".

    -- title of the term.
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    -- id of a defining category.
    cat_id BIGINT UNSIGNED NOT NULL,

    UNIQUE INDEX (title, cat_id)
);

CREATE TABLE Relations (
    -- relation ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "r".

    subj_t CHAR(1) NOT NULL,
    obj_t CHAR(1) NOT NULL,

    -- noun describing the object in terms of what the object is to the
    -- subject of the relation. This is except (at least) in cases where the
    -- subject category is Categories: Then the obj_noun can also be an
    -- adjective instead, saying that "object is <adjective> for an element
    -- in <subject>. Please capitilize nouns, but not adjectives. *No. I
    -- actually think that it is better if we do use only nouns, write
    -- "<adjective> elements" instead of "<adjective>." This allows us to
    -- better parse the adjectives, without a very high risk
    -- of parsing an object noun as an adjective instead. And the "elements"
    -- can then just be removed client-side for adjective relations.
    -- *(And we should also have object nouns of the form "Elements <verb in
    -- adjective form>", e.g. "Elements related to so and so". Then the app
    -- can also remove the "Elements" in front and only print the rest.)
    obj_noun VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    -- FULLTEXT idx (obj_noun),


    -- subj_cat_id BIGINT UNSIGNED NOT NULL,
    -- -- obj_cat_id BIGINT UNSIGNED NOT NULL,

    UNIQUE INDEX (subj_t, obj_t, obj_noun)
);




CREATE TABLE KeywordStrings (
    /* keyword string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "k".

    -- keyword string.
    str VARCHAR(768) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
    FULLTEXT idx (str)
);


CREATE TABLE Patterns (
    /* RegEx pattern string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "p".

    -- pattern string.
    str VARCHAR(768) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE
);




CREATE TABLE Texts (
    /* text ID */
    id BIGINT UNSIGNED PRIMARY KEY,
    -- type = "x".

    /* data */
    str TEXT NOT NULL
);

CREATE TABLE Binaries (
    /* binary string ID */
    id BIGINT UNSIGNED PRIMARY KEY,
    -- type = "b".

    /* data */
    bin BLOB NOT NULL
);


CREATE TABLE Lists (
    /* list ID */
    id BIGINT UNSIGNED PRIMARY KEY,
    -- type = "l".

    /* data */
    len SMALLINT UNSIGNED NOT NULL,

    elem_ts VARCHAR(31) NOT NULL,
    elem_ids VARBINARY(248) NOT NULL,

    tail_id BIGINT UNSIGNED
);





CREATE TABLE Creators (
    entity_t CHAR(1) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (entity_t, entity_id),

    user_id BIGINT UNSIGNED NOT NULL,
    INDEX (user_id)
);
