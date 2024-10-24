
SELECT "Query procedures";

DROP PROCEDURE selectEntityList;
DROP PROCEDURE selectEntityListFromHash;
DROP PROCEDURE selectScore;

-- TODO: Make proc to query for users who has rated a stmt / scale.

DROP PROCEDURE selectEntity;
DROP PROCEDURE selectEntityAsUser;
DROP PROCEDURE selectEntityFromHash;
DROP PROCEDURE selectEntityFromHashAsUser;
DROP PROCEDURE selectCreations;
DROP PROCEDURE selectCreationsAsUser;


DROP PROCEDURE selectUserInfo;
DROP PROCEDURE selectBotInfo;

-- DROP PROCEDURE selectUserEntityID;
-- DROP PROCEDURE selectBotEntityID;


DROP PROCEDURE selectAncillaryBotData1e2d;
DROP PROCEDURE selectAncillaryBotData1e4d;




DELIMITER //
CREATE PROCEDURE selectEntityList (
    IN userID BIGINT UNSIGNED,
    IN scaleID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        score_val AS scoreVal,
        subj_id AS subjID
    FROM Scores
    WHERE (
        user_id = userID AND
        scale_id = scaleID
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
CREATE PROCEDURE selectEntityListFromHash (
    IN userID BIGINT UNSIGNED,
    IN scaleHash CHAR(64),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    DECLARE scaleID BIGINT UNSIGNED;

    SELECT id INTO scaleID
    FROM Entities
    WHERE (
        is_private = 0 AND
        def_hash = scaleHash AND
        creator_id = 0
    );

    SELECT
        score_val AS scoreVal,
        subj_id AS entID
    FROM Scores
    WHERE (
        user_id = userID AND
        scale_id = scaleID
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
CREATE PROCEDURE selectScore (
    IN userID BIGINT UNSIGNED,
    IN scaleID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN
    SELECT score_val AS scoreVal
    FROM Scores
    WHERE (
        user_id = userID AND
        scale_id = scaleID AND
        subj_id = subjID
    );
END //
DELIMITER ;














DELIMITER //
CREATE PROCEDURE selectEntity (
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SELECT
        type_ident AS type,
        (
            CASE WHEN maxLen = 0 THEN SUBSTRING(def_str, startPos + 1)
            ELSE SUBSTRING(def_str, startPos + 1, maxLen)
            END
        ) AS defStr,
        LENGTH(def_str) AS len,
        creator_id AS creatorID
    FROM Entities
    WHERE (
        id = entID AND
        is_private = 0
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityAsUser (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SELECT
        type_ident AS type,
        (
            CASE WHEN maxLen = 0 THEN SUBSTRING(def_str, startPos + 1)
            ELSE SUBSTRING(def_str, startPos + 1, maxLen)
            END
        ) AS defStr,
        LENGTH(def_str) AS len,
        creator_id AS creatorID,
        is_private AS isPrivate
    FROM Entities
    WHERE (
        id = entID AND
        (is_private = 0 OR creator_id = userID)
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityFromHash (
    IN defHash CHAR(64),
    IN creatorID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SELECT
        type_ident AS type,
        (
            CASE WHEN maxLen = 0 THEN SUBSTRING(def_str, startPos + 1)
            ELSE SUBSTRING(def_str, startPos + 1, maxLen)
            END
        ) AS defStr,
        LENGTH(def_str) AS len
    FROM Entities
    WHERE (
        is_private = 0 AND
        def_hash = defHash AND
        creator_id = creatorID
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityFromHashAsUser (
    IN defHash CHAR(64),
    IN userID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SELECT
        type_ident AS type,
        (
            CASE WHEN maxLen = 0 THEN SUBSTRING(def_str, startPos + 1)
            ELSE SUBSTRING(def_str, startPos + 1, maxLen)
            END
        ) AS defStr,
        LENGTH(def_str) AS len
    FROM Entities
    WHERE (
        is_private = 1 AND
        def_hash = defHash AND
        creator_id = userID
    );
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE selectCreations (
    IN creatorID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT creation_ident AS ident, id AS entID
    FROM Entities
    WHERE (
        creator_id = creatorID AND
        is_private = 0
    )
    ORDER BY
        CASE WHEN isAscOrder THEN id END ASC,
        CASE WHEN NOT isAscOrder THEN id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectCreationsAsUser (
    IN userID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT creation_ident AS ident, id AS entID
    FROM Entities
    WHERE (
        creator_id = userID
    )
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
