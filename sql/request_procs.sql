
SELECT "Request procedures";

DROP PROCEDURE insertOrUpdatePublicUserScore;






DELIMITER //
CREATE PROCEDURE requestUserGroupScoreUpdate (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
BEGIN
    DECLARE isMember, isExceeded TINYINT UNSIGNED;
    DECLARE reqData VARBINARY(2900) DEFAULT (CONCAT(
        CAST(qualID AS CHAR), ",",
        CAST(subjID AS CHAR), ",",
        CAST(userGroupID AS CHAR)
    ));
    DECLARE delayTime BIGINT UNSIGNED DEFAULT (1 << 32);
    DECLARE uploadDataCost BIGINT UNSIGNED DEFAULT 20;

    -- First we check that the user is in the given user group.
    CALL _getIsMember (
        userID, userGroupID, isMember
    );

    CALL _scheduleRequest (
        userID, "USER_GROUP_SCORE", reqData, delayTime, uploadDataCost,
        isExceeded
    );

    IF (isExceeded) THEN
        SELECT 1 AS exitCode; -- weekly upload data is exceeded.
    ELSE
        SELECT 0 AS exitCode; -- request scheduled.
    END IF;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE _executeUserGroupScoreUpdateRequest (
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
BEGIN

END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE _scheduleRequest (
    IN userID BIGINT UNSIGNED,
    IN reqType VARCHAR(100),
    IN reqData VARBINARY(2900),
    IN delayTime BIGINT UNSIGNED, -- delay time >> 32 = UNIX timestamp.
    IN uploadDataCost BIGINT UNSIGNED,
    OUT isExceeded TINYINT UNSIGNED
)
BEGIN
    -- If the insert statement following this handler declaration fails, simply
    -- roll back the transaction.
    DECLARE EXIT HANDLER FOR 1586 -- Duplicate key entry error.
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    -- The first thing we do is to try to insert the request as a new one, and
    -- if this fails due to a duplicate key entry error, the above exit handler
    -- finishes the procedure.
    INSERT INTO ScheduledRequests (
        req_type, req_data, exec_at
    )
    VALUES (
        reqType, reqData, UNIX_TIMESTAMP() << 32 + initDelayTime
    );

    -- If this insertion succeeds, we then we increase the user's counters,
    -- and if these don't exceed their limits, we commit, and otherwise we
    -- roll back the transaction.
    CALL _increaseUserCounters (
        userID, uploadDataCost, isExceeded
    );

    IF (isExceeded) THEN
        ROLLBACK;
    ELSE
        COMMIT;
    END IF;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE _increaseUserUploadDataCount (
    IN userID BIGINT UNSIGNED,
    IN uploadData BIGINT UNSIGNED,
    OUT isExceeded TINYINT UNSIGNED
)
proc: BEGIN
    DECLARE uploadCount, uploadLimit BIGINT UNSIGNED;
    DECLARE lastRefreshedAt DATE;
    DECLARE currentDate DATE DEFAULT (CURDATE());
    
    SELECT
        upload_data_this_week + uploadData,
        upload_data_weekly_limit,
        last_refreshed_at
    INTO
        uploadCount,
        uploadLimit,
        lastRefreshedAt
    FROM Private_UserData
    WHERE user_id = userID;

    -- If it has been more than a week since freshing the counters to 0, do so
    -- first. 
    IF (currentDate >= ADDDATE(lastRefreshedAt, INTERVAL 1 WEEK)) THEN
        UPDATE Private_UserData
        SET
            upload_data_this_week = 0,
            last_refreshed_at = currentDate
        WHERE user_id = userID;

        SET uploadCount = uploadData;
    END IF;

    -- Then check if any limits are exceeded, and return isExceeded = 1 if so
    -- (without updating the user's counters).
    IF (uploadCount > uploadLimit) THEN
        SET isExceeded = 1;
        LEAVE proc;
    END IF;

    -- If not, update the counters and return isExceeded = 0.
    UPDATE Private_UserData
    SET
        upload_data_this_week = uploadCount
    WHERE user_id = userID;

    SET isExceeded = 0;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE _executeRequest (
    IN reqType VARCHAR(100),
    IN reqData VARCHAR(255)
)
BEGIN
    CASE reqType
        WHEN "USER_GROUP_SCORE" THEN BEGIN
            DECLARE qualID, subjID, userGroupID BIGINT UNSIGNED;
            SET qualID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 1) AS UNSIGNED
            );
            SET subjID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 2) AS UNSIGNED
            );
            SET userGroupID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 3) AS UNSIGNED
            );

            CALL _executeUserGroupScoreUpdateRequest (
                qualID, subjID, userGroupID
            );
        END
        ELSE BEGIN
            SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = "Unrecognized reqType";
        END
    END CASE;
END //
DELIMITER ;

