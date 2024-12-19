
SELECT "Request procedures";

DROP PROCEDURE insertOrUpdatePublicUserScore;






DELIMITER //
CREATE PROCEDURE requestUserGroupScoreUpdate (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE isExceeded TINYINT UNSIGNED;
    DECLARE reqData VARBINARY(2900) DEFAULT (CONCAT(
        CAST(qualID AS CHAR), ",",
        CAST(subjID AS CHAR), ",",
        CAST(userGroupID AS CHAR)
    ));
    -- TODO: delayTime should depend on several parameters..
    DECLARE delayTime BIGINT UNSIGNED DEFAULT (5 << 32);

    CALL _scheduleOrAdvanceRequest (
        userID, "USER_GROUP_SCORE", reqData,
    );

END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE _executeUserGroupScoreUpdateRequest (
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN

END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE _scheduleOrAdvanceRequest (
    IN userID BIGINT UNSIGNED,
    IN reqType VARCHAR(100),
    IN reqData VARBINARY(2900),
    IN delayTime BIGINT UNSIGNED, -- delay time >> 32 = UNIX timestamp.
    IN uploadDataCost BIGINT UNSIGNED,
    OUT isExceeded TINYINT UNSIGNED
)
BEGIN
    -- If the insert statement following this handler declaration fails, simply
    -- update the request and increase the user's computation counter by
    -- timeReductionOnAdvancement.
    DECLARE EXIT HANDLER FOR 1586 -- Duplicate key entry error.
    BEGIN
        ROLLBACK;

        -- First update the users counters and get isExceeded. (uploadDataCost
        -- only counts for the first user to make the request.)
        CALL _increaseUserCounters (
            userID, 0, timeReductionOnAdvancement, isExceeded
        );

        -- If the user counters didn't exceed their limits, advance the request.
        IF (NOT isExceeded) THEN
            UPDATE ScheduledRequests
            SET exec_at = exec_at - timeReductionOnAdvancement
            WHERE (
                req_type = reqType AND
                req_data = reqData
            );
        END IF;
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
        userID, uploadDataCost, timeReductionOnAdvancement, isExceeded
    );

    IF (isExceeded) THEN
        ROLLBACK;
    ELSE
        COMMIT;
    END IF;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE _increaseUserCounters (
    IN userID BIGINT UNSIGNED,
    IN uploadData BIGINT UNSIGNED,
    IN computationWeight BIGINT UNSIGNED,
    OUT isExceeded TINYINT UNSIGNED
)
proc: BEGIN
    DECLARE uploadCount, uploadLimit, compCount, compLimit BIGINT UNSIGNED;
    DECLARE lastRefreshedAt DATE;
    DECLARE currentDate DATE DEFAULT (CURDATE());
    
    SELECT
        upload_data_this_week + uploadData,
        upload_data_weekly_limit,
        computation_weight_this_week + computationWeight,
        computation_weight_weekly_limit,
        last_refreshed_at
    INTO
        uploadCount,
        uploadLimit,
        compCount,
        compLimit,
        lastRefreshedAt
    FROM Private_UserData
    WHERE user_id = userID;

    -- If it has been more than a week since freshing the counters to 0, do so
    -- first. 
    IF (currentDate >= ADDDATE(lastRefreshedAt, INTERVAL 1 WEEK)) THEN
        UPDATE Private_UserData
        SET
            upload_data_this_week = 0,
            computation_weight_this_week = 0,
            last_refreshed_at = currentDate
        WHERE user_id = userID;

        SET uploadCount = uploadData;
        SET compCount = computationWeight;
    END IF;

    -- Then check if any limits are exceeded, and return isExceeded = 1 if so
    -- (without updating the user's counters).
    IF (uploadCount > uploadLimit OR compCount > compLimit) THEN
        SET isExceeded = 1;
        LEAVE proc;
    END IF;

    -- If not, update the counters and return isExceeded = 0.
    UPDATE Private_UserData
    SET
        upload_data_this_week = uploadCount,
        computation_weight_this_week = compCount
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

