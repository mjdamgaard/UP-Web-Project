
SELECT "Query procedures";

DROP PROCEDURE selectInstanceList;
DROP PROCEDURE selectRating;
DROP PROCEDURE selectRecordedInputs;
DROP PROCEDURE selectRecordedInputsFromSecKey;
DROP PROCEDURE selectRecordedInputsMaxID;

DROP PROCEDURE selectEntity;
DROP PROCEDURE selectEntityFromSecKey;
DROP PROCEDURE selectEntityData;
DROP PROCEDURE selectCreator;
DROP PROCEDURE selectCreations;

-- DROP PROCEDURE selectList;
-- DROP PROCEDURE selectPropDoc;
-- DROP PROCEDURE selectText;
-- DROP PROCEDURE selectBinary;

DROP PROCEDURE selectUserInfo;
DROP PROCEDURE selectBotInfo;

-- DROP PROCEDURE selectAssocEntityID;
-- DROP PROCEDURE selectSimEntityID;
-- DROP PROCEDURE selectFormEntityID;
-- DROP PROCEDURE selectFormEntityIDFromText;
-- DROP PROCEDURE selectPropTagEntityID;
-- DROP PROCEDURE selectStmtEntityID;
-- DROP PROCEDURE selectListEntityID;
-- DROP PROCEDURE selectPropDocEntityID;
-- DROP PROCEDURE selectTextEntityID;
-- DROP PROCEDURE selectBinaryEntityID;
-- DROP PROCEDURE selectUserEntityID;
-- DROP PROCEDURE selectBotEntityID;


DROP PROCEDURE selectAncillaryBotData1e2d;
DROP PROCEDURE selectAncillaryBotData1e4d;




