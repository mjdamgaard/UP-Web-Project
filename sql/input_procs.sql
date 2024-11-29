
SELECT "Insert procedures";

DROP PROCEDURE insertOrUpdateScore;
DROP PROCEDURE deleteScore;

DROP PROCEDURE insertOrFindEntity;
DROP PROCEDURE editOrFindEntity;






DELIMITER //
CREATE PROCEDURE insertOrUpdateScore (
    IN userID BIGINT UNSIGNED,
    IN listID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal FLOAT,
    IN scoreWidth FLOAT
)
BEGIN proc: BEGIN
    DECLARE listDef, scaleDef, estDef VARCHAR(700);
    DECLARE listOwnerID, scaleID, estID BIGINT UNSIGNED;
    DECLARE scoreMin, scoreMax FLOAT;

    -- Exit if the subject entity does not exist.
    IF ((SELECT type_ident FROM Entities WHERE id = subjID) IS NULL) THEN
        SELECT subjID AS outID, 1 AS exitCode; -- subject does not exist.
        LEAVE proc;
    END IF;

    -- Parse userID and scaleID from listDef = "'op',userID,scaleID".
    SELECT def_str INTO listDef
    FROM Entities
    WHERE id = listID;
    SET listOwnerID = CAST(
        SUBSTRING_INDEX(listDef, ",", 2) AS UNSIGNED INTEGER
    );
    SET scaleID = CAST(
        SUBSTRING_INDEX(listDef, ",", 3) AS UNSIGNED INTEGER
    );

    -- Exit if the list's owner does not match the input userID.
    IF (listOwnerID != userID) THEN
        SELECT listOwnerID AS outID, 2 AS exitCode; -- user does not own list.
        LEAVE proc;
    END IF;

    -- Parse estID from ScaleDef = "'scale',objID,relID,qualID,estID".
    SELECT def_str INTO scaleDef
    FROM Entities
    WHERE id = scaleID;
    SET estID = CAST(
        SUBSTRING_INDEX(scaleDef, ",", 5) AS UNSIGNED INTEGER
    );

    -- Parse interval limits from estDef = "'est',min,max,step,metricID".
    SELECT def_str INTO estDef
    FROM Entities
    WHERE id = estID;
    SET scoreMin = CAST(
        SUBSTRING_INDEX(estDef, ",", 2) AS FLOAT
    );
    SET scoreMax = CAST(
        SUBSTRING_INDEX(estDef, ",", 3) AS FLOAT
    );

    -- Exit if the score is not within the range.
    IF (score < scoreMin OR score > scoreMax) THEN
        SELECT subjID AS outID, 3 AS exitCode; -- score is not within range.
        LEAVE proc;
    END IF;

    INSERT INTO UserOpinionScores (
        list_id, subj_id, score_val, score_width
    )
    VALUES (
        listID, subjID, scoreVal, scoreWidth
    )
    ON DUPLICATE KEY UPDATE score_val = scoreVal, score_width = scoreWidth;

    SELECT subjID AS outID, 0 AS exitCode; -- insert or update.
