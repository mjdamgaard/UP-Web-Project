
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

DROP PROCEDURE putAutoKeyText;
DROP PROCEDURE touchAutoKeyText;
DROP PROCEDURE createAutoKeyText;
DROP PROCEDURE deleteAutoKeyText;
DROP PROCEDURE readAutoKeyText;


DROP PROCEDURE putBBT;
DROP PROCEDURE touchBBT;
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


/* Auto-key text structs (.ats) */

DELIMITER //
CREATE PROCEDURE putAutoKeyText (
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
        DO GET_LOCK(CONCAT("AT.", fileID), 10);

        DELETE FROM AutoKeyTextTables
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;

        DO RELEASE_LOCK(CONCAT("AT.", fileID));
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
CREATE PROCEDURE touchAutoKeyText (
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



DELIMITER //
CREATE PROCEDURE createAutoKeyText (
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

    DO GET_LOCK(CONCAT("AT.", fileID), 10);

    SELECT IFNULL(MAX(text_id), 0) + 1 INTO newTextID
    FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID;

    INSERT INTO AutoKeyTextTables (file_id, text_id, text_data)
    VALUES (fileID, newTextID, textData);

    DO RELEASE_LOCK(CONCAT("AT.", fileID));
    SELECT newTextID;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteAutoKeyText (
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

    DO GET_LOCK(CONCAT("AT.", fileID), 10);

    DELETE FROM AutoKeyTextTables
    WHERE file_id = fileID AND text_id = textID;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("AT.", fileID));
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readAutoKeyText (
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






/* Binary-scored binary-key structs (.bbs) */

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
CREATE PROCEDURE touchBBT (
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

    SELECT toBase64(elem_key), toBase64(elem_score), toBase64(elem_payload)
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

    SELECT toBase64(elem_key), toBase64(elem_score), toBase64(elem_payload)
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