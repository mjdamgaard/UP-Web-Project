
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;
DROP PROCEDURE private_insertOrUpdateRatingAndRunBots;

DROP PROCEDURE insertOrFindSimEntity;
DROP PROCEDURE insertOrFindAssocEntity;
DROP PROCEDURE insertOrFindFormEntity;
DROP PROCEDURE insertOrFindPropTagEntity;
DROP PROCEDURE insertOrFindListEntity;
DROP PROCEDURE insertOrFindPropDocEntity;
DROP PROCEDURE insertOrFindTextEntity;
DROP PROCEDURE insertOrFindBinaryEntity;




DELIMITER //
CREATE PROCEDURE insertOrUpdateRating (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN liveAtTime BIGINT UNSIGNED
)
BEGIN
    DECLARE exitCode TINYINT;
    -- DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();

    IF (liveAtTime > 0) THEN
        INSERT INTO Private_RecentInputs (
            user_id,
            tag_id,
            rat_val,
            inst_id,
            live_at_time
        )
        VALUES (
            userID,
            tagID,
            ratVal,
            instID,
            liveAtTime
        );
    ELSE
        CALL private_insertOrUpdateRatingAndRunBots (
            userID, tagID, instID, ratVal
        );
    END IF;
    SET exitCode = 0; -- Rating insert/update is done or is pending.

    SELECT instID AS outID, exitCode;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE private_insertOrUpdateRatingAndRunBots (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED
)
BEGIN
    DECLARE stmtID BIGINT UNSIGNED;
    DECLARE stmtStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
    DEFAULT CONCAT(
        "#45.", instID, ".", tagID
    );
    DECLARE prevRatVal SMALLINT UNSIGNED;
    DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();


    /* Retrieval of the previous rating the statement entity */

    -- Get the previous rating value (might be null).
    SELECT rat_val INTO prevRatVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        tag_id = tagID AND
        inst_id = instID
    );

    -- Get the statement entity.
    SELECT id INTO stmtID
    FROM Entities
    WHERE (
        def = stmtStr
    );
    -- If it does not exist, insert it and get the ID.
    IF (stmtID IS NULL) THEN
        INSERT IGNORE INTO Entities (def)
        VALUES (stmtStr);
        SELECT LAST_INSERT_ID() INTO stmtID;
        -- If a race condition means that the insert is ignored and stmtID
        -- is null, select the now added (by another process) Statement.
        IF (stmtID IS NULL) THEN
            SELECT id INTO stmtID
            FROM Entities
            WHERE (
                def = stmtStr
            );
        END IF;
        -- TODO: It seems that there still is a risk that stmtID is NULL at
        -- this point for simultaneous requests, despite all this. So
        -- investigate and fix (here and other places) at some point.
    END IF;


    /* Updating the user's own input set */

    -- If the input's rat_val is 0, delete the corresponding SemInput.
    IF (ratVal = 0) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = userID AND
            tag_id = tagID AND
            inst_id = instID
        );
    -- Else update the corresponding SemInput with the new rat_val.
    ELSE
        REPLACE INTO SemanticInputs (
            user_id,
            tag_id,
            rat_val,
            inst_id
        )
        VALUES (
            userID,
            tagID,
            ratVal,
            instID
        );
    END IF;


    /* Updating RecordedInputs */

    REPLACE INTO RecordedInputs (
        changed_at_time,
        user_id,
        tag_id,
        inst_id,
        rat_val
    )
    VALUES (
        now,
        userID,
        tagID,
        instID,
        ratVal
    );


    /* Run procedures to update the various aggregation bots */

    CALL updateStatementUserRaterBot (userID, stmtID, ratVal);
    CALL updateMeanBots (
        userID, tagID, instID, ratVal, prevRatVal, stmtID
    );

