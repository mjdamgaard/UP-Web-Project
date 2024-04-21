
SELECT "Query procedures";

DROP PROCEDURE selectInstanceList;
DROP PROCEDURE selectInstanceListSecKey;
DROP PROCEDURE selectRating;

DROP PROCEDURE selectEntityInfo;

DROP PROCEDURE selectText;
DROP PROCEDURE selectUserInfo;
DROP PROCEDURE selectBotInfo;

DROP PROCEDURE selectDefEntityID;
DROP PROCEDURE selectSimEntityID;
DROP PROCEDURE selectFunEntityID;
DROP PROCEDURE selectPropTagEntityID;

DROP PROCEDURE selectTextEntityID;
DROP PROCEDURE selectBinaryEntityID;
DROP PROCEDURE selectUserEntityID;

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
    DECLARE metaType CHAR;
    DECLARE dataKey BIGINT UNSIGNED;

    -- Get the metaType and dataKey.
    SELECT meta_type, data_key INTO metaType, dataKey 
    FROM Entities
    WHERE id = entID;

    IF (metaType = 'd') THEN
        -- Select the returned info.
        SELECT
            metaType,
            title,
            def_id AS defID
        FROM DefinedEntityData
        WHERE data_key = dataKey;

    ELSEIF (metaType = 's') THEN
        -- Select the returned info.
        SELECT
            metaType,
            title
        FROM SimpleEntityData
        WHERE data_key = dataKey;

    ELSEIF (metaType = 'f') THEN
        -- Select the returned info.
        SELECT
            metaType,
            fun_id AS funID,
            input_list AS inputs
        FROM FunctionalEntityData
        WHERE data_key = dataKey;

    ELSEIF (metaType = 'p') THEN
        -- Select the returned info.
        SELECT
            metaType,
            subj_id AS subjID,
            prop_id AS propID
        FROM PropertyTagEntityData
        WHERE data_key = dataKey;

    ELSEIF (metaType = 't') THEN
        -- Select the returned info.
        SELECT
            metaType,
            SUBSTRING(txt, 1, 255) AS textStart,
            LENGTH(txt) AS len,
            data_hash AS dataHash
        FROM TextData
        WHERE data_key = dataKey;

    ELSEIF (metaType = 'b') THEN
        -- Select the returned info.
        SELECT
            metaType,
            LENGTH(bin) AS len,
            data_hash AS dataHash
        FROM BinaryData
        WHERE data_key = dataKey;

    ELSEIF (metaType = 'u') THEN
        -- Select the returned info.
        SELECT
            metaType,
            username
        FROM UserData
        WHERE data_key = dataKey;


    ELSEIF (metaType = 'a') THEN
        -- Select the returned info.
        SELECT
            metaType,
            bot_name AS botName
        FROM AggregationBotData
        WHERE data_key = dataKey;


    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectText (
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED
)
BEGIN
    SELECT
        CASE WHEN maxLen = 0 THEN txt
        ELSE SUBSTRING(txt, 1, maxLen)
        END
    FROM TextData
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
    IN botID BIGINT UNSIGNED
)
BEGIN
    SELECT
        bot_name AS botName,
        bot_description AS botDescription
    FROM AggregationBotData
    WHERE data_key = (
        SELECT data_key
        FROM Entities
        WHERE id = botID
    );
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE selectDefEntityID (
    IN titleStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN defID BIGINT UNSIGNED
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        meta_type = 'd' AND
        data_key = (
            SELECT data_key
            FROM DefinedEntityData
            WHERE title = titleStr AND def_id = defID
        )
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
        meta_type = 's' AND
        data_key = (
            SELECT data_key
            FROM SimpleEntityData
            WHERE title = titleStr
        )
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectFunEntityID (
    IN funID BIGINT UNSIGNED,
    IN inputs VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        meta_type = 'f' AND
        data_key = (
            SELECT data_key
            FROM FunctionalEntityData
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
        meta_type = 'p' AND
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
    IN dataHash VARCHAR(50)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        meta_type = 't' AND
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
    IN dataHash VARCHAR(50)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        meta_type = 'b' AND
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
    IN uName VARCHAR(50)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        meta_type = 'u' AND
        data_key = (
            SELECT data_key
            FROM UserData
            WHERE username = uName
        )
    );
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE selectAncillaryBotData1e2d (
    IN botID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT data_1 AS data1, data_2 AS data2
    FROM AncillaryBotData1e2d
    WHERE (
        bot_id = botID AND
        ent_id = entID
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE selectAncillaryBotData1e4d (
    IN botID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT data_1 AS data1, data_2 AS data2, data_3 AS data3, data_4 AS data4
    FROM AncillaryBotData1e4d
    WHERE (
        bot_id = botID AND
        ent_id = entID
    );
END //
DELIMITER ;
