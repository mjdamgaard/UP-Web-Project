
USE mainDB;

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
DROP PROCEDURE deleteATTList;
DROP PROCEDURE readATTEntry;
DROP PROCEDURE readATTList;

DROP PROCEDURE putBT;
DROP PROCEDURE deleteBT;
DROP PROCEDURE insertBTEntry;
DROP PROCEDURE deleteBTEntry;
DROP PROCEDURE deleteBTList;
DROP PROCEDURE readBTEntry;
DROP PROCEDURE readBTList;

DROP PROCEDURE putCT;
DROP PROCEDURE deleteCT;
DROP PROCEDURE insertCTEntry;
DROP PROCEDURE deleteCTEntry;
DROP PROCEDURE deleteCTList;
DROP PROCEDURE readCTEntry;
DROP PROCEDURE readCTList;

DROP PROCEDURE putBBT;
DROP PROCEDURE deleteBBT;
DROP PROCEDURE insertBBTEntry;
DROP PROCEDURE deleteBBTEntry;
DROP PROCEDURE deleteBBTList;
DROP PROCEDURE readBBTEntry;
DROP PROCEDURE readBBTScoreOrderedList;
DROP PROCEDURE readBBTKeyOrderedList;





CREATE FUNCTION toBase64 (rawStr VARBINARY(255))
RETURNS VARCHAR(340) DETERMINISTIC
RETURN REPLACE(REPLACE(TO_BASE64(rawStr), "+", "-"), "/", "_");

CREATE FUNCTION fromBase64 (encodedStr VARCHAR(340))
RETURNS VARBINARY(255) DETERMINISTIC
RETURN FROM_BASE64(REPLACE(REPLACE(encodedStr, "_", "/"), "-", "+"));




