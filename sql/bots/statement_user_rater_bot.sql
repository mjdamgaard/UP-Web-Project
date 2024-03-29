
SELECT "Bots: statement_user_rater_bot";

DROP PROCEDURE updateStatementUserRaterBot;

DELIMITER //
CREATE PROCEDURE updateStatementUserRaterBot (
    IN userID BIGINT UNSIGNED,
    IN stmtID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE stmtUserTagID, userStrID BIGINT UNSIGNED;

    -- Get the statement's Users category.
    SELECT id INTO stmtUserTagID
    FROM Strings
    WHERE (
        -- type_id = 2 AND
        -- cxt_id = 77 AND
        -- def_str = CONCAT("#", stmtID)
        str = CONCAT("user that thinks @42[", stmtID, "]")
    );
    -- If it does not exist, also insert it and get the ID.
    IF (stmtUserTagID IS NULL) THEN
        INSERT IGNORE INTO Strings (str)
        VALUES (CONCAT("user that thinks @42[", stmtID, "]"));
        SELECT LAST_INSERT_ID() INTO stmtUserTagID;
        IF (stmtUserTagID IS NULL) THEN
            SELECT id INTO stmtUserTagID
            FROM Strings
            WHERE (
                str = CONCAT("thinks @42[", stmtID, "]")
            );
        END IF;
    END IF;

    -- Get the string representing the user.
    SELECT id INTO userStrID
    FROM Strings
    WHERE (
        str = CONCAT("@5[", userID, "]")
    );
    -- If it does not exist, also insert it and get the ID.
    IF (userStrID IS NULL) THEN
        INSERT IGNORE INTO Strings (str)
        VALUES (CONCAT("@5[", userID, "]"));
        SELECT LAST_INSERT_ID() INTO userStrID;
        IF (userStrID IS NULL) THEN
            SELECT id INTO userStrID
            FROM Strings
            WHERE (
                str = CONCAT("@5[", userID, "]")
            );
        END IF;
    END IF;

    -- If the input's rat_val is 0, delete the corresponding SemInput.
    IF (ratVal = 0) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = 61 AND -- ID of the 'statement_user_rater_bot.'
            obj_type_id = 5 AND -- ID of the 'user' type.
            tag_id = stmtUserTagID AND
            obj_def_id = userStrID
        );
    -- Else update the corresponding SemInput with the new rat_val.
    ELSE
        REPLACE INTO SemanticInputs (
            user_id,
            obj_type_id,
            tag_id,
            rat_val,
            obj_def_id
        )
        VALUES (
            61,
            5,
            stmtUserTagID,
            ratVal,
            userStrID
        );
    END IF;
END proc; END //
DELIMITER ;
