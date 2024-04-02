
SELECT "Query procedures";

DROP PROCEDURE selectRatedList;
DROP PROCEDURE selectRating;

DROP PROCEDURE selectEntity;
DROP PROCEDURE selectEntityID;

DROP PROCEDURE selectUsername;
DROP PROCEDURE selectUserInfo;
DROP PROCEDURE selectUserID;
DROP PROCEDURE selectText;
DROP PROCEDURE selectTextSubstring;
DROP PROCEDURE selectBinary;
DROP PROCEDURE selectBinarySubstring;

DROP PROCEDURE selectBotData;



DELIMITER //
CREATE PROCEDURE selectRatedList (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN ratingRangeLo SMALLINT UNSIGNED,
    IN ratingRangeHi SMALLINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        rat_val AS ratVal,
        inst_id AS instID
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        tag_id = tagID AND
        (ratingRangeLo = 0 OR rat_val >= ratingRangeLo) AND
        (ratingRangeHi = 0 OR rat_val <= ratingRangeHi)
    )
    ORDER BY
        CASE WHEN isAscOrder THEN rat_val END ASC,
        CASE WHEN NOT isAscOrder THEN rat_val END DESC,
        CASE WHEN isAscOrder THEN inst_id END ASC,
        CASE WHEN NOT isAscOrder THEN inst_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectRating (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED
)
BEGIN
    SELECT rat_val AS ratVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        tag_id = tagID AND
        inst_id = instID
    );
END //
DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE selectRecentInputs (
--     IN startID BIGINT UNSIGNED,
--     IN maxNum INT UNSIGNED
-- )
-- BEGIN
--     SELECT
--         user_id AS userID,
--         tag_id AS tagID,
--         inst_id AS instID,
--         rat_val AS ratVal,
--         changed_at AS changedAt
--     FROM RecentInputs
--     WHERE id >= startID
--     ORDER BY id ASC
--     LIMIT maxNum;
-- END //
-- DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectEntity (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT
        def AS def
    FROM Entities
    WHERE id = entID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectEntityID (
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        def = defStr
    );
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectUsername (
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT username AS username
    FROM UsersAndBots
    WHERE id = userID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectUserInfo (
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT
        username AS username,
        public_keys_for_authentication AS publicKeys
    FROM UsersAndBots
    WHERE id = userID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectUserID (
    IN uName VARCHAR(50)
)
BEGIN
    SELECT id AS userID
    FROM UsersAndBots
    WHERE username = uName;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectText (
    IN textID BIGINT UNSIGNED
)
BEGIN
    SELECT txt AS text
    FROM Texts
    WHERE id = textID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTextSubstring (
    IN textID BIGINT UNSIGNED,
    IN length SMALLINT UNSIGNED,
    IN start INT
)
BEGIN
    SELECT SUBSTRING(txt, start, length) AS text
    FROM Texts
    WHERE id = textID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectBinary (
    IN binID BIGINT UNSIGNED
)
BEGIN
    SELECT bin AS bin
    FROM Binaries
    WHERE id = binID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectBinarySubstring (
    IN binID BIGINT UNSIGNED,
    IN length SMALLINT UNSIGNED,
    IN start INT
)
BEGIN
    SELECT SUBSTRING(bin, start, length) AS bin
    FROM Binaries
    WHERE id = binID;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE selectBotData (
    IN botID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT data_1, data_2, data_3, data_4 AS data1, data2, data3, data4
    FROM BotData
    WHERE (
        bot_id = botID AND
        ent_id = entID
    );
END //
DELIMITER ;