DELIMITER //
CREATE PROCEDURE readHomeDirAdminID (
    IN dirIDHex VARCHAR(16)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);

    SELECT CONV(admin_id, 10, 16) AS adminID
    FROM HomeDirectories FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readHomeDirDescendants (
    IN dirIDHex VARCHAR(16),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);

    SELECT file_path AS filePath
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID
    ORDER BY file_path ASC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE createHomeDir (
    IN adminIDHex VARCHAR(16)
)
proc: BEGIN
    DECLARE adminID BIGINT UNSIGNED DEFAULT CONV((adminIDHex), 16, 10);
    IF (adminID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    INSERT INTO HomeDirectories (admin_id)
    VALUES (adminID);
    SELECT CONV(LAST_INSERT_ID(), 10, 16) AS dirID;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editHomeDir (
    IN dirIDHex VARCHAR(16),
    IN adminIDHex VARCHAR(16)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE adminID BIGINT UNSIGNED DEFAULT CONV((adminIDHex), 16, 10);

    UPDATE HomeDirectories
    SET admin_id = adminID
    WHERE dir_id = dirID;
    SELECT ROW_COUNT() AS wasEdited;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteHomeDir (
    IN dirIDHex VARCHAR(16)
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE firstFileID BIGINT UNSIGNED;

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
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE firstFileID BIGINT UNSIGNED;

    SELECT modified_at, prev_modified_at
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE moveFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN newFilePath VARCHAR(700)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE firstFileID BIGINT UNSIGNED;

    UPDATE IGNORE Files
    SET file_path = newFilePath
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasMoved;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE readTextFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT content_text AS contentText
    FROM TextFiles FORCE INDEX (PRIMARY)
    WHERE file_id = fileID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE putTextFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN contentText TEXT
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
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
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM TextFiles
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;






/* Tables */


DELIMITER //
CREATE PROCEDURE touchTableFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
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
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
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
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;

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
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertATTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN textIDHex  VARCHAR(16),
    IN textData TEXT
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE textID BIGINT UNSIGNED DEFAULT CONV((textIDHex), 16, 10);
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

    IF (NOT textID) THEN
        DO GET_LOCK(CONCAT("ATT", fileID), 10);

        SELECT IFNULL(MAX(text_id), 0) + 1 INTO newTextID
        FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
        WHERE file_id = fileID AND list_id = listID;

        INSERT INTO AutoKeyTextTables (file_id, list_id, text_id, text_data)
        VALUES (fileID, listID, newTextID, textData);

        DO RELEASE_LOCK(CONCAT("ATT", fileID));
        SELECT CONV(newTextID, 10, 16) AS newTextID;
    ELSE
        UPDATE AutoKeyTextTables
        SET text_data = textData
        WHERE file_id = fileID AND list_id = listID AND text_id = textID;

        SELECT ROW_COUNT() AS wasUpdated;
    END IF;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteATTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN textIDHex VARCHAR(16)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE textID BIGINT UNSIGNED DEFAULT CONV((textIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DO GET_LOCK(CONCAT("ATT", fileID), 10);

    DELETE FROM AutoKeyTextTables
    WHERE file_id = fileID AND list_id = listID AND text_id = textID;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("ATT", fileID));
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteATTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loIDHex VARCHAR(16),
    IN hiIDHex VARCHAR(16)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE lo BIGINT UNSIGNED DEFAULT CONV((loIDHex), 16, 10);
    DECLARE hi BIGINT UNSIGNED DEFAULT CONV((hiIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DO GET_LOCK(CONCAT("ATT", fileID), 10);

    DELETE FROM AutoKeyTextTables
    WHERE (
        file_id = fileID AND list_id = listID AND
        text_id >= lo AND (hi IS NULL OR text_id <= hi)
    );

    DO RELEASE_LOCK(CONCAT("ATT", fileID));

    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readATTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN textIDHex VARCHAR(16)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE textID BIGINT UNSIGNED DEFAULT CONV((textIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath ;

    SELECT text_data AS textData
    FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND list_id = listID AND text_id = textID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readATTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loHex VARCHAR(16),
    IN hiHex VARCHAR(16),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE lo BIGINT UNSIGNED DEFAULT CONV((loHex), 16, 10);
    DECLARE hi BIGINT UNSIGNED DEFAULT CONV((hiHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT CONV(text_id, 10, 16) AS textID, text_data AS textData
    FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
    WHERE
        file_id = fileID AND
        list_id = listID AND
        (lo IS NULL OR text_id >= lo) AND
        (hi IS NULL OR text_id <= hi)
    ORDER BY
        CASE WHEN isAscending THEN text_id END ASC,
        CASE WHEN NOT isAscending THEN text_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;













/* Binary key tables (.bt) */

DELIMITER //
CREATE PROCEDURE putBT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
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
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;

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
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340),
    IN elemPayloadBase64 VARCHAR(340),
    IN doIgnore BOOL
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
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

    IF (doIgnore) THEN
        INSERT IGNORE INTO BinaryKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        VALUES (fileID, listID, elemKey, elemPayload);
    ELSE
        INSERT INTO BinaryKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        VALUES (fileID, listID, elemKey, elemPayload)
        ON DUPLICATE KEY UPDATE elem_payload = elemPayload;
    END IF;

    SELECT ROW_COUNT() AS rowCount;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM BinaryKeyTables
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM BinaryKeyTables
    WHERE (
        file_id = fileID AND list_id = listID AND
        elem_key >= lo AND (hi IS NULL OR elem_key <= hi)
    );

    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readBTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT toBase64(elem_key) AS elemKey, toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyTables FORCE INDEX (PRIMARY)
    WHERE
        file_id = fileID AND
        list_id = listID AND
        (lo IS NULL OR elem_key >= lo) AND
        (hi IS NULL OR elem_key <= hi)
    ORDER BY
        CASE WHEN isAscending THEN elem_key END ASC,
        CASE WHEN NOT isAscending THEN elem_key END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;









/* Char key tables (.bt) */

DELIMITER //
CREATE PROCEDURE putCT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
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
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;

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
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertCTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340),
    IN elemPayloadBase64 VARCHAR(340),
    IN doIgnore BOOL
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
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

    IF (doIgnore) THEN
        INSERT IGNORE INTO CharKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        VALUES (fileID, listID, elemKey, elemPayload);
    ELSE
        INSERT INTO CharKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        VALUES (
            fileID, listID, elemKey, elemPayload
        )
        ON DUPLICATE KEY UPDATE elem_payload = elemPayload;
    END IF;

    SELECT ROW_COUNT() AS rowCount;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteCTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM CharKeyTables
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteCTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM CharKeyTables
    WHERE (
        file_id = fileID AND list_id = listID AND
        elem_key >= lo AND (hi IS NULL OR elem_key <= hi)
    );

    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readCTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        toBase64(elem_payload) AS elemPayload
    FROM CharKeyTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readCTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT elem_key AS elemKey, toBase64(elem_payload) AS elemPayload
    FROM CharKeyTables FORCE INDEX (PRIMARY)
    WHERE
        file_id = fileID AND
        list_id = listID AND
        (lo IS NULL OR elem_key >= lo) AND
        (hi IS NULL OR elem_key <= hi)
    ORDER BY
        CASE WHEN isAscending THEN elem_key END ASC,
        CASE WHEN NOT isAscending THEN elem_key END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;
















/* Binary key, binary score tables (.bbt) */

DELIMITER //
CREATE PROCEDURE putBBT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
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
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;

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
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertBBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340),
    IN elemScoreBase64 VARCHAR(340),
    IN elemPayloadBase64 VARCHAR(340),
    IN doIgnore BOOL
)
proc: BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
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

    IF (doIgnore) THEN
        INSERT IGNORE INTO BinaryKeyBinaryScoreTables (
            file_id, list_id, elem_key, elem_score, elem_payload
        )
        VALUES (fileID, listID, elemKey, elemScore, elemPayload);
    ELSE
        INSERT INTO BinaryKeyBinaryScoreTables (
            file_id, list_id, elem_key, elem_score, elem_payload
        )
        VALUES (
            fileID, listID, elemKey, elemScore, elemPayload
        )
        ON DUPLICATE KEY UPDATE
            elem_score = elemScore,
            elem_payload = elemPayload;
    END IF;


    SELECT ROW_COUNT() AS rowCount;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM BinaryKeyBinaryScoreTables
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBBTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM BinaryKeyBinaryScoreTables
    WHERE (
        file_id = fileID AND list_id = listID AND
        elem_key >= lo AND (hi IS NULL OR elem_key <= hi)
    );

    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN elemKeyBase64 VARCHAR(340)
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE elemKey VARBINARY(255) DEFAULT fromBase64(elemKeyBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        toBase64(elem_score) AS elemScore,
        toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyBinaryScoreTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBBTScoreOrderedList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);
    SET numOffset = IFNULL(numOffset, 0);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        toBase64(elem_key) AS elemKey, toBase64(elem_score) AS elemScore,
        toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyBinaryScoreTables FORCE INDEX (sec_idx)
    WHERE
        file_id = fileID AND
        list_id = listID AND
        (lo IS NULL OR elem_score >= lo) AND
        (hi IS NULL OR elem_score <= hi)
    ORDER BY
        CASE WHEN isAscending THEN elem_score END ASC,
        CASE WHEN NOT isAscending THEN elem_score END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBBTKeyOrderedList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDBase64 VARCHAR(340),
    IN loBase64 VARCHAR(340),
    IN hiBase64 VARCHAR(340),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT CONV((dirIDHex), 16, 10);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT fromBase64(listIDBase64);
    DECLARE lo VARBINARY(255) DEFAULT fromBase64(loBase64);
    DECLARE hi VARBINARY(255) DEFAULT fromBase64(hiBase64);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        toBase64(elem_key) AS elemKey, toBase64(elem_score) AS elemScore,
        toBase64(elem_payload) AS elemPayload
    FROM BinaryKeyBinaryScoreTables FORCE INDEX (PRIMARY)
    WHERE
        file_id = fileID AND
        list_id = listID AND
        (lo IS NULL OR elem_key >= lo) AND
        (hi IS NULL OR elem_key <= hi)
    ORDER BY
        CASE WHEN isAscending THEN elem_key END ASC,
        CASE WHEN NOT isAscending THEN elem_key END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;