DELIMITER //
CREATE PROCEDURE selectInstanceList (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN ratingRangeLo TINYINT UNSIGNED,
    IN ratingRangeHi TINYINT UNSIGNED,
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




DELIMITER //
CREATE PROCEDURE selectRecordedInputs (
    IN startID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED
)
BEGIN
    SELECT
        user_id AS userID,
        stmt_id AS stmtID,
        rat_val AS ratVal
    FROM RecordedInputs
    WHERE id >= startID
    ORDER BY id ASC
    LIMIT maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectRecordedInputsFromSecKey (
    IN stmtID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        id AS ratID,
        user_id AS userID,
        stmtID,
        rat_val AS ratVal
    FROM RecordedInputs
    WHERE stmt_id = stmtID
    ORDER BY
        CASE WHEN isAscOrder THEN id END ASC,
        CASE WHEN NOT isAscOrder THEN id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectRecordedInputsMaxID ()
BEGIN
    SELECT MAX(id) AS maxID
    FROM RecordedInputs;
END //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE selectEntity (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT
        parent_id AS parentId,
        spec_input AS specInput,
        own_struct AS ownStruct,
        LENGTH(data_input) AS dataLen
    FROM Entities
    WHERE id = entID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityFromSecKey (
    IN parentID BIGINT UNSIGNED,
    IN specInput VARCHAR(255),
    IN ownStructHash VARCHAR(255),
    IN dataInputHash VARCHAR(255)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        parent_id = parentID AND
        spec_input = specInput AND
        own_struct_hash = ownStructHash AND
        data_input_hash = dataInputHash
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityData (
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SET startPos = startPos + 1;
    SELECT (
        CASE WHEN maxLen = 0 THEN SUBSTRING(data_input, startPos)
        ELSE SUBSTRING(data_input, startPos, startPos + maxLen)
        END
    ) AS dataInput
    FROM Entities
    WHERE id = entID;
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





-- DELIMITER //
-- CREATE PROCEDURE selectEntityInfo (
--     IN entID BIGINT UNSIGNED
-- )
-- BEGIN
--     DECLARE dataType CHAR;
--     DECLARE dataKey BIGINT UNSIGNED;
--     DECLARE titleID, propDocID, titleDataKey BIGINT UNSIGNED;
--     DECLARE funID, inputListID, inputListDataKey BIGINT UNSIGNED;

--     -- Get the dataType and dataKey.
--     SELECT data_type, data_key INTO dataType, dataKey 
--     FROM Entities
--     WHERE id = entID;

--     IF (dataType = 's') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             title
--         FROM SimpleEntityData
--         WHERE data_key = dataKey;

--     ELSEIF (dataType = 'a') THEN
--         -- Select the returned info.
--         SELECT title_id, prop_doc_id INTO titleID, propDocID
--         FROM AssocEntityData
--         WHERE data_key = dataKey;
--         SELECT data_key INTO titleDataKey
--         FROM Entities
--         WHERE id = titleID;
--         SELECT
--             dataType,
--             titleID,
--             title,
--             propDocID
--         FROM SimpleEntityData
--         WHERE data_key = titleDataKey;

--     ELSEIF (dataType = 'f') THEN
--         -- Select the returned info.
--         SELECT fun_id, input_list_id INTO funID, inputListID
--         FROM FormalEntityData
--         WHERE data_key = dataKey;
--         SELECT data_key INTO inputListDataKey
--         FROM Entities
--         WHERE id = inputListID;
--         SELECT
--             dataType,
--             funID,
--             inputListID,
--             SUBSTRING(txt, 1, 255) AS textStart,
--             LENGTH(txt) AS len
--         FROM ListData
--         WHERE data_key = inputListDataKey;

--     ELSEIF (dataType = 'p') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             subj_id AS subjID,
--             prop_id AS propID
--         FROM PropertyTagData
--         WHERE data_key = dataKey;

--     ELSEIF (dataType = 'm') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             tag_id AS tagID,
--             inst_id AS instID
--         FROM StatementData
--         WHERE data_key = dataKey;

--     ELSEIF (dataType = 'l') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             SUBSTRING(txt, 1, 255) AS textStart,
--             LENGTH(txt) AS len
--         FROM ListData
--         WHERE data_key = dataKey;

--     ELSEIF (dataType = 'd') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             SUBSTRING(txt, 1, 255) AS textStart,
--             LENGTH(txt) AS len
--         FROM PropertyDocData
--         WHERE data_key = dataKey;

--     ELSEIF (dataType = 't') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             SUBSTRING(txt, 1, 255) AS textStart,
--             LENGTH(txt) AS len,
--             data_hash AS dataHash
--         FROM TextData
--         WHERE data_key = dataKey;

--     ELSEIF (dataType = 'b') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             LENGTH(bin) AS len,
--             data_hash AS dataHash
--         FROM BinaryData
--         WHERE data_key = dataKey;

--     ELSEIF (dataType = 'u') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             username
--         FROM UserData
--         WHERE data_key = dataKey;


--     ELSEIF (dataType = 'n') THEN
--         -- Select the returned info.
--         SELECT
--             dataType,
--             bot_name AS botName
--         FROM NativeBotData
--         WHERE data_key = dataKey;


--     END IF;
-- END //
-- DELIMITER ;




-- DELIMITER //
-- CREATE PROCEDURE selectList (
--     IN entID BIGINT UNSIGNED,
--     IN maxLen INT UNSIGNED,
--     IN startPos INT UNSIGNED
-- )
-- BEGIN
--     SET startPos = startPos + 1;
--     SELECT
--         CASE WHEN maxLen = 0 THEN SUBSTRING(txt, startPos)
--         ELSE SUBSTRING(txt, startPos, startPos + maxLen)
--         END AS text
--     FROM ListData
--     WHERE data_key = (
--         SELECT data_key
--         FROM Entities
--         WHERE id = entID
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectPropDoc (
--     IN entID BIGINT UNSIGNED,
--     IN maxLen INT UNSIGNED,
--     IN startPos INT UNSIGNED
-- )
-- BEGIN
--     SET startPos = startPos + 1;
--     SELECT
--         CASE WHEN maxLen = 0 THEN SUBSTRING(txt, startPos)
--         ELSE SUBSTRING(txt, startPos, startPos + maxLen)
--         END AS text
--     FROM PropertyDocData
--     WHERE data_key = (
--         SELECT data_key
--         FROM Entities
--         WHERE id = entID
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectText (
--     IN entID BIGINT UNSIGNED,
--     IN maxLen INT UNSIGNED,
--     IN startPos INT UNSIGNED
-- )
-- BEGIN
--     SET startPos = startPos + 1;
--     SELECT
--         CASE WHEN maxLen = 0 THEN SUBSTRING(txt, startPos)
--         ELSE SUBSTRING(txt, startPos, startPos + maxLen)
--         END AS text
--     FROM TextData
--     WHERE data_key = (
--         SELECT data_key
--         FROM Entities
--         WHERE id = entID
--     );
-- END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE selectBinary (
--     IN entID BIGINT UNSIGNED
-- )
-- BEGIN
--     SELECT bin
--     FROM BinaryData
--     WHERE data_key = (
--         SELECT data_key
--         FROM Entities
--         WHERE id = entID
--     );
-- END //
-- DELIMITER ;



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
    FROM NativeBotData
    WHERE data_key = (
        SELECT data_key
        FROM Entities
        WHERE id = botName
    );
END //
DELIMITER ;









-- DELIMITER //
-- CREATE PROCEDURE selectSimEntityID (
--     IN titleStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 's' AND
--         data_key = (
--             SELECT data_key
--             FROM SimpleEntityData
--             WHERE title = titleStr
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectAssocEntityID (
--     IN titleID BIGINT UNSIGNED,
--     IN propDocID BIGINT UNSIGNED
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'a' AND
--         data_key = (
--             SELECT data_key
--             FROM DefinedEntityData
--             WHERE title_id = titleID AND prop_doc_id = propDocID
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectFormEntityID (
--     IN funID BIGINT UNSIGNED,
--     IN inputListID BIGINT UNSIGNED
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'f' AND
--         data_key = (
--             SELECT data_key
--             FROM FormalEntityData
--             WHERE fun_id = funID AND input_list_id = inputListID
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectFormEntityIDFromText (
--     IN funID BIGINT UNSIGNED,
--     IN inputListText TEXT
-- )
-- BEGIN
--     DECLARE inputListHash VARCHAR(255) DEFAULT (SHA2(inputListText, 224));
--     DECLARE inputListID BIGINT UNSIGNED;

--     SELECT id INTO inputListID
--     FROM Entities
--     WHERE (
--         data_type = 'l' AND
--         data_key = (
--             SELECT data_key
--             FROM ListData
--             WHERE data_hash = inputListHash
--         )
--     );
--     SELECT id AS entID, inputListID
--     FROM Entities
--     WHERE (
--         data_type = 'f' AND
--         data_key = (
--             SELECT data_key
--             FROM FormalEntityData
--             WHERE fun_id = funID AND input_list_id = inputListID
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectPropTagEntityID (
--     IN subjID BIGINT UNSIGNED,
--     IN propID BIGINT UNSIGNED
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'p' AND
--         data_key = (
--             SELECT data_key
--             FROM PropertyTagData
--             WHERE subj_id = subjID AND prop_id = propID
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectStmtEntityID (
--     IN tagID BIGINT UNSIGNED,
--     IN instID BIGINT UNSIGNED
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'm' AND
--         data_key = (
--             SELECT data_key
--             FROM StatementData
--             WHERE tag_id = tagID AND inst_id = instID
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectListEntityID (
--     IN dataHash VARCHAR(255)
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'l' AND
--         data_key = (
--             SELECT data_key
--             FROM ListData
--             WHERE data_hash = dataHash
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectPropDocEntityID (
--     IN dataHash VARCHAR(255)
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'd' AND
--         data_key = (
--             SELECT data_key
--             FROM PropertyDocData
--             WHERE data_hash = dataHash
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectTextEntityID (
--     IN dataHash VARCHAR(255)
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 't' AND
--         data_key = (
--             SELECT data_key
--             FROM TextData
--             WHERE data_hash = dataHash
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectBinaryEntityID (
--     IN dataHash VARCHAR(255)
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'b' AND
--         data_key = (
--             SELECT data_key
--             FROM BinaryData
--             WHERE data_hash = dataHash
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectUserEntityID (
--     IN uName VARCHAR(255)
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'u' AND
--         data_key = (
--             SELECT data_key
--             FROM UserData
--             WHERE username = uName
--         )
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectBotEntityID (
--     IN botName VARCHAR(255)
-- )
-- BEGIN
--     SELECT id AS entID
--     FROM Entities
--     WHERE (
--         data_type = 'n' AND
--         data_key = (
--             SELECT data_key
--             FROM NativeBotData
--             WHERE bot_name = botName
--         )
--     );
-- END //
-- DELIMITER ;














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
