
DROP FUNCTION toBase64;
DROP FUNCTION fromBase64;

DROP PROCEDURE readHomeDirAdminID;
DROP PROCEDURE readHomeDirDescendants;
DROP PROCEDURE createHomeDir;
DROP PROCEDURE editHomeDir;
DROP PROCEDURE deleteHomeDir;
DROP PROCEDURE readFileMetaData;
DROP PROCEDURE moveFile;

DROP PROCEDURE readTextFile;
DROP PROCEDURE putTextFile;
DROP PROCEDURE deleteTextFile;


DROP PROCEDURE touchTableFile;

DROP PROCEDURE putATT;
DROP PROCEDURE deleteATT;
DROP PROCEDURE insertATTEntry;
DROP PROCEDURE deleteATTEntry;
DROP PROCEDURE readATTEntry;
DROP PROCEDURE readATTList;

DROP PROCEDURE putBT;
DROP PROCEDURE deleteBT;
DROP PROCEDURE insertBTEntry;
DROP PROCEDURE deleteBTEntry;
DROP PROCEDURE readBTEntry;
DROP PROCEDURE readBTList;

DROP PROCEDURE putCT;
DROP PROCEDURE deleteCT;
DROP PROCEDURE insertCTEntry;
DROP PROCEDURE deleteCTEntry;
DROP PROCEDURE readCTEntry;
DROP PROCEDURE readCTList;

DROP PROCEDURE putBBT;
DROP PROCEDURE deleteBBT;
DROP PROCEDURE insertBBTEntry;
DROP PROCEDURE deleteBBTEntry;
DROP PROCEDURE readBBTEntry;
DROP PROCEDURE readBBTScoreOrderedList;
DROP PROCEDURE readBBTKeyOrderedList;





CREATE FUNCTION toBase64 (rawStr VARBINARY(255))
RETURNS VARCHAR(340) DETERMINISTIC
RETURN REPLACE(REPLACE(TO_BASE64(rawStr), "+", "-"), "/", "_");

CREATE FUNCTION fromBase64 (encodedStr VARCHAR(340))
RETURNS VARBINARY(255) DETERMINISTIC
RETURN fromBase64(REPLACE(REPLACE(encodedStr, "_", "/"), "-", "+"));




