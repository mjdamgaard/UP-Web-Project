
SELECT "Request procedures";

DROP PROCEDURE insertOrUpdatePublicUserScore;





DELIMITER //
CREATE PROCEDURE _scheduleOrAdvanceRequest (
    IN reqType VARCHAR(100),
    IN reqData VARBINARY(2900),
    IN initDelayTime FLOAT UNSIGNED,
    IN timeReductionOnAdvancement FLOAT UNSIGNED
)
BEGIN
    INSERT INTO ScheduledRequests (
        req_type, req_data, delay_time
    )
    VALUES (
        reqType, reqData, initDelayTime
    )
    ON DUPLICATE KEY UPDATE
        delay_time = delay_time - timeReductionOnAdvancement;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE requestScoreUpdate (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN

END proc //
DELIMITER ;
