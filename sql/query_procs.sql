
SELECT "Query procedures";

-- DROP PROCEDURE selectInputSet;
-- DROP PROCEDURE selectRating;
-- DROP PROCEDURE selectRecentInputs;
--
-- DROP PROCEDURE selectEntity;
-- DROP PROCEDURE selectEntityID;
--
-- DROP PROCEDURE selectUsername;
-- DROP PROCEDURE selectUserInfo;
-- DROP PROCEDURE selectText;
-- DROP PROCEDURE selectTextSubstring;
-- DROP PROCEDURE selectBinary;
-- DROP PROCEDURE selectBinarySubstring;
--
-- DROP PROCEDURE private_selectCreator;
-- DROP PROCEDURE private_selectCreations;
--
-- DROP PROCEDURE selectAggregate;



DELIMITER //
CREATE PROCEDURE selectInputSet (
    IN userID BIGINT UNSIGNED,
    IN catID BIGINT UNSIGNED,
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
        cat_id = catID AND
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
    IN catID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED
)
BEGIN
    SELECT rat_val AS ratVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        cat_id = catID AND
        inst_id = instID
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectRecentInputs (
    IN startID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED
)
BEGIN
    SELECT
        user_id AS userID,
        cat_id AS catID,
        rat_val AS ratVal,
        inst_id AS instID,
        changed_at AS changedAt
    FROM RecentInputs
    WHERE id >= startID
    ORDER BY id ASC
    LIMIT maxNum;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectEntity (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT
        type_id AS typeID,
        cxt_id AS cxtID,
        def_str AS defStr
    FROM Entities
    WHERE id = entID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectEntityID (
    IN typeID BIGINT UNSIGNED,
    IN cxtID BIGINT UNSIGNED,
    IN defStr VARCHAR(255)
)
BEGIN
    IF (cxtID = 0) THEN
        SET cxtID = NULL;
    END IF;

    SELECT id AS entID
    FROM Entities
    WHERE (
        type_id = typeID AND
        cxt_id <=> cxtID AND
        def_str = defStr
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
CREATE PROCEDURE selectText (
    IN textID BIGINT UNSIGNED
)
BEGIN
    SELECT str AS textStr
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
    SELECT SUBSTRING(str, start, length) AS textStr
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
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT user_id AS userID
    FROM Private_Creators
    WHERE ent_id = entID;
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
    SELECT ent_id AS entID
    FROM Private_Creators
    WHERE user_id = userID
    ORDER BY
        CASE WHEN isAscOrder THEN ent_id END ASC,
        CASE WHEN NOT isAscOrder THEN ent_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectAggregate (
    IN defID BIGINT UNSIGNED,
    IN objID BIGINT UNSIGNED
)
BEGIN
    SELECT data AS data
    FROM Aggregates
    WHERE (
        def_id = defID AND
        obj_id = objID
    );
END //
DELIMITER ;
