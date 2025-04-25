
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

DROP PROCEDURE putAutoKeyTextStruct;
DROP PROCEDURE touchAutoKeyTextStruct;
DROP PROCEDURE deleteAutoKeyTextStruct;
DROP PROCEDURE createAutoKeyText;
DROP PROCEDURE deleteAutoKeyText;
DROP PROCEDURE readAutoKeyText;


DROP PROCEDURE putBinScoredBinKeyStruct;
DROP PROCEDURE touchBinScoredBinKeyStruct;
DROP PROCEDURE deleteBinScoredBinKeyStruct;
DROP PROCEDURE insertBinScoredBinKeyStructEntry;
DROP PROCEDURE deleteBinScoredBinKeyStructEntry;
DROP PROCEDURE readBinScoredBinKeyStructEntry;
DROP PROCEDURE readBinScoredBinKeyStructList;
DROP PROCEDURE readBinScoredBinKeyStructKeyOrderedList;




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
    FROM TextFileContents FORCE INDEX (PRIMARY)
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
        UPDATE TextFileContents
        SET content_text = contentText
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;
    ELSE
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);
        INSERT INTO TextFileContents (file_id, content_text)
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

    DELETE FROM TextFileContents
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;
END proc //
DELIMITER ;






/* Structs */


/* Auto-key text structs (.ats) */

DELIMITER //
CREATE PROCEDURE putAutoKeyTextStruct (
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
        DO GET_LOCK(CONCAT("AutoKeyTextStruct.", fileID), 10);

        DELETE FROM AutoKeyTextStructs
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;

        DO RELEASE_LOCK(CONCAT("AutoKeyTextStruct.", fileID));
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
CREATE PROCEDURE touchAutoKeyTextStruct (
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
CREATE PROCEDURE deleteAutoKeyTextStruct (
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

    DO GET_LOCK(CONCAT("AutoKeyTextStruct.", fileID), 10);

    DELETE FROM AutoKeyTextStructs
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("AutoKeyTextStruct.", fileID));
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

    DO GET_LOCK(CONCAT("AutoKeyTextStruct.", fileID), 10);

    SELECT IFNULL(MAX(text_id), 0) + 1 INTO newTextID
    FROM AutoKeyTextStructs FORCE INDEX (PRIMARY)
    WHERE file_id = fileID;

    INSERT INTO AutoKeyTextStructs (file_id, text_id, text_data)
    VALUES (fileID, newTextID, textData);

    DO RELEASE_LOCK(CONCAT("AutoKeyTextStruct.", fileID));
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

    DO GET_LOCK(CONCAT("AutoKeyTextStruct.", fileID), 10);

    DELETE FROM AutoKeyTextStructs
    WHERE file_id = fileID AND text_id = textID;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("AutoKeyTextStruct.", fileID));
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
    FROM AutoKeyTextStructs FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND text_id = textID;
END proc //
DELIMITER ;






/* Binary-scored binary-key structs (.bbs) */

DELIMITER //
CREATE PROCEDURE putBinScoredBinKeyStruct (
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
        DO GET_LOCK(CONCAT("BinScoredBinKeyStruct.", fileID), 10);

        DELETE FROM BinScoredBinKeyStructs
        WHERE file_id = fileID;
        SELECT 0 AS wasCreated;

        DO RELEASE_LOCK(CONCAT("BinScoredBinKeyStruct.", fileID));
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
CREATE PROCEDURE touchBinScoredBinKeyStruct (
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
CREATE PROCEDURE deleteBinScoredBinKeyStruct (
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

    DO GET_LOCK(CONCAT("BinScoredBinKeyStruct.", fileID), 10);

    DELETE FROM BinScoredBinKeyStructs
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("BinScoredBinKeyStruct.", fileID));
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertBinScoredBinKeyStructEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340),
    IN elemScoreBase64 VARCHAR(340),
    IN elemPayloadBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT FROM_BASE64(elemKeyBase64);
    DECLARE elemScore VARBINARY(255) DEFAULT FROM_BASE64(elemScoreBase64);
    DECLARE elemPayload VARBINARY(255) DEFAULT FROM_BASE64(elemPayloadBase64);
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

    INSERT INTO BinScoredBinKeyStructs (
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
CREATE PROCEDURE deleteBinScoredBinKeyStructEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT FROM_BASE64(elemKeyBase64);
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

    DELETE FROM BinScoredBinKeyStructs
    WHERE file_id = fileID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readBinScoredBinKeyStructEntry (
    IN dirID BIGINT UNSIGNED,
    IN filePath VARCHAR(700),
    IN elemKeyBase64 VARCHAR(340)
)
proc: BEGIN
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE elemKey VARBINARY(255) DEFAULT FROM_BASE64(elemKeyBase64);
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
        TO_BASE64(elem_score) AS elemScore,
        TO_BASE64(elem_payload) AS elemPayload
    FROM BinScoredBinKeyStructs FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND elem_key = elemKey;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBinScoredBinKeyStructList (
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
    DECLARE lo VARBINARY(255) DEFAULT FROM_BASE64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT FROM_BASE64(hiBase64);
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

    SELECT TO_BASE64(elem_key), TO_BASE64(elem_score), TO_BASE64(elem_payload)
    FROM BinScoredBinKeyStructs FORCE INDEX (sec_idx)
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
CREATE PROCEDURE readBinScoredBinKeyStructKeyOrderedList (
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
    DECLARE lo VARBINARY(255) DEFAULT FROM_BASE64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT FROM_BASE64(hiBase64);
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

    SELECT TO_BASE64(elem_key), TO_BASE64(elem_score), TO_BASE64(elem_payload)
    FROM BinScoredBinKeyStructs FORCE INDEX (PRIMARY)
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