
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;

DROP PROCEDURE insertOrFindEntity;

-- DROP PROCEDURE insertOrFindSimEntity;
-- DROP PROCEDURE insertOrFindAssocEntity;
-- DROP PROCEDURE insertOrFindFormEntity;
-- DROP PROCEDURE insertOrFindPropTagEntity;
-- DROP PROCEDURE insertOrFindStmtEntity;
-- DROP PROCEDURE insertOrFindListEntity;
-- DROP PROCEDURE insertOrFindPropDocEntity;
-- DROP PROCEDURE insertOrFindTextEntity;
-- DROP PROCEDURE insertOrFindBinaryEntity;




DELIMITER //
CREATE PROCEDURE insertOrUpdateRating (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN encodedRatVal SMALLINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE exitCode TINYINT UNSIGNED DEFAULT 0;
    DECLARE ratVal, prevRatVal TINYINT UNSIGNED;
    DECLARE stmtID, stmtDataKey BIGINT UNSIGNED;

    -- Get or create the statement entity.
    INSERT IGNORE INTO StatementData (tag_id, inst_id)
    VALUES (tagID, instID);
    IF (mysql_affected_rows() > 0) THEN
        SELECT LAST_INSERT_ID() INTO stmtDataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('m', stmtDataKey, userID);
        SELECT LAST_INSERT_ID() INTO stmtID;
    ELSE
        SELECT data_key INTO stmtDataKey
        FROM StatementData
        WHERE (
            tag_id = tagID AND
            inst_id = instID
        );
        SELECT id INTO stmtID
        FROM Entities
        WHERE (
            data_type = 'm' AND
            data_key = stmtDataKey
        );
    END IF;

    -- If encodedRatVal > 256, delete the rating stored in SemanticInputs, and
    -- add the rating deletion as a record in RecordedInputs (without deleting
    -- the previous rating there, as this should be done via another procedure).
    IF (encodedRatVal > 256) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = userID AND
            tag_id = tagID AND
            inst_id = instID
        );
        INSERT INTO RecordedInputs (
            user_id,
            stmt_id,
            rat_val
        )
        VALUES (
            userID,
            stmtID,
            300 -- just a number larger than 256 meaning 'deletion.'
        );
    ELSE
        SET ratVal = encodedRatVal;

        -- Get the previous rating value (might be null).
        SELECT rat_val INTO prevRatVal
        FROM SemanticInputs
        WHERE (
            user_id = userID AND
            tag_id = tagID AND
            inst_id = instID
        );
        -- If prevRatVal is the same as before, set exitCode = 1 and do nothing
        -- further.
        IF (prevRatVal <=> ratVal) THEN
            SET exitCode = 1; -- Rating is the same value as before.
        ELSE
            -- Else insert the rating into SemanticInputs, as well as into
            -- RecordedInputs.
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
            INSERT INTO RecordedInputs (
                user_id,
                stmt_id,
                rat_val
            )
            VALUES (
                userID,
                stmtID,
                ratVal
            );
        END IF;
    END IF;


    -- TODO: Run bots on scheduled events instead.
    CALL runBots ();

    SELECT stmtID AS outID, exitCode;
