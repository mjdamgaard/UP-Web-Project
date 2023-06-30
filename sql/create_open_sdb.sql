
-- /* Semantic inputs */
-- DROP TABLE SemanticInputs;
-- DROP TABLE PrivateRecentInputs;
-- DROP TABLE RecentInputs;
-- DROP TABLE Indexes;
--
-- /* Terms */
DROP TABLE Terms;
--
-- /* Data */
-- DROP TABLE Users;
-- DROP TABLE Texts;
-- DROP TABLE Binaries;
--
-- /* Meta data */
-- DROP TABLE PrivateCreators;





/* Statements that the users (or bots) give as input to the semantic network.
 * A central feature of this semantic system is that all such statements come
 * with a numerical value which represents the degree to which the user deems
 * that the statement is correct (like when answering a survey).
 **/
CREATE TABLE SemanticInputs (
    -- user (or bot) who states the statement.
    user_id BIGINT UNSIGNED NOT NULL,
    -- predicate.
    pred_id BIGINT UNSIGNED NOT NULL,

    /* The "input set" */
    -- given some constants for the above four columns, the input sets contains
    -- pairs of rating values and the IDs of the predicate subjects.
    rat_val SMALLINT UNSIGNED NOT NULL,
    subj_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        user_id,
        pred_id,
        rat_val,
        subj_id
    ),

    UNIQUE INDEX (user_id, pred_id, subj_id)
);
-- TODO: Compress this table and its sec. index, as well as some other tables
-- and sec. indexes below. (But compression is a must for this table.)


CREATE TABLE PrivateRecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    pred_id BIGINT UNSIGNED NOT NULL,
    -- new rating value.
    rat_val SMALLINT UNSIGNED,
    subj_id BIGINT UNSIGNED NOT NULL,

    live_after TIME
    -- TODO: Make a recurring scheduled event that decrements the days of this
    -- time, and one that continously moves the private RIs to the public table
    -- when the time is up (and when the day part of the time is at 0).
);
CREATE TABLE RecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    pred_id BIGINT UNSIGNED NOT NULL,
    -- new rating value.
    rat_val SMALLINT UNSIGNED,
    subj_id BIGINT UNSIGNED NOT NULL,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE TABLE RecordedInputs (
--     user_id BIGINT UNSIGNED NOT NULL,
--     pred_id BIGINT UNSIGNED NOT NULL,
--     -- recorded rating value.
--     subj_id BIGINT UNSIGNED NOT NULL,
--
--     changed_at DATETIME,
--
--     rat_val SMALLINT UNSIGNED,
--
--     PRIMARY KEY (
--         user_id,
--         pred_id,
--         subj_id,
--         changed_at
--     )
-- );

CREATE TABLE Indexes (
    -- user (or bot) who states the statement.
    user_id BIGINT UNSIGNED NOT NULL,
    -- predicate.
    pred_id BIGINT UNSIGNED NOT NULL,

    -- rat_val is changed for the subject's def_str in Indexes, when comparing
    -- to SemanticInputs.
    subj_def_str VARCHAR(255) NOT NULL,
    subj_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        user_id,
        pred_id,
        subj_def_str,
        subj_id
    ),

    UNIQUE INDEX (user_id, pred_id, subj_id)
);







CREATE TABLE Terms (
    -- term ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- id of the context which tells how the subsequent columns are to be
    -- interpreted. (Null implies the default context of the SDB, and terms
    -- with null as their context will use "Terms", id = 6, as a substitute for
    -- their context. Note that context IDs of 1--6 are not allowed.)
    context_id BIGINT UNSIGNED,

    -- defining string of the term. This can be a lexical item, understood in
    -- the context of the term with id = context_id. Or it can be a list of
    -- term IDs, separated by commas, whose interpretation will then typically
    -- be given by a "Template context", see initial_inserts.sql for how these
    -- "Template contexts" work. Predicate terms, which are an important part
    -- of this system, will also often be formed this way, namely where at
    -- least one ID in the list represent a relation, and where one ID
    -- represents the object. This is how we are able to implement semantic
    -- relations; via compound predicates made from such "Template contexts."
    -- Again, see initial_inserts.sql for how this works.
    def_str VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    UNIQUE INDEX (context_id, def_str)
);

INSERT INTO Terms (context_id, def_str, id)
VALUES
    (NULL, "{Data} and users of the SDB", 1),
    (1, "Users", 2),
    (2, "admin_1", 3),
    (1, "Texts", 4),
    (1, "Binaries", 5),
    (NULL, "Terms", 6);



CREATE TABLE Users (
    -- user ID.
    id BIGINT UNSIGNED PRIMARY KEY,

    username VARCHAR(50) UNIQUE,

    public_keys_for_authentication TEXT,
    -- (In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need to exchange passwords
    -- between databases.) (This could also be other data than encryption keys,
    -- and in principle it could even just be some ID to use for authenticating
    -- the user via a third party.)

    -- TODO: Implement managing of and restrictions on these fields when/if it
    -- becomes relevant:
    private_upload_vol_today BIGINT DEFAULT 0,
    private_download_vol_today BIGINT DEFAULT 0,
    private_upload_vol_this_month BIGINT DEFAULT 0,
    private_download_vol_this_month BIGINT DEFAULT 0
);

INSERT INTO Users (username, id)
VALUES ("admin_1", 3);



CREATE TABLE Texts (
    /* text ID */
    id BIGINT UNSIGNED PRIMARY KEY,

    /* data */
    str TEXT NOT NULL
);

CREATE TABLE Binaries (
    /* binary string ID */
    id BIGINT UNSIGNED PRIMARY KEY,

    /* data */
    bin LONGBLOB NOT NULL
);







CREATE TABLE PrivateCreators (
    term_id BIGINT UNSIGNED PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    INDEX (user_id)
);
-- (These should generally be deleted quite quickly, and instead a special bot
-- should rate which Term is created by which user, if and only if the given
-- user has declared that they are the creater themselves (by rating the same
-- predicate before the bot).)
