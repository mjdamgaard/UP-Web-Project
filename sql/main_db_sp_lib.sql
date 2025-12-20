
-- USE mainDB;

DROP FUNCTION binToHex;
DROP FUNCTION hexToBin;
DROP FUNCTION numToHex;
DROP FUNCTION hexToNum;

DROP PROCEDURE readHomeDirAdminID;
DROP PROCEDURE readHomeDirCreatorID;
DROP PROCEDURE readDirectoriesOfAdmin;
DROP PROCEDURE readDirectoriesOfCreator;
DROP PROCEDURE readAllHomeDirDescendants;
DROP PROCEDURE createHomeDir;
DROP PROCEDURE editHomeDir;
DROP PROCEDURE deleteHomeDir;
DROP PROCEDURE readFileMetaData;
DROP PROCEDURE moveFile;

DROP PROCEDURE selectSMGas;
DROP PROCEDURE updateSMGas;

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
DROP PROCEDURE insertATTList;

DROP PROCEDURE putBT;
DROP PROCEDURE deleteBT;
DROP PROCEDURE insertBTEntry;
DROP PROCEDURE deleteBTEntry;
DROP PROCEDURE deleteBTList;
DROP PROCEDURE readBTEntry;
DROP PROCEDURE readBTList;
DROP PROCEDURE insertBTList;

DROP PROCEDURE putCT;
DROP PROCEDURE deleteCT;
DROP PROCEDURE insertCTEntry;
DROP PROCEDURE deleteCTEntry;
DROP PROCEDURE deleteCTList;
DROP PROCEDURE readCTEntry;
DROP PROCEDURE readCTList;
DROP PROCEDURE insertCTList;

DROP PROCEDURE putBBT;
DROP PROCEDURE deleteBBT;
DROP PROCEDURE insertBBTEntry;
DROP PROCEDURE deleteBBTEntry;
DROP PROCEDURE deleteBBTList;
DROP PROCEDURE readBBTEntry;
DROP PROCEDURE readBBTScoreOrderedList;
DROP PROCEDURE readBBTKeyOrderedList;
DROP PROCEDURE insertBBTList;







CREATE FUNCTION binToHex (rawStr VARBINARY(255))
RETURNS VARCHAR(510) DETERMINISTIC
RETURN LOWER(HEX(rawStr));

CREATE FUNCTION hexToBin (encodedStr VARCHAR(510))
RETURNS VARBINARY(255) DETERMINISTIC
RETURN UNHEX(encodedStr);


CREATE FUNCTION numToHex (num BIGINT UNSIGNED)
RETURNS VARCHAR(16) DETERMINISTIC
RETURN LOWER(CONV(num, 10, 16));

CREATE FUNCTION hexToNum (hexStr VARCHAR(16))
RETURNS BIGINT UNSIGNED DETERMINISTIC
RETURN CONV(hexStr, 16, 10);



