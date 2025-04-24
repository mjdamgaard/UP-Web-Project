
DROP PROCEDURE readHomeDirAdminID;
DROP PROCEDURE readHomeDirDescendants;
DROP PROCEDURE createHomeDir;
DROP PROCEDURE editHomeDir;
DROP PROCEDURE deleteHomeDir;
DROP PROCEDURE readFileMetaData;
DROP PROCEDURE moveFile;
DROP PROCEDURE readTextFileContent;
DROP PROCEDURE putTextFile;
DROP PROCEDURE deleteTextFile;





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
CREATE PROCEDURE readTextFileContent (
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