DELIMITER //
CREATE PROCEDURE readHomeDirAdminID (
    IN dirID BIGINT UNSIGNED
)
proc: BEGIN
    IF (dirID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT admin_id AS adminID
    FROM HomeDirectories FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readHomeDirDescendants (
    IN dirID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
proc: BEGIN
    IF (dirID IS NULL OR maxNum IS NULL OR numOffset IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_path AS filePath
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID
    ORDER BY file_path ASC
    LIMIT numOffset, maxNum;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE createHomeDir (
    IN adminID BIGINT UNSIGNED
)
proc: BEGIN
    IF (adminID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    INSERT INTO HomeDirectories (admin_id)
    VALUES (adminID);
    SELECT LAST_INSERT_ID() AS dirID;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editHomeDir (
    IN dirID BIGINT UNSIGNED,
    IN adminID BIGINT UNSIGNED
)
proc: BEGIN
    IF (dirID IS NULL OR adminID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    UPDATE HomeDirectories
    SET admin_id = adminID
    WHERE dir_id = dirID;
    SELECT ROW_COUNT() AS wasEdited;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteHomeDir (
    IN dirID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE firstFileID BIGINT UNSIGNED;
    IF (dirID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO firstFileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID
    ORDER BY file_path
    LIMIT 1;
    IF (firstFileID IS NOT NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    DELETE FROM HomeDirectories
    WHERE dir_id = dirID;
    SELECT ROW_COUNT() AS wasDeleted;
END proc //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE readFileMetaData (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE firstFileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT modified_at, prev_modified_at
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE moveFile (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN newFilePath VARCHAR(700)
)
proc: BEGIN
    DECLARE firstFileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL OR newFilePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    UPDATE IGNORE Files
    SET file_path = newFilePath
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasMoved;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE readTextFile (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT content_text AS contentText
    FROM TextFiles FORCE INDEX (PRIMARY)
    WHERE file_id = fileID;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE putTextFile (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN contentText TEXT
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL OR contentText IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        UPDATE TextFiles
        SET content_text = contentText
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;
    ELSE
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);
        INSERT INTO TextFiles (file_id, content_text)
        VALUES (fileID, contentText);
        SELECT 1 AS wasCreated;
    END IF;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteTextFile (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM TextFiles
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;
END proc //
DELIMITER ;






/* Tables */


DELIMITER //
CREATE PROCEDURE touchTableFile (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        SELECT 0 AS wasCreated;
    ELSE
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);
        SELECT 1 AS wasCreated;
    END IF;
END proc //
DELIMITER ;





/* Auto-key text tables (.att) */

DELIMITER //
CREATE PROCEDURE putATT (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        DO GET_LOCK(CONCAT("ATT.", fileID), 10);

        DELETE FROM AutoKeyTextTables
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;

        DO RELEASE_LOCK(CONCAT("ATT.", fileID));
    ELSE
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);
        SELECT 1 AS wasCreated;
    END IF;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteATT (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DO GET_LOCK(CONCAT("ATT.", fileID), 10);

    DELETE FROM AutoKeyTextTables
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("ATT.", fileID));
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertATTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN textData TEXT
)
proc: BEGIN
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL OR textData IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DO GET_LOCK(CONCAT("ATT", fileID), 10);

    SELECT IFNULL(MAX(text_id), 0) + 1 INTO newTextID
    FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID;

    INSERT INTO AutoKeyTextTables (file_id, text_id, text_data)
    VALUES (fileID, newTextID, textData);

    DO RELEASE_LOCK(CONCAT("ATT", fileID));
    SELECT newTextID;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteATTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN textID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL OR textID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DO GET_LOCK(CONCAT("ATT", fileID), 10);

    DELETE FROM AutoKeyTextTables
    WHERE file_id = fileID AND text_id = textID;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("ATT", fileID));
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readATTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN textID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL OR textID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT text_data AS textData
    FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND text_id = textID;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readATTList (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN lo BIGINT UNSIGNED,
    IN hi BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (
        dirID IS NULL OR filePath IS NULL OR
        maxNum IS NULL OR numOffset IS NULL OR isAscending IS NULL
    ) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT text_id AS textID, text_data AS textData
    FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
    WHERE
        file_id = fileID AND
        (lo IS NULL OR text_id >= lo) AND
        (hi IS NULL OR text_id <= hi)
    ORDER BY
        CASE WHEN isAscending THEN text_id END ASC,
        CASE WHEN NOT isAscending THEN text_id END DESC
    LIMIT numOffset, maxNum;
END proc //
DELIMITER ;













/* Binary key tables (.bt) */

DELIMITER //
CREATE PROCEDURE putBT (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        DO GET_LOCK(CONCAT("BT.", fileID), 10);

        DELETE FROM BinaryKeyTables
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;

        DO RELEASE_LOCK(CONCAT("BT.", fileID));
    ELSE
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);
        SELECT 1 AS wasCreated;
    END IF;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteBT (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DO GET_LOCK(CONCAT("BT.", fileID), 10);

    DELETE FROM BinaryKeyTables
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("BT.", fileID));
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertBTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340),
    IN elemPayloadBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    DECLARE elemPayload VARBINARY(255) DEFAULT fromBase64(elemPayloadBase64);
    IF (
        dirID IS NULL OR filePath IS NULL OR
        elemKey IS NULL OR elemPayload IS NULL
    ) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    INSERT INTO BinaryKeyTables (
        file_id, elem_key, elem_payload
    )
    VALUES (
        fileID, elemKey, elemPayload
    )
    ON DUPLICATE KEY UPDATE
        elem_payload = elemPayload;

    SELECT ROW_COUNT() AS rowCount;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    IF (dirID IS NULL OR filePath IS NULL OR elemKey IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM BinaryKeyTables
    WHERE file_id = fileID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readBTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    IF (dirID IS NULL OR filePath IS NULL OR elemKey IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    SELECT
        toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND elem_key = elemKey;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readBTList (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);
    IF (
        dirID IS NULL OR filePath IS NULL OR
        maxNum IS NULL OR numOffset IS NULL OR isAscending IS NULL
    ) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT toBase64(elem_key) AS elemKey, toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyTables FORCE INDEX (PRIMARY)
    WHERE
        file_id = fileID AND
        (lo IS NULL OR elem_key >= lo) AND
        (hi IS NULL OR elem_key <= hi)
    ORDER BY
        CASE WHEN isAscending THEN elem_key END ASC,
        CASE WHEN NOT isAscending THEN elem_key END DESC
    LIMIT numOffset, maxNum;
END proc //
DELIMITER ;









/* Char key tables (.bt) */

DELIMITER //
CREATE PROCEDURE putCT (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        DO GET_LOCK(CONCAT("CT.", fileID), 10);

        DELETE FROM CharKeyTables
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;

        DO RELEASE_LOCK(CONCAT("CT.", fileID));
    ELSE
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);
        SELECT 1 AS wasCreated;
    END IF;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteCT (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DO GET_LOCK(CONCAT("CT.", fileID), 10);

    DELETE FROM CharKeyTables
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("CT.", fileID));
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertCTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340),
    IN elemPayloadBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    DECLARE elemPayload VARBINARY(255) DEFAULT fromBase64(elemPayloadBase64);
    IF (
        dirID IS NULL OR filePath IS NULL OR
        elemKey IS NULL OR elemPayload IS NULL
    ) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    INSERT INTO CharKeyTables (
        file_id, elem_key, elem_payload
    )
    VALUES (
        fileID, elemKey, elemPayload
    )
    ON DUPLICATE KEY UPDATE
        elem_payload = elemPayload;

    SELECT ROW_COUNT() AS rowCount;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteCTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    IF (dirID IS NULL OR filePath IS NULL OR elemKey IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM CharKeyTables
    WHERE file_id = fileID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readCTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    IF (dirID IS NULL OR filePath IS NULL OR elemKey IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    SELECT
        toBase64(elem_payload) AS elemPayload
    FROM CharKeyTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND elem_key = elemKey;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readCTList (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN lo VARCHAR(255),
    IN hi VARCHAR(255),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (
        dirID IS NULL OR filePath IS NULL OR
        maxNum IS NULL OR numOffset IS NULL OR isAscending IS NULL
    ) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT elem_key AS elemKey, toBase64(elem_payload) AS elemPayload
    FROM CharKeyTables FORCE INDEX (PRIMARY)
    WHERE
        file_id = fileID AND
        (lo IS NULL OR elem_key >= lo) AND
        (hi IS NULL OR elem_key <= hi)
    ORDER BY
        CASE WHEN isAscending THEN elem_key END ASC,
        CASE WHEN NOT isAscending THEN elem_key END DESC
    LIMIT numOffset, maxNum;
END proc //
DELIMITER ;
















/* Binary key, binary score tables (.bbt) */

DELIMITER //
CREATE PROCEDURE putBBT (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        DO GET_LOCK(CONCAT("BBT.", fileID), 10);

        DELETE FROM BinaryKeyBinaryScoreTables
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;

        DO RELEASE_LOCK(CONCAT("BBT.", fileID));
    ELSE
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);
        SELECT 1 AS wasCreated;
    END IF;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteBBT (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DO GET_LOCK(CONCAT("BBT.", fileID), 10);

    DELETE FROM BinaryKeyBinaryScoreTables
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("BBT.", fileID));
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertBBTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340),
    IN elemScoreBase64 VARCHAR(340),
    IN elemPayloadBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    DECLARE elemScore VARBINARY(255) DEFAULT fromBase64(elemScoreBase64);
    DECLARE elemPayload VARBINARY(255) DEFAULT fromBase64(elemPayloadBase64);
    IF (
        dirID IS NULL OR filePath IS NULL OR
        elemKey IS NULL OR elemScore IS NULL OR elemPayload IS NULL
    ) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    INSERT INTO BinaryKeyBinaryScoreTables (
        file_id, elem_key, elem_score, elem_payload
    )
    VALUES (
        fileID, elemKey, elemScore, elemPayload
    )
    ON DUPLICATE KEY UPDATE
        elem_score = elemScore,
        elem_payload = elemPayload;

    SELECT ROW_COUNT() AS rowCount;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBBTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    IF (dirID IS NULL OR filePath IS NULL OR elemKey IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM BinaryKeyBinaryScoreTables
    WHERE file_id = fileID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readBBTEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);
    IF (dirID IS NULL OR filePath IS NULL OR elemKey IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    SELECT
        toBase64(elem_score) AS elemScore,
        toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyBinaryScoreTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND elem_key = elemKey;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBBTScoreOrderedList (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);
    IF (
        dirID IS NULL OR filePath IS NULL OR
        maxNum IS NULL OR numOffset IS NULL OR isAscending IS NULL
    ) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        toBase64(elem_key) AS elemKey, toBase64(elem_score) AS elemScore,
        toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyBinaryScoreTables FORCE INDEX (sec_idx)
    WHERE
        file_id = fileID AND
        (lo IS NULL OR elem_score >= lo) AND
        (hi IS NULL OR elem_score <= hi)
    ORDER BY
        CASE WHEN isAscending THEN elem_score END ASC,
        CASE WHEN NOT isAscending THEN elem_score END DESC
    LIMIT numOffset, maxNum;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBBTKeyOrderedList (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
proc: BEGIN
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);
    IF (
        dirID IS NULL OR filePath IS NULL OR
        maxNum IS NULL OR numOffset IS NULL OR isAscending IS NULL
    ) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        toBase64(elem_key) AS elemKey, toBase64(elem_score) AS elemScore,
        toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyBinaryScoreTables FORCE INDEX (PRIMARY)
    WHERE
        file_id = fileID AND
        (lo IS NULL OR elem_key >= lo) AND
        (hi IS NULL OR elem_key <= hi)
    ORDER BY
        CASE WHEN isAscending THEN elem_key END ASC,
        CASE WHEN NOT isAscending THEN elem_key END DESC
    LIMIT numOffset, maxNum;
END proc //
DELIMITER ;