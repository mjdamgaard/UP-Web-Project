
SELECT "Query procedures";

DROP PROCEDURE selectRatedList;
DROP PROCEDURE selectRating;

DROP PROCEDURE selectString;
DROP PROCEDURE selectStringID;

DROP PROCEDURE selectUsername;
DROP PROCEDURE selectUserInfo;
DROP PROCEDURE selectUserID;
DROP PROCEDURE selectText;
DROP PROCEDURE selectTextSubstring;
DROP PROCEDURE selectBinary;
DROP PROCEDURE selectBinarySubstring;

DROP PROCEDURE private_selectCreator;
DROP PROCEDURE private_selectCreations;

DROP PROCEDURE selectEventData;



DELIMITER //
CREATE PROCEDURE selectRatedList (
    IN userID BIGINT UNSIGNED,
    IN objTypeID BIGINT UNSIGNED,
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
        obj_str_id AS objStrID
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        obj_type_id = objTypeID AND
        tag_id = tagID AND
        (ratingRangeLo = 0 OR rat_val >= ratingRangeLo) AND
        (ratingRangeHi = 0 OR rat_val <= ratingRangeHi)
    )
    ORDER BY
        CASE WHEN isAscOrder THEN rat_val END ASC,
        CASE WHEN NOT isAscOrder THEN rat_val END DESC,
        CASE WHEN isAscOrder THEN obj_str_id END ASC,
        CASE WHEN NOT isAscOrder THEN obj_str_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectRating (
    IN userID BIGINT UNSIGNED,
    IN objTypeID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN objStrID BIGINT UNSIGNED
)
BEGIN
    SELECT rat_val AS ratVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        obj_type_id = objTypeID AND
        tag_id = tagID AND
        obj_str_id = objStrID
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
--         obj_str_id AS objStrID,
--         rat_val AS ratVal,
--         changed_at AS changedAt
--     FROM RecentInputs
--     WHERE id >= startID
--     ORDER BY id ASC
--     LIMIT maxNum;
-- END //
-- DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectString (
    IN strID BIGINT UNSIGNED
)
BEGIN
    SELECT
        str AS str
    FROM Entities
    WHERE id = strID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectStringID (
    IN string VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    SELECT id AS strID
    FROM Entities
    WHERE (
        str = string
    );
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectUsername (
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT username AS username
    FROM Users
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
    FROM Users
    WHERE id = userID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectUserID (
    IN uName VARCHAR(50)
)
BEGIN
    SELECT id AS userID
    FROM Users
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
CREATE PROCEDURE private_selectCreator (
    IN strID BIGINT UNSIGNED
)
BEGIN
    SELECT user_id AS userID
    FROM Private_Creators
    WHERE ent_id = strID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE private_selectCreations (
    IN userID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT ent_id AS strID
    FROM Private_Creators
    WHERE user_id = userID
    ORDER BY
        CASE WHEN isAscOrder THEN ent_id END ASC,
        CASE WHEN NOT isAscOrder THEN ent_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEventData (
    IN defID BIGINT UNSIGNED,
    IN objID BIGINT UNSIGNED
)
BEGIN
    SELECT data AS data
    FROM EventData
    WHERE (
        def_id = defID AND
        obj_id = objID
    );
END //
DELIMITER ;
