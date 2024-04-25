
SELECT "Query procedures";

DROP PROCEDURE selectInstanceList;
DROP PROCEDURE selectInstanceListSecKey;
DROP PROCEDURE selectRating;

DROP PROCEDURE selectEntityInfo;

DROP PROCEDURE selectText;
DROP PROCEDURE selectBinary;

DROP PROCEDURE selectUserInfo;
DROP PROCEDURE selectBotInfo;

DROP PROCEDURE selectDefEntityID;
DROP PROCEDURE selectSimEntityID;
DROP PROCEDURE selectFormEntityID;
DROP PROCEDURE selectPropTagEntityID;
DROP PROCEDURE selectTextEntityID;
DROP PROCEDURE selectBinaryEntityID;
DROP PROCEDURE selectUserEntityID;
DROP PROCEDURE selectBotEntityID;

DROP PROCEDURE selectCreator;
DROP PROCEDURE selectCreations;

DROP PROCEDURE selectAncillaryBotData1e2d;
DROP PROCEDURE selectAncillaryBotData1e4d;




DELIMITER //
CREATE PROCEDURE selectInstanceList (
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
CREATE PROCEDURE selectInstanceListSecKey (
    IN userID BIGINT UNSIGNED,
    IN tagDef VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN ratingRangeLo SMALLINT UNSIGNED,
    IN ratingRangeHi SMALLINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    DECLARE tagID BIGINT UNSIGNED;
    
    SELECT id INTO tagID
    FROM Entities
    WHERE (
        def = tagDef
    );

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
CREATE PROCEDURE selectEntityInfo (
    IN entID BIGINT UNSIGNED
)
BEGIN
    DECLARE dataType CHAR;
    DECLARE dataKey BIGINT UNSIGNED;
    DECLARE titleID, defID, titleDataKey BIGINT UNSIGNED;

    -- Get the dataType and dataKey.
    SELECT data_type, data_key INTO dataType, dataKey 
    FROM Entities
    WHERE id = entID;

    IF (dataType = 's') THEN
        -- Select the returned info.
        SELECT
            dataType,
            title
        FROM SimpleEntityData
        WHERE data_key = dataKey;

    ELSEIF (dataType = 'd') THEN
        -- Select the returned info.
        SELECT title_id, def_id INTO titleID, defID
        FROM DefinedEntityData
        WHERE data_key = dataKey;
        SELECT data_key INTO titleDataKey
        FROM Entities
        WHERE id = titleID;
        SELECT
            dataType,
            titleID,
            title,
            defID
        FROM SimpleEntityData
        WHERE data_key = titleDataKey;

    ELSEIF (dataType = 'f') THEN
        -- Select the returned info.
        SELECT
            dataType,
            fun_id AS funID,
            input_list AS inputs
        FROM FormalEntityData
        WHERE data_key = dataKey;

    ELSEIF (dataType = 'p') THEN
        -- Select the returned info.
        SELECT
            dataType,
            subj_id AS subjID,
            prop_id AS propID
        FROM PropertyTagEntityData
        WHERE data_key = dataKey;

    ELSEIF (dataType = 't') THEN
        -- Select the returned info.
        SELECT
            dataType,
            SUBSTRING(txt, 1, 255) AS textStart,
            LENGTH(txt) AS len,
            data_hash AS dataHash
        FROM TextData
        WHERE data_key = dataKey;

    ELSEIF (dataType = 'b') THEN
        -- Select the returned info.
        SELECT
            dataType,
            LENGTH(bin) AS len,
            data_hash AS dataHash
        FROM BinaryData
        WHERE data_key = dataKey;

    ELSEIF (dataType = 'u') THEN
        -- Select the returned info.
        SELECT
            dataType,
            username
        FROM UserData
        WHERE data_key = dataKey;


    ELSEIF (dataType = 'a') THEN
        -- Select the returned info.
        SELECT
            dataType,
            bot_name AS botName
        FROM AggregationBotData
        WHERE data_key = dataKey;


    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectText (
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SET startPos = startPos + 1;

    SELECT
        CASE WHEN maxLen = 0 THEN SUBSTRING(txt, startPos, startPos + maxLen)
        ELSE SUBSTRING(txt, startPos, startPos + maxLen)
        END AS text
    FROM TextData
    WHERE data_key = (
        SELECT data_key
        FROM Entities
        WHERE id = entID
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectBinary (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT bin
    FROM BinaryData
    WHERE data_key = (
        SELECT data_key
        FROM Entities
        WHERE id = entID
    );
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
    FROM UserData
    WHERE data_key = (
        SELECT data_key
        FROM Entities
        WHERE id = userID
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectBotInfo (
    IN botName BIGINT UNSIGNED
)
BEGIN
    SELECT
        bot_name AS botName,
        bot_description AS botDescription
    FROM AggregationBotData
    WHERE data_key = (
        SELECT data_key
        FROM Entities
        WHERE id = botName
    );
END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE selectSimEntityID (
    IN titleStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        data_type = 's' AND
        data_key = (
            SELECT data_key
            FROM SimpleEntityData
            WHERE title = titleStr
        )
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectDefEntityID (
    IN titleID BIGINT UNSIGNED,
    IN defID BIGINT UNSIGNED
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        data_type = 'd' AND
        data_key = (
            SELECT data_key
            FROM DefinedEntityData
            WHERE title_id = titleID AND def_id = defID
        )
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectFormEntityID (
    IN funID BIGINT UNSIGNED,
    IN inputs VARCHAR(255)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        data_type = 'f' AND
        data_key = (
            SELECT data_key
            FROM FormalEntityData
            WHERE fun_id = funID AND input_list = inputs
        )
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectPropTagEntityID (
    IN subjID BIGINT UNSIGNED,
    IN propID BIGINT UNSIGNED
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        data_type = 'p' AND
        data_key = (
            SELECT data_key
            FROM PropertyTagEntityData
            WHERE subj_id = subjID AND prop_id = propID
        )
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTextEntityID (
    IN dataHash VARCHAR(255)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        data_type = 't' AND
        data_key = (
            SELECT data_key
            FROM TextData
            WHERE data_hash = dataHash
        )
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectBinaryEntityID (
    IN dataHash VARCHAR(255)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        data_type = 'b' AND
        data_key = (
            SELECT data_key
            FROM BinaryData
            WHERE data_hash = dataHash
        )
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectUserEntityID (
    IN uName VARCHAR(255)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        data_type = 'u' AND
        data_key = (
            SELECT data_key
            FROM UserData
            WHERE username = uName
        )
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectBotEntityID (
    IN botName VARCHAR(255)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        data_type = 'b' AND
        data_key = (
            SELECT data_key
            FROM AggregationBotData
            WHERE bot_name = botName
        )
    );
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE selectCreator (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT creator_id AS userID
    FROM Entities
    WHERE id = entID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectCreations (
    IN userID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE creator_id = userID
    ORDER BY
        CASE WHEN isAscOrder THEN id END ASC,
        CASE WHEN NOT isAscOrder THEN id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE selectAncillaryBotData1e2d (
    IN botName BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT data_1 AS data1, data_2 AS data2
    FROM AncillaryBotData1e2d
    WHERE (
        bot_name = botName AND
        ent_id = entID
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE selectAncillaryBotData1e4d (
    IN botName BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT data_1 AS data1, data_2 AS data2, data_3 AS data3, data_4 AS data4
    FROM AncillaryBotData1e4d
    WHERE (
        bot_name = botName AND
        ent_id = entID
    );
END //
DELIMITER ;
