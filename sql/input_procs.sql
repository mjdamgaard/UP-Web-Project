
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;

DROP PROCEDURE insertOrFindEntity;




DELIMITER //
CREATE PROCEDURE insertOrUpdateRating (
    IN userID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN objID BIGINT UNSIGNED,
    IN encodedRatVal SMALLINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE exitCode TINYINT UNSIGNED DEFAULT 0;
    DECLARE ratVal, prevRatVal TINYINT UNSIGNED;
    DECLARE stmtID, stmtDataKey BIGINT UNSIGNED;

    -- Get or create the statement entity.
    INSERT IGNORE INTO StatementData (tag_id, obj_id)
    VALUES (tagID, objID);
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
            obj_id = objID
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
            obj_id = objID
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
            obj_id = objID
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
                obj_id
            )
            VALUES (
                userID,
                tagID,
                ratVal,
                objID
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
    IN classID BIGINT UNSIGNED,
    IN tmplID BIGINT UNSIGNED,
    IN tmplEntInputs VARCHAR(209),
    IN tmplStrInputs VARCHAR(255),
    IN ownStruct TEXT(1000),
    IN dataInput LONGBLOB
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE ownStructHash VARCHAR(56) DEFAULT CASE
        WHEN ownStruct = "" OR ownStruct IS NULL THEN ""
        ELSE SHA2(ownStruct, 224)
    END;
    DECLARE dataInputHash VARCHAR(56) DEFAULT CASE
        WHEN dataInput = "" OR dataInput IS NULL THEN ""
        ELSE SHA2(dataInput, 224)
    END;

    IF (ownStruct = "") THEN
        SET ownStruct = NULL;
    END IF;
    IF (dataInput = "") THEN
        SET dataInput = NULL;
    END IF;

    INSERT IGNORE INTO Entities (
        class_id, template_id, template_entity_inputs, template_string_inputs,
        own_prop_struct, own_prop_struct_hash, data_input, data_input_hash,
        creator_id
    )
    VALUES (
        classID, tmplID, tmplEntInputs, tmplStrInputs,
        ownStruct, ownStructHash, dataInput, dataInputHash, userID
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
            template_entity_inputs = tmplEntInputs AND
            own_prop_struct_hash = ownStructHash AND
            data_input_hash = dataInputHash
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;







-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.