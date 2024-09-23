
SELECT "Query procedures";

DROP PROCEDURE selectInstanceList;
DROP PROCEDURE selectRating;
DROP PROCEDURE selectRecordedInputs;
DROP PROCEDURE selectRecordedInputsFromSecKey;
DROP PROCEDURE selectRecordedInputsMaxID;

-- TODO: Make proc to query for users who has rated a stmt / scale.

DROP PROCEDURE selectEntityMainData;
DROP PROCEDURE selectEntityFromSecKey;
DROP PROCEDURE selectEntityDescription;
DROP PROCEDURE selectEntityInstanceDescription;
DROP PROCEDURE selectEntityOtherProps;

-- DROP PROCEDURE selectEntityPropStruct;
DROP PROCEDURE selectEntityData;
DROP PROCEDURE selectCreator;
DROP PROCEDURE selectCreations;

DROP PROCEDURE selectUserInfo;
DROP PROCEDURE selectBotInfo;

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
        obj_id AS objID
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
        CASE WHEN isAscOrder THEN obj_id END ASC,
        CASE WHEN NOT isAscOrder THEN obj_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectRating (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN objID BIGINT UNSIGNED
)
BEGIN
    SELECT rat_val AS ratVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        tag_id = tagID AND
        obj_id = objID
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
CREATE PROCEDURE selectEntityMainData (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT
        class_id AS classID,
        template_id AS tmplID,
        template_entity_inputs AS tmplEntInputs,
        template_string_inputs AS tmplStrInputs,
        main_props AS mainProps,
        LENGTH(other_props) AS otherPropsLen
    FROM Entities
    WHERE id = entID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityFromSecKey (
    IN classID BIGINT UNSIGNED,
    IN tmplID BIGINT UNSIGNED,
    IN tmplEntInputs VARCHAR(209),
    IN tmplStrInputs VARCHAR(255),
    IN dataHash VARCHAR(56)
)
BEGIN
    SELECT id AS entID
    FROM Entities
    WHERE (
        class_id = classID AND
        template_id = tmplID AND
        data_hash = dataHash AND
        template_entity_inputs = tmplEntInputs AND
        template_string_inputs = tmplStrInputs
    );
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectEntityDescription (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT own_desc AS ownDesc
    FROM Entities
    WHERE id = entID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectEntityInstanceDescription (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT inst_desc AS instDesc
    FROM Entities
    WHERE id = entID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectEntityOtherProps (
    IN entID BIGINT UNSIGNED
)
BEGIN
    SELECT other_props AS otherProps
    FROM Entities
    WHERE id = entID;
END //
DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE selectEntityPropStruct (
--     IN entID BIGINT UNSIGNED,
--     IN maxLen INT UNSIGNED,
--     IN startPos INT UNSIGNED
-- )
-- BEGIN
--     SET startPos = startPos + 1;
--     SELECT (
--         CASE WHEN maxLen = 0 THEN SUBSTRING(own_prop_struct, startPos)
--         ELSE SUBSTRING(own_prop_struct, startPos, startPos + maxLen)
--         END
--     ) AS ownStruct
--     FROM Entities
--     WHERE id = entID;
-- END //
-- DELIMITER ;



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
