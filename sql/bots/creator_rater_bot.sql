
SELECT "Bots: creator_rater_bot";

DROP PROCEDURE creatorRaterBot;

DELIMITER //
CREATE PROCEDURE creatorRaterBot (
    IN entID BIGINT UNSIGNED,
    IN userID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE userCreationsTagID BIGINT UNSIGNED;

    -- get the user's Creations category.
    SELECT id INTO userCreationsTagID
    FROM Entities
    WHERE (
        def = CONCAT("@f48.", userID, ".")
    );
    -- if it does not exist, also insert it and get the ID.
    IF (userCreationsTagID IS NULL) THEN
        INSERT IGNORE INTO Entities (def)
        VALUES (CONCAT("@f48.", userID, "."));
        SELECT LAST_INSERT_ID() INTO userCreationsTagID;
        IF (userCreationsTagID IS NULL) THEN
            SELECT id INTO userCreationsTagID
            FROM Entities
            WHERE (
                def = CONCAT("@f48.", userID, ".")
            );
        END IF;
    END IF;

    -- update the bot's input set.
    REPLACE INTO SemanticInputs (
        user_id,
        -- ent_type_id,
        tag_id,
        rat_val,
        inst_id
    )
    VALUES (
        60, -- ID of the 'creator_rater_bot.''
        -- 1, -- ID of type 'something.'
        userCreationsTagID,
        65535,
        entID
    );

END proc; END //
DELIMITER ;