END proc; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteScore (
    IN userID BIGINT UNSIGNED,
    IN listID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE listDef VARCHAR(700);
    DECLARE listOwnerID BIGINT UNSIGNED;

    -- Parse userID from listDef = "'op',userID,scaleID".
    SELECT def_str INTO listDef
    FROM Entities
    WHERE id = listID;
    SET listOwnerID = CAST(
        SUBSTRING_INDEX(listDef, ",", 2) AS UNSIGNED INTEGER
    );

    -- Exit if the list's owner does not match the input userID.
    IF (listOwnerID != userID) THEN
        SELECT listOwnerID AS outID, 2 AS exitCode; -- user does not own list.
        LEAVE proc;
    END IF;


    DELETE FROM UserOpinionScores
    WHERE (
        list_id = listID AND
        subj_id = subjID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- delete.
END proc; END //
DELIMITER ;










DELIMITER //
CREATE PROCEDURE insertOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN type CHAR,
    IN defStr TEXT,
    IN isPrivate BOOL,
    IN isEditable BOOL,
    IN isAnonymous BOOL,
    IN insertHash BOOL
)
BEGIN proc: BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;
    DECLARE defHash CHAR(64);

    IF NOT (
        (NOT isPrivate OR userID != 0 AND isEditable) AND
        (userID != 0 OR NOT isEditable) AND
        (NOT insertHash OR NOT isEditable)
    ) THEN
        SET exitCode = 2; -- wrong combination is boolean values.
        SET outID = 0;
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    IF (insertHash) THEN
        SET defHash = SHA2(CONCAT(type, ".", defStr), 256);

        SELECT ent_id INTO outID
        FROM EntityHashes
        WHERE def_hash = defHash;
        IF (outID IS NOT NULL) THEN
            SET exitCode = 1; -- find.
            SELECT outID, exitCode;
            LEAVE proc;
        END IF;
    END IF;

    INSERT INTO Entities (
        creator_id,
        type_ident, def_str, is_private, is_editable
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        type, defStr, isPrivate, isEditable
    );
    SET outID = LAST_INSERT_ID();
    SET exitCode = 0; -- insert.

    IF (insertHash) THEN
        INSERT IGNORE INTO EntityHashes (
            def_hash, ent_id
        )
        VALUES (
            defHash, outID
        );
        IF (ROW_COUNT() <= 0) THEN
            SELECT ent_id INTO outID
            FROM EntityHashes
            WHERE def_hash = defHash;
            IF (outID IS NOT NULL) THEN
                SET exitCode = 1; -- find.
                SELECT outID, exitCode;
                LEAVE proc;
            END IF;
        END IF;
    END IF;

    SELECT outID, exitCode;
END proc; END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE editOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN type CHAR,
    IN defStr TEXT,
    IN isPrivate BOOL,
    IN isEditable BOOL,
    IN isAnonymous BOOL,
    IN insertHash BOOL
)
BEGIN proc: BEGIN
    DECLARE outID, exitCode, prevCreatorID BIGINT UNSIGNED;
    DECLARE prevIsPrivate, prevIsEditable BOOL;
    DECLARE defHash CHAR(64);

    SELECT is_private, is_editable, creator_id
    INTO prevIsPrivate, prevIsEditable, prevCreatorID
    FROM Entities
    WHERE id = entID;
    IF (prevCreatorID != userID OR NOT prevIsEditable) THEN
        SET exitCode = 3; -- entity does not exist, or user does not have the
        -- rights to edit it.
        SET outID = 0;
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    -- Start a transaction and repeat the same select statement, but with a
    -- locking read (i.e. SELECT ... FOR UPDATE).
    START TRANSACTION;
    SELECT is_private, is_editable, creator_id
    INTO prevIsPrivate, prevIsEditable, prevCreatorID
    FROM Entities
    WHERE id = entID
    FOR UPDATE;
    IF NOT (prevCreatorID <=> userID AND prevIsEditable) THEN
        ROLLBACK;
        SET exitCode = 3; -- entity does not exist, or user does not have the
        -- rights to edit it.
        SET outID = 0;
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    IF NOT (
        (NOT isPrivate OR userID != 0 AND isEditable) AND
        (userID != 0 OR NOT isEditable) AND
        (NOT insertHash OR NOT isEditable) AND
        (prevIsPrivate OR NOT isPrivate)
    ) THEN
        ROLLBACK;
        SET exitCode = 2; -- wrong combination is boolean values.
        SET outID = 0;
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;


    IF (insertHash) THEN
        SET defHash = SHA2(CONCAT(type, ".", defStr), 256);

        SELECT ent_id INTO outID
        FROM EntityHashes
        WHERE def_hash = defHash;
        IF (outID IS NOT NULL) THEN
            SET exitCode = 1; -- find.
            SELECT outID, exitCode;
            LEAVE proc;
        END IF;
    END IF;

    UPDATE Entities
    SET
        creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        type_ident = type,
        def_str = defStr,
        is_private = isPrivate,
        is_editable = isEditable
    WHERE id = entID;

    SET outID = entID;
    SET exitCode = 0; -- insert.

    IF (insertHash) THEN
        INSERT IGNORE INTO EntityHashes (
            def_hash, ent_id
        )
        VALUES (
            defHash, outID
        );
        IF (ROW_COUNT() <= 0) THEN
            SELECT ent_id INTO outID
            FROM EntityHashes
            WHERE def_hash = defHash;
            IF (outID IS NOT NULL) THEN
                SET exitCode = 1; -- find.
                SELECT outID, exitCode;
                LEAVE proc;
            END IF;
        END IF;
    END IF;

    COMMIT; 
    SELECT outID, exitCode;
END proc; END //
DELIMITER ;
