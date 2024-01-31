
SELECT "Bots: creator_rater_bot";

-- DROP PROCEDURE creatorRaterBot;

DELIMITER //
CREATE PROCEDURE creatorRaterBot (
    IN entID BIGINT UNSIGNED,
    IN userID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE userCreationsCatID BIGINT UNSIGNED;

    -- get the user's Creations category.
    SELECT id INTO userCreationsCatID
    FROM Entities
    WHERE (
        type_id = 2 AND
        cxt_id = 84 AND
        def_str = CONCAT("#", userID)
    );
    -- if it does not exist, also insert it and get the ID.
    IF (userCreationsCatID IS NULL) THEN
        INSERT IGNORE INTO Entities (type_id, cxt_id, def_str)
        VALUES (2, 84, CONCAT("#", userID));
        SELECT LAST_INSERT_ID() INTO userCreationsCatID;
        IF (userCreationsCatID IS NULL) THEN
            SELECT id INTO userCreationsCatID
            FROM Entities
            WHERE (
                type_id = 2 AND
                cxt_id = 84 AND
                def_str = CONCAT("#", userID)
            );
        END IF;
    END IF;

    -- update the bot's input set.
    REPLACE INTO SemanticInputs (
        user_id,
        cat_id,
        rat_val,
        inst_id
    )
    VALUES (
        84,
        userCreationsCatID,
        65535,
        entID
    );

END proc; END //
DELIMITER ;
