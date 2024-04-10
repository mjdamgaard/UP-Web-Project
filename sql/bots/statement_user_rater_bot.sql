
SELECT "Bots: statement_user_rater_bot";

DROP PROCEDURE updateStatementUserRaterBot;

DELIMITER //
CREATE PROCEDURE updateStatementUserRaterBot (
    IN userID BIGINT UNSIGNED,
    IN stmtID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE stmtUserTagID, userEntID BIGINT UNSIGNED;
    -- DECLARE stmtUserTagDef VARCHAR(255)
    -- CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
    -- DEFAULT CONCAT("#47.", stmtID);

    -- Get the statement's Users category.
    SELECT id INTO stmtUserTagID
    FROM Entities
    WHERE (
        def = CONCAT("#47.", stmtID)
    );
    -- If it does not exist, also insert it and get the ID.
    IF (stmtUserTagID IS NULL) THEN
        INSERT IGNORE INTO Entities (def)
        VALUES (CONCAT("#47.", stmtID));
        SELECT LAST_INSERT_ID() INTO stmtUserTagID;
        IF (stmtUserTagID IS NULL) THEN
            SELECT id INTO stmtUserTagID
            FROM Entities
            WHERE (
                def = CONCAT("#47.", stmtID)
            );
        END IF;
    END IF;

    -- Get the entity representing the user.
    SELECT id INTO userEntID
    FROM Entities
    WHERE (
        def = CONCAT("u#", userID)
    );
    -- If it does not exist, also insert it and get the ID.
    IF (userEntID IS NULL) THEN
        INSERT IGNORE INTO Entities (def)
        VALUES (CONCAT("u#", userID));
        SELECT LAST_INSERT_ID() INTO userEntID;
        IF (userEntID IS NULL) THEN
            SELECT id INTO userEntID
            FROM Entities
            WHERE (
                def = CONCAT("u#", userID)
            );
        END IF;
    END IF;

    -- If the input's rat_val is 0, delete the corresponding SemInput.
    IF (ratVal = 0) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = 61 AND -- ID of the 'statement_user_rater_bot.'
            -- ent_type_id = 5 AND -- ID of the 'user' type.
            tag_id = stmtUserTagID AND
            inst_id = userEntID
        );
    -- Else update the corresponding SemInput with the new rat_val.
    ELSE
        REPLACE INTO SemanticInputs (
            user_id,
            -- ent_type_id,
            tag_id,
            rat_val,
            inst_id
        )
        VALUES (
            61,
            -- 5,
            stmtUserTagID,
            ratVal,
            userEntID
        );
    END IF;
END proc; END //
DELIMITER ;
