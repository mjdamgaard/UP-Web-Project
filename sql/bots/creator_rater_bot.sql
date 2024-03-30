
SELECT "Bots: creator_rater_bot";

DROP PROCEDURE creatorRaterBot;

DELIMITER //
CREATE PROCEDURE creatorRaterBot (
    IN strID BIGINT UNSIGNED,
    IN userID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE userCreationsTagID BIGINT UNSIGNED;

    -- get the user's Creations category.
    SELECT id INTO userCreationsTagID
    FROM Strings
    WHERE (
        -- type_id = 2 AND
        -- cxt_id = 84 AND
        -- def_str = CONCAT("#", userID)
        str = CONCAT("submitted by @u[", userID, "]")
    );
    -- if it does not exist, also insert it and get the ID.
    IF (userCreationsTagID IS NULL) THEN
        INSERT IGNORE INTO Strings (str)
        VALUES (CONCAT("submitted by @u[", userID, "]"));
        SELECT LAST_INSERT_ID() INTO userCreationsTagID;
        IF (userCreationsTagID IS NULL) THEN
            SELECT id INTO userCreationsTagID
            FROM Strings
            WHERE (
                str = CONCAT("submitted by @u[", userID, "]")
            );
        END IF;
    END IF;

    -- update the bot's input set.
    REPLACE INTO SemanticInputs (
        user_id,
        ent_type_id,
        tag_id,
        rat_val,
        ent_def_id
    )
    VALUES (
        60, -- ID of the 'creator_rater_bot.''
        1, -- ID of type 'something.'
        userCreationsTagID,
        65535,
        strID
    );

END proc; END //
DELIMITER ;