DELIMITER //
CREATE PROCEDURE readHomeDirAdminID (
    IN dirIDHex VARCHAR(16)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);

    SELECT numToHex(admin_id) AS adminID
    FROM HomeDirectories FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readHomeDirCreatorID (
    IN dirIDHex VARCHAR(16)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);

    SELECT numToHex(creator_id) AS creatorID
    FROM HomeDirectories FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readDirectoriesOfAdmin (
    IN adminIDHex VARCHAR(16),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE adminID BIGINT UNSIGNED DEFAULT hexToNum(adminIDHex);

    SELECT numToHex(dir_id) AS dirID
    FROM HomeDirectories FORCE INDEX (admin_idx)
    WHERE admin_id <=> adminID
    ORDER BY dir_id ASC
    LIMIT numOffset, maxNum;
END; END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE readDirectoriesOfCreator (
    IN creatorIDHex VARCHAR(16),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE creatorID BIGINT UNSIGNED DEFAULT hexToNum(creatorIDHex);

    SELECT numToHex(dir_id) AS dirID
    FROM HomeDirectories FORCE INDEX (creator_idx)
    WHERE creator_id <=> creatorID
    ORDER BY dir_id ASC
    LIMIT numOffset, maxNum;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readAllHomeDirDescendants (
    IN dirIDHex VARCHAR(16),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);

    SELECT file_path AS filePath
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID
    ORDER BY file_path ASC
    LIMIT numOffset, maxNum;
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE createHomeDir (
    IN adminIDHex VARCHAR(16)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE adminID BIGINT UNSIGNED DEFAULT hexToNum(adminIDHex);
    IF (adminID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    INSERT INTO HomeDirectories (admin_id, creator_id)
    VALUES (adminID, adminID);
    SELECT numToHex(LAST_INSERT_ID()) AS dirID;
END; END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editHomeDir (
    IN dirIDHex VARCHAR(16),
    IN adminIDHex VARCHAR(16)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE adminID BIGINT UNSIGNED DEFAULT hexToNum(adminIDHex);

    UPDATE HomeDirectories
    SET admin_id = adminID
    WHERE dir_id = dirID;
    SELECT ROW_COUNT() AS wasEdited;
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteHomeDir (
    IN dirIDHex VARCHAR(16)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
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
END; END proc //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE selectSMGas (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN doLock BOOL
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (doLock) THEN
        IF NOT GET_LOCK(CONCAT("SMGas.", fileID), 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;
    END IF;

    SELECT gas_json AS gasJSON
    FROM ServerModuleGas FORCE INDEX (PRIMARY)
    WHERE file_id = fileID;
END; END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE updateSMGas (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN gasJSON TEXT,
    IN doUnlock BOOL
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    UPDATE ServerModuleGas
    SET gas_json = gasJSON
    WHERE file_id = fileID;
    SELECT ROW_COUNT() AS wasUpdated;

    IF (doUnlock) THEN
        DO RELEASE_LOCK(CONCAT("SMGas.", dirID));
    END IF;
END; END //
DELIMITER ;












DELIMITER //
CREATE PROCEDURE readFileMetaData (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE firstFileID BIGINT UNSIGNED;

    SELECT modified_at, prev_modified_at
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE moveFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN newFilePath VARCHAR(700)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE firstFileID BIGINT UNSIGNED;

    UPDATE IGNORE Files
    SET file_path = newFilePath
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasMoved;
END; END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE readTextFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT content_text AS contentText
    FROM TextFiles FORCE INDEX (PRIMARY)
    WHERE file_id = fileID;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE putTextFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN contentText MEDIUMTEXT CHARACTER SET utf8mb4
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE fileCount INT UNSIGNED;
    DECLARE prevTextLen BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL OR contentText IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        -- Get the length of the previous text, then update it, and turn the
        -- previous length plus one, such that the value is always truthy, and
        -- still tells what the length of the text was previously.
        SELECT LENGTH(content_text) INTO prevTextLen
        FROM TextFiles FORCE INDEX (PRIMARY)
        WHERE file_id = fileID;
        UPDATE TextFiles
        SET content_text = contentText
        WHERE file_id = fileID;
        SELECT prevTextLen + 1 AS wasCreated;
    ELSE
        IF NOT GET_LOCK(CONCAT("Touch.", dirID), 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

        -- Check that the maximal file count is not exceeded.
        SELECT COUNT(file_path) INTO fileCount
        FROM Files FORCE INDEX (PRIMARY)
        WHERE dir_id = dirID;
        IF (fileCount >= 4000) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

        -- And if not, insert the new file.
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);
        INSERT INTO TextFiles (file_id, content_text)
        VALUES (fileID, contentText);

        DO RELEASE_LOCK(CONCAT("Put.", dirID));
        SELECT 1 AS wasCreated;
    END IF;
END; END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteTextFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE prevTextLen BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT IFNULL(LENGTH(content_text), 0) INTO prevTextLen
    FROM TextFiles FORCE INDEX (PRIMARY)
    WHERE file_id = fileID;

    DELETE FROM TextFiles
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT prevTextLen + 1 AS wasDeleted;
END; END //
DELIMITER ;






/* Tables */


DELIMITER //
CREATE PROCEDURE touchTableFile (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE fileCount INT UNSIGNED;
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
        IF NOT GET_LOCK(CONCAT("Touch.", dirID), 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

        -- Check that the maximal file count is not exceeded.
        SELECT COUNT(file_path) INTO fileCount
        FROM Files FORCE INDEX (PRIMARY)
        WHERE dir_id = dirID;
        IF (fileCount >= 4000) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

        -- And if not, touch the new file.
        INSERT INTO FileIDs () VALUES ();
        SET fileID = LAST_INSERT_ID();
        DELETE FROM FileIDs WHERE file_id < fileID;
        INSERT INTO Files (dir_id, file_path, file_id)
        VALUES (dirID, filePath, fileID);

        DO RELEASE_LOCK(CONCAT("Put.", dirID));
        SELECT 1 AS wasCreated;
    END IF;
END; END proc //
DELIMITER ;





/* Auto-key text tables (.att) */

DELIMITER //
CREATE PROCEDURE putATT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        IF NOT GET_LOCK(CONCAT("ATT.", fileID), 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

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
END; END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteATT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF NOT GET_LOCK(CONCAT("ATT.", fileID), 10) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM AutoKeyTextTables
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("ATT.", fileID));
END; END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertATTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN textIDHex VARCHAR(16),
    IN textData TEXT CHARACTER SET utf8mb4
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE textID BIGINT UNSIGNED DEFAULT hexToNum(textIDHex);
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

    IF (NOT textID OR textID IS NULL) THEN
        IF NOT GET_LOCK(CONCAT("ATT.", fileID), 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

        SELECT IFNULL(MAX(text_id), 0) + 1 INTO newTextID
        FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
        WHERE file_id = fileID AND list_id = listID;

        INSERT INTO AutoKeyTextTables (file_id, list_id, text_id, text_data)
        VALUES (fileID, listID, newTextID, textData);

        DO RELEASE_LOCK(CONCAT("ATT", fileID));
        SELECT numToHex(newTextID) AS newTextID;
    ELSE
        INSERT INTO AutoKeyTextTables (file_id, list_id, text_id, text_data)
        VALUES (fileID, listID, textID, textData)
        ON DUPLICATE KEY UPDATE text_data = textData;

        SELECT 1 AS wasUpdated;
    END IF;
END; END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteATTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN textIDHex VARCHAR(16)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE textID BIGINT UNSIGNED DEFAULT hexToNum(textIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF NOT GET_LOCK(CONCAT("ATT.", fileID), 10) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM AutoKeyTextTables
    WHERE file_id = fileID AND list_id = listID AND text_id = textID;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("ATT", fileID));
END; END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteATTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loIDHex VARCHAR(16),
    IN hiIDHex VARCHAR(16)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE lo BIGINT UNSIGNED DEFAULT hexToNum(loIDHex);
    DECLARE hi BIGINT UNSIGNED DEFAULT hexToNum(hiIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF NOT GET_LOCK(CONCAT("ATT.", fileID), 10) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM AutoKeyTextTables
    WHERE (
        file_id = fileID AND list_id = listID AND
        text_id >= lo AND (hi IS NULL OR text_id <= hi)
    );

    DO RELEASE_LOCK(CONCAT("ATT", fileID));

    SELECT ROW_COUNT() AS wasDeleted;
END; END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readATTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN textIDHex VARCHAR(16)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE textID BIGINT UNSIGNED DEFAULT hexToNum(textIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath ;

    SELECT text_data AS textData
    FROM AutoKeyTextTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND list_id = listID AND text_id = textID;
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readATTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loHex VARCHAR(16),
    IN hiHex VARCHAR(16),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE lo BIGINT UNSIGNED DEFAULT hexToNum(loHex);
    DECLARE hi BIGINT UNSIGNED DEFAULT hexToNum(hiHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT numToHex(text_id) AS textID, text_data AS textData
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
END; END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertATTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN listArrJSON JSON,
    IN doIgnore BOOL
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    IF (dirID IS NULL OR filePath IS NULL OR listID) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (NOT doIgnore) THEN
        INSERT INTO AutoKeyTextTables (
            file_id, list_id, text_id, text_data
        )
        SELECT
            fileID, listID, hexToNum(t1.textIDHex), t1.textData
        FROM JSON_TABLE(
            listArrJSON, '$[*]' COLUMNS (
                textIDHex VARCHAR(16) PATH '$[0]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                textData TEXT PATH '$[1]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR
            )
        ) AS t1
        ON DUPLICATE KEY UPDATE
            elem_payload = hexToBin(t1.elemPayloadHex);
    ELSE
        INSERT INTO AutoKeyTextTables (
            file_id, list_id, text_data
        )
        SELECT
            fileID, listID, t1.textData
        FROM JSON_TABLE(
            listArrJSON, '$[*]' COLUMNS (
                textData TEXT PATH '$[0]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR
            )
        ) AS t1;
    END IF;

    SELECT ROW_COUNT() AS rowCount;
END; END proc //
DELIMITER ;













/* Binary key tables (.bt) */

DELIMITER //
CREATE PROCEDURE putBT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        IF NOT GET_LOCK(CONCAT("BT.", fileID), 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

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
END; END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteBT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF NOT GET_LOCK(CONCAT("BT.", fileID), 10) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM BinaryKeyTables
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("BT.", fileID));
END; END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510),
    IN elemPayloadHex VARCHAR(510),
    IN doIgnore BOOL
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);
    DECLARE elemPayload VARBINARY(255) DEFAULT hexToBin(elemPayloadHex);
    IF (
        dirID IS NULL OR filePath IS NULL OR
        listID IS NULL OR elemKey IS NULL OR elemPayload IS NULL
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

    IF (NOT doIgnore) THEN
        INSERT INTO BinaryKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        VALUES (fileID, listID, elemKey, elemPayload)
        ON DUPLICATE KEY UPDATE elem_payload = elemPayload;
    ELSE
        INSERT IGNORE INTO BinaryKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        VALUES (fileID, listID, elemKey, elemPayload);
    END IF;

    SELECT ROW_COUNT() AS rowCount;
END; END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM BinaryKeyTables
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loHex VARCHAR(510),
    IN hiHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE lo VARBINARY(255) DEFAULT hexToBin(loHex);
    DECLARE hi VARBINARY(255) DEFAULT hexToBin(hiHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM BinaryKeyTables
    WHERE (
        file_id = fileID AND list_id = listID AND
        elem_key >= lo AND (hi IS NULL OR elem_key <= hi)
    );

    SELECT ROW_COUNT() AS wasDeleted;
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        binToHex(elem_payload) AS elemPayload
    FROM BinaryKeyTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readBTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loHex VARCHAR(510),
    IN hiHex VARCHAR(510),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE lo VARBINARY(255) DEFAULT hexToBin(loHex);
    DECLARE hi VARBINARY(255) DEFAULT hexToBin(hiHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT binToHex(elem_key) AS elemKey, binToHex(elem_payload) AS elemPayload
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
END; END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertBTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN listArrJSON JSON,
    IN doIgnore BOOL
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    IF (dirID IS NULL OR filePath IS NULL OR listID IS NULL) THEN
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

    IF (NOT doIgnore) THEN
        INSERT INTO BinaryKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        SELECT
            fileID, listID,
            hexToBin(t1.elemKeyHex), hexToBin(t1.elemPayloadHex)
        FROM JSON_TABLE(
            listArrJSON, '$[*]' COLUMNS (
                elemKeyHex VARCHAR(510) PATH '$[0]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                elemPayloadHex VARCHAR(510) PATH '$[1]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR
            )
        ) AS t1
        ON DUPLICATE KEY UPDATE
            elem_payload = hexToBin(t1.elemPayloadHex);
    ELSE
        INSERT IGNORE INTO BinaryKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        SELECT
            fileID, listID,
            hexToBin(t1.elemKeyHex), hexToBin(t1.elemPayloadHex)
        FROM JSON_TABLE(
            listArrJSON, '$[*]' COLUMNS (
                elemKeyHex VARCHAR(510) PATH '$[0]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                elemPayloadHex VARCHAR(510) PATH '$[1]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR
            )
        ) AS t1;
    END IF;

    SELECT ROW_COUNT() AS rowCount;
END; END proc //
DELIMITER ;








/* Char key tables (.bt) */

DELIMITER //
CREATE PROCEDURE putCT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        IF NOT GET_LOCK(CONCAT("CT.", fileID), 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

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
END; END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteCT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF NOT GET_LOCK(CONCAT("CT.", fileID), 10) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM CharKeyTables
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("CT.", fileID));
END; END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertCTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510),
    IN elemPayloadHex VARCHAR(510),
    IN doIgnore BOOL
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);
    DECLARE elemPayload VARBINARY(255) DEFAULT hexToBin(elemPayloadHex);
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

    IF (NOT doIgnore) THEN
        INSERT INTO CharKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        VALUES (
            fileID, listID, elemKey, elemPayload
        )
        ON DUPLICATE KEY UPDATE elem_payload = elemPayload;
    ELSE
        INSERT IGNORE INTO CharKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        VALUES (fileID, listID, elemKey, elemPayload);
    END IF;

    SELECT ROW_COUNT() AS rowCount;
END; END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteCTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM CharKeyTables
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteCTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loHex VARCHAR(510),
    IN hiHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE lo VARBINARY(255) DEFAULT hexToBin(loHex);
    DECLARE hi VARBINARY(255) DEFAULT hexToBin(hiHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM CharKeyTables
    WHERE (
        file_id = fileID AND list_id = listID AND
        elem_key >= lo AND (hi IS NULL OR elem_key <= hi)
    );

    SELECT ROW_COUNT() AS wasDeleted;
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readCTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        binToHex(elem_payload) AS elemPayload
    FROM CharKeyTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE readCTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loHex VARCHAR(510),
    IN hiHex VARCHAR(510),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE lo VARBINARY(255) DEFAULT hexToBin(loHex);
    DECLARE hi VARBINARY(255) DEFAULT hexToBin(hiHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT elem_key AS elemKey, binToHex(elem_payload) AS elemPayload
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
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertCTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN listArrJSON JSON,
    IN doIgnore BOOL
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    IF (dirID IS NULL OR filePath IS NULL OR listID IS NULL) THEN
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

    IF (NOT doIgnore) THEN
        INSERT INTO CharKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        SELECT
            fileID, listID,
            hexToBin(t1.elemKeyHex), hexToBin(t1.elemPayloadHex)
        FROM JSON_TABLE(
            listArrJSON, '$[*]' COLUMNS (
                elemKeyHex VARCHAR(510) PATH '$[0]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                elemPayloadHex VARCHAR(510) PATH '$[1]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR
            )
        ) AS t1
        ON DUPLICATE KEY UPDATE
            elem_payload = hexToBin(t1.elemPayloadHex);
    ELSE
        INSERT IGNORE INTO CharKeyTables (
            file_id, list_id, elem_key, elem_payload
        )
        SELECT
            fileID, listID,
            hexToBin(t1.elemKeyHex), hexToBin(t1.elemPayloadHex)
        FROM JSON_TABLE(
            listArrJSON, '$[*]' COLUMNS (
                elemKeyHex VARCHAR(510) PATH '$[0]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                elemPayloadHex VARCHAR(510) PATH '$[1]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR
            )
        ) AS t1;
    END IF;

    SELECT ROW_COUNT() AS rowCount;
END; END proc //
DELIMITER ;















/* Binary key, binary score tables (.bbt) */

DELIMITER //
CREATE PROCEDURE putBBT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    IF (dirID IS NULL OR filePath IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF (fileID IS NOT NULL) THEN
        IF NOT GET_LOCK(CONCAT("BBT.", fileID), 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;

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
END; END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteBBT (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700)
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    IF NOT GET_LOCK(CONCAT("BBT.", fileID), 10) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    DELETE FROM BinaryKeyBinaryScoreTables
    WHERE file_id = fileID;
    DELETE FROM Files
    WHERE dir_id = dirID AND file_path = filePath;
    SELECT ROW_COUNT() AS wasDeleted;

    DO RELEASE_LOCK(CONCAT("BBT.", fileID));
END; END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertBBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510),
    IN elemScoreHex VARCHAR(510),
    IN elemPayloadHex VARCHAR(510),
    IN doIgnore BOOL
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);
    DECLARE elemScore VARBINARY(255) DEFAULT hexToBin(elemScoreHex);
    DECLARE elemPayload VARBINARY(255) DEFAULT hexToBin(elemPayloadHex);
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

    IF (NOT doIgnore) THEN
        INSERT INTO BinaryKeyBinaryScoreTables (
            file_id, list_id, elem_key, elem_score, elem_payload
        )
        VALUES (
            fileID, listID, elemKey, elemScore, elemPayload
        )
        ON DUPLICATE KEY UPDATE
            elem_score = elemScore,
            elem_payload = elemPayload;
    ELSE
        INSERT IGNORE INTO BinaryKeyBinaryScoreTables (
            file_id, list_id, elem_key, elem_score, elem_payload
        )
        VALUES (fileID, listID, elemKey, elemScore, elemPayload);
    END IF;


    SELECT ROW_COUNT() AS rowCount;
END; END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM BinaryKeyBinaryScoreTables
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;

    SELECT ROW_COUNT() AS wasDeleted;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteBBTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loHex VARCHAR(510),
    IN hiHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE lo VARBINARY(255) DEFAULT hexToBin(loHex);
    DECLARE hi VARBINARY(255) DEFAULT hexToBin(hiHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    DELETE FROM BinaryKeyBinaryScoreTables
    WHERE (
        file_id = fileID AND list_id = listID AND
        elem_key >= lo AND (hi IS NULL OR elem_key <= hi)
    );

    SELECT ROW_COUNT() AS wasDeleted;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBBTEntry (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN elemKeyHex VARCHAR(510)
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, maxTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE elemKey VARBINARY(255) DEFAULT hexToBin(elemKeyHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        binToHex(elem_score) AS elemScore,
        binToHex(elem_payload) AS elemPayload
    FROM BinaryKeyBinaryScoreTables FORCE INDEX (PRIMARY)
    WHERE file_id = fileID AND list_id = listID AND elem_key = elemKey;
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBBTScoreOrderedList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loHex VARCHAR(510),
    IN hiHex VARCHAR(510),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE lo VARBINARY(255) DEFAULT hexToBin(loHex);
    DECLARE hi VARBINARY(255) DEFAULT hexToBin(hiHex);
    SET numOffset = IFNULL(numOffset, 0);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        binToHex(elem_key) AS elemKey, binToHex(elem_score) AS elemScore
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
END; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE readBBTKeyOrderedList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN loHex VARCHAR(510),
    IN hiHex VARCHAR(510),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscending BOOL
)
BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    DECLARE lo VARBINARY(255) DEFAULT hexToBin(loHex);
    DECLARE hi VARBINARY(255) DEFAULT hexToBin(hiHex);

    SELECT file_id INTO fileID
    FROM Files FORCE INDEX (PRIMARY)
    WHERE dir_id = dirID AND file_path = filePath;

    SELECT
        binToHex(elem_key) AS elemKey, binToHex(elem_score) AS elemScore,
        binToHex(elem_payload) AS elemPayload
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
END; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertBBTList (
    IN dirIDHex VARCHAR(16),
    IN filePath VARCHAR(700),
    IN listIDHex VARCHAR(510),
    IN listArrJSON JSON,
    IN doIgnore BOOL
)
proc: BEGIN DECLARE EXIT HANDLER FOR 1411 BEGIN SELECT NULL; END; BEGIN
    DECLARE dirID BIGINT UNSIGNED DEFAULT hexToNum(dirIDHex);
    DECLARE fileID, newTextID BIGINT UNSIGNED;
    DECLARE listID VARBINARY(255) DEFAULT hexToBin(listIDHex);
    IF (dirID IS NULL OR filePath IS NULL OR listID IS NULL) THEN
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

    IF (NOT doIgnore) THEN
        INSERT INTO BinaryKeyBinaryScoreTables (
            file_id, list_id, elem_key, elem_score, elem_payload
        )
        SELECT
            fileID, listID, hexToBin(t1.elemKeyHex),
            hexToBin(t1.elemScoreHex), hexToBin(t1.elemPayloadHex)
        FROM JSON_TABLE(
            listArrJSON, '$[*]' COLUMNS (
                elemKeyHex VARCHAR(510) PATH '$[0]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                elemScoreHex VARCHAR(510) PATH '$[1]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                elemPayloadHex VARCHAR(510) PATH '$[2]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR
            )
        ) AS t1
        ON DUPLICATE KEY UPDATE
            elem_payload = hexToBin(t1.elemPayloadHex);
    ELSE
        INSERT IGNORE INTO BinaryKeyBinaryScoreTables (
            file_id, list_id, elem_key, elem_score, elem_payload
        )
        SELECT
            fileID, listID, hexToBin(t1.elemKeyHex),
            hexToBin(t1.elemScoreHex), hexToBin(t1.elemPayloadHex)
        FROM JSON_TABLE(
            listArrJSON, '$[*]' COLUMNS (
                elemKeyHex VARCHAR(510) PATH '$[0]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                elemScoreHex VARCHAR(510) PATH '$[1]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR,
                elemPayloadHex VARCHAR(510) PATH '$[2]'
                    DEFAULT '""' ON EMPTY DEFAULT '""' ON ERROR
            )
        ) AS t1;
    END IF;

    SELECT ROW_COUNT() AS rowCount;
END; END proc //
DELIMITER ;

















DROP TABLE DebugLogEntries;
DROP PROCEDURE logMsg;

CREATE TABLE DebugLogEntries (

    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    msg VARCHAR(1000)
);

DELIMITER //
CREATE PROCEDURE logMsg (
    IN logMessage VARCHAR(1000)
)
BEGIN
    INSERT INTO DebugLogEntries (msg)
    VALUE (logMessage);
END //
DELIMITER ;