END proc; END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN tmplID BIGINT UNSIGNED,
    IN tmplInput VARCHAR(255),
    IN propStruct TEXT,
    IN dataInput LONGBLOB
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE propStructHash VARCHAR(255) DEFAULT CASE
        WHEN propStruct = "" OR propStruct IS NULL THEN ""
        ELSE SHA2(propStruct, 224)
    END;
    DECLARE dataInputHash VARCHAR(255) DEFAULT CASE
        WHEN dataInput = "" OR dataInput IS NULL THEN ""
        ELSE SHA2(dataInput, 224)
    END;

    IF (propStruct = "") THEN
        SET propStruct = NULL;
    END IF;
    IF (dataInput = "") THEN
        SET dataInput = NULL;
    END IF;

    INSERT IGNORE INTO Entities (
        template_id, template_input, property_struct, property_struct_hash,
        data_input, data_input_hash, creator_id
    )
    VALUES (
        parentId, tmplInput, propStruct, propStructHash,
        dataInput, dataInputHash, userID
    );
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT id INTO outID
        FROM Entities
        WHERE (
            template_id = tmplID AND
            template_input = tmplInput AND
            property_struct_hash = propStructHash AND
            data_input_hash = dataInputHash
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE insertOrFindAssocEntity (
--     IN userID BIGINT UNSIGNED,
--     IN titleID BIGINT UNSIGNED,
--     IN propDocID TEXT
-- )
-- BEGIN proc: BEGIN
--     DECLARE outID, dataKey BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;
--     DECLARE dataType CHAR;

--     -- If titleID is not the ID of a simple entity, return exitCode = 2.
--     SELECT data_type INTO dataType
--     FROM Entities
--     WHERE id = titleID;
--     IF (dataType != 's') THEN
--         SELECT NULL AS outID, 2 AS exitCode; -- failure.
--         LEAVE proc;
--     END IF;

--     -- If propDocID is not the ID of a property document entity, return
--     -- exitCode = 2.
--     SELECT data_type INTO dataType
--     FROM Entities
--     WHERE id = propDocID;
--     IF (dataType != 'd') THEN
--         SELECT NULL AS outID, 2 AS exitCode; -- failure.
--         LEAVE proc;
--     END IF;

--     -- Else continue the same way as the other related procedures.
--     INSERT IGNORE INTO AssocEntityData (title_id, prop_doc_id)
--     VALUES (titleID, propDocID);
--     IF (mysql_affected_rows() > 0) THEN
--         SET exitCode = 0; -- insert.
--         SELECT LAST_INSERT_ID() INTO dataKey;
--         INSERT INTO Entities (data_type, data_key, creator_id)
--         VALUES ('a', dataKey, userID);
--         SELECT LAST_INSERT_ID() INTO outID;
--     ELSE
--         SET exitCode = 1; -- find.
--         SELECT data_key INTO dataKey
--         FROM AssocEntityData
--         WHERE (
--             title_id = titleID AND
--             prop_doc_id = propDocID
--         );
--         SELECT id INTO outID
--         FROM Entities
--         WHERE (
--             data_type = 'a' AND
--             data_key = dataKey
--         );
--     END IF;

--     SELECT outID, exitCode;
-- END proc; END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE insertOrFindFormEntity (
--     IN userID BIGINT UNSIGNED,
--     IN funID BIGINT UNSIGNED,
--     IN inputListID BIGINT UNSIGNED
-- )
-- BEGIN proc: BEGIN
--     DECLARE outID, dataKey BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;
--     DECLARE dataType CHAR;

--     -- If inputListID is not the ID of a list entity, return exitCode = 2.
--     SELECT data_type INTO dataType
--     FROM Entities
--     WHERE id = inputListID;
--     IF (dataType != 'l') THEN
--         SELECT NULL AS outID, 2 AS exitCode; -- failure.
--         LEAVE proc;
--     END IF;

--     INSERT IGNORE INTO FormalEntityData (fun_id, input_list_id)
--     VALUES (funID, inputListID);
--     IF (mysql_affected_rows() > 0) THEN
--         SET exitCode = 0; -- insert.
--         SELECT LAST_INSERT_ID() INTO dataKey;
--         INSERT INTO Entities (data_type, data_key, creator_id)
--         VALUES ('f', dataKey, userID);
--         SELECT LAST_INSERT_ID() INTO outID;
--     ELSE
--         SET exitCode = 1; -- find.
--         SELECT data_key INTO dataKey
--         FROM FormalEntityData
--         WHERE (
--             fun_id = funID AND
--             input_list_id = inputListID
--         );
--         SELECT id INTO outID
--         FROM Entities
--         WHERE (
--             data_type = 'f' AND
--             data_key = dataKey
--         );
--     END IF;

--     SELECT outID, exitCode;
-- END proc; END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE insertOrFindPropTagEntity (
--     IN userID BIGINT UNSIGNED,
--     IN subjID BIGINT UNSIGNED,
--     IN propID BIGINT UNSIGNED
-- )
-- BEGIN
--     DECLARE outID, dataKey BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;

--     INSERT IGNORE INTO PropertyTagData (subj_id, prop_id)
--     VALUES (subjID, propID);
--     IF (mysql_affected_rows() > 0) THEN
--         SET exitCode = 0; -- insert.
--         SELECT LAST_INSERT_ID() INTO dataKey;
--         INSERT INTO Entities (data_type, data_key, creator_id)
--         VALUES ('p', dataKey, userID);
--         SELECT LAST_INSERT_ID() INTO outID;
--     ELSE
--         SET exitCode = 1; -- find.
--         SELECT data_key INTO dataKey
--         FROM PropertyTagData
--         WHERE (
--             subj_id = subjID AND
--             prop_id = propID
--         );
--         SELECT id INTO outID
--         FROM Entities
--         WHERE (
--             data_type = 'p' AND
--             data_key = dataKey
--         );
--     END IF;

--     SELECT outID, exitCode;
-- END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE insertOrFindStmtEntity (
--     IN userID BIGINT UNSIGNED,
--     IN tagID BIGINT UNSIGNED,
--     IN instID BIGINT UNSIGNED
-- )
-- BEGIN
--     DECLARE outID, dataKey BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;

--     INSERT IGNORE INTO StatementData (tag_id, inst_id)
--     VALUES (tagID, instID);
--     IF (mysql_affected_rows() > 0) THEN
--         SET exitCode = 0; -- insert.
--         SELECT LAST_INSERT_ID() INTO dataKey;
--         INSERT INTO Entities (data_type, data_key, creator_id)
--         VALUES ('m', dataKey, userID);
--         SELECT LAST_INSERT_ID() INTO outID;
--     ELSE
--         SET exitCode = 1; -- find.
--         SELECT data_key INTO dataKey
--         FROM StatementData
--         WHERE (
--             tag_id = tagID AND
--             inst_id = instID
--         );
--         SELECT id INTO outID
--         FROM Entities
--         WHERE (
--             data_type = 'm' AND
--             data_key = dataKey
--         );
--     END IF;

--     SELECT outID, exitCode;
-- END //
-- DELIMITER ;





-- DELIMITER //
-- CREATE PROCEDURE insertOrFindListEntity (
--     IN userID BIGINT UNSIGNED,
--     IN listText TEXT
-- )
-- BEGIN
--     DECLARE outID, dataKey BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;
--     DECLARE dataHash VARCHAR(255) DEFAULT (SHA2(listText, 224));

--     INSERT IGNORE INTO PropertyDocData (data_hash, txt)
--     VALUES (dataHash, listText);
--     IF (mysql_affected_rows() > 0) THEN
--         SET exitCode = 0; -- insert.
--         SELECT LAST_INSERT_ID() INTO dataKey;
--         INSERT INTO Entities (data_type, data_key, creator_id)
--         VALUES ('l', dataKey, userID);
--         SELECT LAST_INSERT_ID() INTO outID;
--     ELSE
--         SET exitCode = 1; -- find.
--         SELECT data_key INTO dataKey
--         FROM PropertyDocData
--         WHERE (
--             data_hash = dataHash
--         );
--         SELECT id INTO outID
--         FROM Entities
--         WHERE (
--             data_type = 'l' AND
--             data_key = dataKey
--         );
--     END IF;

--     SELECT outID, exitCode;
-- END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE insertOrFindPropDocEntity (
--     IN userID BIGINT UNSIGNED,
--     IN propDoc TEXT
-- )
-- BEGIN
--     DECLARE outID, dataKey BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;
--     DECLARE dataHash VARCHAR(255) DEFAULT (SHA2(propDoc, 224));

--     INSERT IGNORE INTO PropertyDocData (data_hash, txt)
--     VALUES (dataHash, propDoc);
--     IF (mysql_affected_rows() > 0) THEN
--         SET exitCode = 0; -- insert.
--         SELECT LAST_INSERT_ID() INTO dataKey;
--         INSERT INTO Entities (data_type, data_key, creator_id)
--         VALUES ('d', dataKey, userID);
--         SELECT LAST_INSERT_ID() INTO outID;
--     ELSE
--         SET exitCode = 1; -- find.
--         SELECT data_key INTO dataKey
--         FROM PropertyDocData
--         WHERE (
--             data_hash = dataHash
--         );
--         SELECT id INTO outID
--         FROM Entities
--         WHERE (
--             data_type = 'd' AND
--             data_key = dataKey
--         );
--     END IF;

--     SELECT outID, exitCode;
-- END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE insertOrFindTextEntity (
--     IN userID BIGINT UNSIGNED,
--     IN textStr TEXT
-- )
-- BEGIN
--     DECLARE outID, dataKey BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;
--     DECLARE dataHash VARCHAR(255) DEFAULT (SHA2(textStr, 224));

--     INSERT IGNORE INTO TextData (data_hash, txt)
--     VALUES (dataHash, textStr);
--     IF (mysql_affected_rows() > 0) THEN
--         SET exitCode = 0; -- insert.
--         SELECT LAST_INSERT_ID() INTO dataKey;
--         INSERT INTO Entities (data_type, data_key, creator_id)
--         VALUES ('t', dataKey, userID);
--         SELECT LAST_INSERT_ID() INTO outID;
--     ELSE
--         SET exitCode = 1; -- find.
--         SELECT data_key INTO dataKey
--         FROM TextData
--         WHERE (
--             data_hash = dataHash
--         );
--         SELECT id INTO outID
--         FROM Entities
--         WHERE (
--             data_type = 't' AND
--             data_key = dataKey
--         );
--     END IF;

--     SELECT outID, exitCode;
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE insertOrFindBinaryEntity (
--     IN userID BIGINT UNSIGNED,
--     IN binData LONGBLOB
-- )
-- BEGIN
--     DECLARE outID, dataKey BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;
--     DECLARE dataHash VARCHAR(255) DEFAULT (SHA2(textStr, 224));

--     INSERT IGNORE INTO BinaryData (data_hash, bin)
--     VALUES (dataHash, binData);
--     IF (mysql_affected_rows() > 0) THEN
--         SET exitCode = 0; -- insert.
--         SELECT LAST_INSERT_ID() INTO dataKey;
--         INSERT INTO Entities (data_type, data_key, creator_id)
--         VALUES ('b', dataKey, userID);
--         SELECT LAST_INSERT_ID() INTO outID;
--     ELSE
--         SET exitCode = 1; -- find.
--         SELECT data_key INTO dataKey
--         FROM BinaryData
--         WHERE (
--             data_hash = dataHash
--         );
--         SELECT id INTO outID
--         FROM Entities
--         WHERE (
--             data_type = 'b' AND
--             data_key = dataKey
--         );
--     END IF;

--     SELECT outID, exitCode;
-- END //
-- DELIMITER ;




-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.