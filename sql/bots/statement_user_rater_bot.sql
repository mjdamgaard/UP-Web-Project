
SELECT "Bots: statement_user_rater_bot";

-- DROP PROCEDURE updateStatementUserRaterBot;

DELIMITER //
CREATE PROCEDURE updateStatementUserRaterBot (
    IN userID BIGINT UNSIGNED,
    IN stmtID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE stmtUsersCatID BIGINT UNSIGNED;

    -- get the statement's Users category.
    SELECT id INTO stmtUsersCatID
    FROM Entities
    WHERE (
        type_id = 2 AND
        cxt_id = 77 AND
        def_str = CONCAT("#", stmtID)
    );
    -- if it does not exist, also insert it and get the ID.
    IF (stmtUsersCatID IS NULL) THEN
        INSERT IGNORE INTO Entities (type_id, cxt_id, def_str)
        VALUES (2, 77, CONCAT("#", stmtID));
        SELECT LAST_INSERT_ID() INTO stmtUsersCatID;
        IF (stmtUsersCatID IS NULL) THEN
            SELECT id INTO stmtUsersCatID
            FROM Entities
            WHERE (
                type_id = 2 AND
                cxt_id = 77 AND
                def_str = CONCAT("#", stmtID)
            );
        END IF;
    END IF;

    -- if the input's rat_val is null, delete the corresponding SemInput.
    IF (ratVal IS NULL) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = 79 AND
            cat_id = stmtUsersCatID AND
            inst_id = userID
        );
    -- else update the corresponding SemInput with the new rat_val.
    ELSE
        REPLACE INTO SemanticInputs (
            user_id,
            cat_id,
            rat_val,
            inst_id
        )
        VALUES (
            79,
            stmtUsersCatID,
            ratVal,
            userID
        );
    END IF;
END proc; END //
DELIMITER ;
