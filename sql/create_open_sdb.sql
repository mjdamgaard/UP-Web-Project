
-- /* Semantic inputs */
-- DROP TABLE Sets;
-- DROP TABLE SemanticInputs;
-- DROP TABLE PrivateRecentInputs;
-- DROP TABLE RecentInputs;
-- DROP TABLE RecordedInputs;
--
-- /* Terms */
-- DROP TABLE Users;
-- DROP TABLE Contexts;
-- DROP TABLE Terms;
-- DROP TABLE Lists;
-- DROP TABLE Patterns;
-- DROP TABLE KeywordStrings;
-- DROP TABLE Texts;
-- DROP TABLE Binaries;
--
-- /* Meta data */
-- DROP TABLE Creators;





CREATE TABLE Sets (
    -- set ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "s".

    -- user or user group who states the statement.
    user_id BIGINT UNSIGNED NOT NULL,
    -- predicate.
    pred_id BIGINT UNSIGNED NOT NULL,
    -- type of the subjects of the predicate.
    subj_t CHAR(1) NOT NULL,
    -- text defining the interpretation of the rating values in the set.
    rat_val_definition_text_id BIGINT UNSIGNED,

    -- number of elements.
    elem_num BIGINT UNSIGNED NOT NULL,

    UNIQUE INDEX (
        user_id,
        pred_id,
        subj_t,
        rat_val_definition_text_id
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

    -- subject of the relation defining the set (i.e. the primary part of the
    -- member which the rating is about). (Since the set include info on what
    -- type of objects it contains, only the numerical id is needed.)
    subj_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        set_id,
        rat_val,
        subj_id
    ),

    -- (subj_id and set_id will not be redundantly repeated in this
    -- secondary index. The size of the index will thus be the same as the
    -- clustered index.)
    INDEX (subj_id, set_id) -- This index is already unique due to the PK.

    -- -- w_exp is a nummerical value which gives the weight of the rating
    -- -- when plugged into the equation w = 2^(w_exp / 32).
    -- -- inv_w_exp is the multiplicational inverse of w_exp, meaning that
    -- -- w = 2^(- inv_w_exp / 32).
    -- inv_w_exp_t32 TINYINT UNSIGNED NOT NULL

);


CREATE TABLE PrivateRecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    set_id BIGINT UNSIGNED NOT NULL,
    -- new rating value.
    rat_val VARBINARY(255),
    subj_id BIGINT UNSIGNED NOT NULL,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    live_at DATETIME
);
CREATE TABLE RecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    set_id BIGINT UNSIGNED NOT NULL,
    -- new rating value.
    rat_val VARBINARY(255),
    subj_id BIGINT UNSIGNED NOT NULL,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE RecordedInputs (
    set_id BIGINT UNSIGNED NOT NULL,
    -- new rating value.
    rat_val VARBINARY(255),
    subj_id BIGINT UNSIGNED NOT NULL,

    changed_at DATETIME,

    PRIMARY KEY (
        set_id,
        subj_id,
        changed_at
    )
);





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

    public_keys_for_authentication TEXT
    -- (In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need to exchange passwords
    -- between databases.)
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
--  creator_id BIGINT UNSIGNED NOT NULL,
--
--  -- This is not the date at which the user group was created as a term.
--  -- Rather, it is the date at which the weights within the creating user
--  -- group are measured (if creator is not a single user or bot). Thus, if
--  -- the creating user group is dynamic and its weights thus changes after
--  -- this "effective creation date," these changes will then not affect this
--  -- user group.
--  effective_creation_date DATE,
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
--  end_date DATE,
--
--  -- Flag (interpreted as a BOOL) that tells if the user group is dynamic,
--  -- meaning that the creating user group (which will probably either be a
--  -- "constant" user group, or will be effectively constant due to the
--  -- effective_creation_date) is allowed to continously change the weights
--  -- of this user group. A "constant" user group (with is_dynamic = FALSE),
--  -- on the other hand, has constant weights which are set at the "effective
--  -- creation date" and not changed after that.
--  is_dynamic TINYINT NOT NULL -- BOOL
-- );





CREATE TABLE Contexts (
    -- context ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "c".

    -- parent context.
    parent_context_id BIGINT UNSIGNED NOT NULL,
    -- a category title for the context (preferable to use plural nouns).
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    UNIQUE INDEX (parent_context_id, title)
);

CREATE TABLE Terms (
    -- term ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "t".

    -- id of the context which tells how the subsequent columns are to be
    -- interpreted.
    context_id BIGINT UNSIGNED NOT NULL,
    -- title of the term.
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    -- the specifying entity (nullable), which can define the term more than
    -- just the context and the title does (useful for specifying instances of
    -- very broad classes of objects, such as texts, images, comments, and so
    -- on, where it is hard to specify the objects using contexts alone).
    -- Oh, and more importantly, the specifying entities are used to make
    -- predicates from relation--object pairs, which is of course a central
    -- usage in a semantic system: implementing relations.
    -- (The type of the specifying entity is given by the context.)
    spec_entity_t CHAR(1),
    spec_entity_id BIGINT UNSIGNED,

    UNIQUE INDEX (context_id, spec_entity_t, spec_entity_id, title)
);


CREATE TABLE Lists (
    /* list ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "l".

    /* data */
    elem_ts VARCHAR(31) NOT NULL,
    elem_ids VARBINARY(248) NOT NULL,

    tail_id BIGINT UNSIGNED,

    UNIQUE INDEX (elem_ts, elem_ids, tail_id)
);





CREATE TABLE Patterns (
    /* RegEx pattern string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "p".

    -- pattern string.
    str VARCHAR(768) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE
);


CREATE TABLE KeywordStrings (
    /* keyword string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "k".

    -- keyword string.
    str VARCHAR(768) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
    FULLTEXT idx (str)
);





CREATE TABLE Texts (
    /* text ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "x".

    /* data */
    str TEXT NOT NULL
);

CREATE TABLE Binaries (
    /* binary string ID */
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- type = "b".

    /* data */
    bin LONGBLOB NOT NULL
);





CREATE TABLE Creators (
    entity_t CHAR(1) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (entity_t, entity_id),

    user_id BIGINT UNSIGNED NOT NULL,
    INDEX (user_id)
);
