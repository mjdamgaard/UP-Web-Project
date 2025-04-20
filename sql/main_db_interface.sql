
DROP PROCEDURE readHomeDirMetaData;
DROP PROCEDURE readHomeDirDescendants;
DROP PROCEDURE createHomeDir;
DROP PROCEDURE editHomeDir;
DROP PROCEDURE deleteHomeDir;





DELIMITER //
CREATE PROCEDURE readHomeDirMetaData (
    IN dirID BIGINT UNSIGNED
)
proc: BEGIN
    IF (dirID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    SELECT admin_id AS adminID, is_private AS isPrivate
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
    IN adminID BIGINT UNSIGNED,
    IN isPrivate BOOL
)
proc: BEGIN
    IF (adminID IS NULL OR isPrivate IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    INSERT INTO HomeDirectories (admin_id, is_private)
    VALUES (adminID, isPrivate);
    SELECT LAST_INSERT_ID() AS dirID;
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editHomeDir (
    IN dirID BIGINT UNSIGNED,
    IN adminID BIGINT UNSIGNED,
    IN isPrivate BOOL
)
proc: BEGIN
    IF (dirID IS NULL OR adminID IS NULL OR isPrivate IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;
    UPDATE HomeDirectories
    SET admin_id = adminID, is_private = isPrivate
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