END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertOrFindSimEntity (
    IN userID BIGINT UNSIGNED,
    IN titleStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    DECLARE outID, dataKey BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    INSERT IGNORE INTO SimpleEntityData (title)
    VALUES (titleStr);
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO dataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('s', dataKey, userID);
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT data_key INTO dataKey
        FROM SimpleEntityData
        WHERE title = titleStr;
        SELECT id INTO outID
        FROM Entities
        WHERE (
            data_type = 's' AND
            data_key = dataKey
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindAssocEntity (
    IN userID BIGINT UNSIGNED,
    IN titleID BIGINT UNSIGNED,
    IN propDocID TEXT
)
BEGIN proc: BEGIN
    DECLARE outID, dataKey BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE dataType CHAR;

    -- If titleID is not the ID of a simple entity, return exitCode = 2.
    SELECT data_type INTO dataType
    FROM Entities
    WHERE id = titleID;
    IF (dataType != 's') THEN
        SELECT NULL AS outID, 2 AS exitCode; -- failure.
        LEAVE proc;
    END IF;

    -- If propDocID is not the ID of a property document entity, return
    -- exitCode = 2.
    SELECT data_type INTO dataType
    FROM Entities
    WHERE id = propDocID;
    IF (dataType != 'd') THEN
        SELECT NULL AS outID, 2 AS exitCode; -- failure.
        LEAVE proc;
    END IF;

    -- Else continue the same way as the other related procedures.
    INSERT IGNORE INTO AssocEntityData (title_id, prop_doc_id)
    VALUES (titleID, propDocID);
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO dataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('a', dataKey, userID);
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT data_key INTO dataKey
        FROM AssocEntityData
        WHERE (
            title_id = titleID AND
            prop_doc_id = propDocID
        );
        SELECT id INTO outID
        FROM Entities
        WHERE (
            data_type = 'a' AND
            data_key = dataKey
        );
    END IF;

    SELECT outID, exitCode;
END proc; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindFormEntity (
    IN userID BIGINT UNSIGNED,
    IN funID BIGINT UNSIGNED,
    IN inputListID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE outID, dataKey BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE dataType CHAR;

    -- If inputListID is not the ID of a list entity, return exitCode = 2.
    SELECT data_type INTO dataType
    FROM Entities
    WHERE id = inputListID;
    IF (dataType != 'l') THEN
        SELECT NULL AS outID, 2 AS exitCode; -- failure.
        LEAVE proc;
    END IF;

    INSERT IGNORE INTO FormalEntityData (fun_id, input_list_id)
    VALUES (funID, inputListID);
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO dataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('f', dataKey, userID);
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT data_key INTO dataKey
        FROM FormalEntityData
        WHERE (
            fun_id = funID AND
            input_list_id = inputListID
        );
        SELECT id INTO outID
        FROM Entities
        WHERE (
            data_type = 'f' AND
            data_key = dataKey
        );
    END IF;

    SELECT outID, exitCode;
END proc; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindPropTagEntity (
    IN userID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN propID BIGINT UNSIGNED
)
BEGIN
    DECLARE outID, dataKey BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    INSERT IGNORE INTO PropertyTagData (subj_id, prop_id)
    VALUES (subjID, propID);
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO dataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('p', dataKey, userID);
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT data_key INTO dataKey
        FROM PropertyTagData
        WHERE (
            subj_id = subjID AND
            prop_id = propID
        );
        SELECT id INTO outID
        FROM Entities
        WHERE (
            data_type = 'p' AND
            data_key = dataKey
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE insertOrFindListEntity (
    IN userID BIGINT UNSIGNED,
    IN listText TEXT
)
BEGIN
    DECLARE outID, dataKey BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE dataHash VARCHAR(255) DEFAULT (SHA2(listText, 224));

    INSERT IGNORE INTO PropertyDocData (data_hash, txt)
    VALUES (dataHash, listText);
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO dataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('l', dataKey, userID);
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT data_key INTO dataKey
        FROM PropertyDocData
        WHERE (
            data_hash = dataHash
        );
        SELECT id INTO outID
        FROM Entities
        WHERE (
            data_type = 'l' AND
            data_key = dataKey
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindPropDocEntity (
    IN userID BIGINT UNSIGNED,
    IN propDoc TEXT
)
BEGIN
    DECLARE outID, dataKey BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE dataHash VARCHAR(255) DEFAULT (SHA2(propDoc, 224));

    INSERT IGNORE INTO PropertyDocData (data_hash, txt)
    VALUES (dataHash, propDoc);
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO dataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('d', dataKey, userID);
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT data_key INTO dataKey
        FROM PropertyDocData
        WHERE (
            data_hash = dataHash
        );
        SELECT id INTO outID
        FROM Entities
        WHERE (
            data_type = 'd' AND
            data_key = dataKey
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindTextEntity (
    IN userID BIGINT UNSIGNED,
    IN textStr TEXT
)
BEGIN
    DECLARE outID, dataKey BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE dataHash VARCHAR(255) DEFAULT (SHA2(textStr, 224));

    INSERT IGNORE INTO TextData (data_hash, txt)
    VALUES (dataHash, textStr);
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO dataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('t', dataKey, userID);
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT data_key INTO dataKey
        FROM TextData
        WHERE (
            data_hash = dataHash
        );
        SELECT id INTO outID
        FROM Entities
        WHERE (
            data_type = 't' AND
            data_key = dataKey
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindBinaryEntity (
    IN userID BIGINT UNSIGNED,
    IN binData LONGBLOB
)
BEGIN
    DECLARE outID, dataKey BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE dataHash VARCHAR(255) DEFAULT (SHA2(textStr, 224));

    INSERT IGNORE INTO BinaryData (data_hash, bin)
    VALUES (dataHash, binData);
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO dataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('b', dataKey, userID);
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT data_key INTO dataKey
        FROM BinaryData
        WHERE (
            data_hash = dataHash
        );
        SELECT id INTO outID
        FROM Entities
        WHERE (
            data_type = 'b' AND
            data_key = dataKey
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;




-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.