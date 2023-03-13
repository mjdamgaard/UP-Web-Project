



DROP PROCEDURE findOrCreateSet;
DROP PROCEDURE inputOrChangeRating;




DELIMITER //
CREATE PROCEDURE findOrCreateSet (
    IN userType CHAR(1),
    IN userIDHex VARCHAR(16),
    IN subjType CHAR(1),
    IN subjIDHex VARCHAR(16),
    IN relIDHex VARCHAR(16),
    OUT newIDHex VARCHAR(16),
    OUT exitCode TINYINT
)
BEGIN
    DECLARE userID, subjID, relID, newID BIGINT UNSIGNED;
    SET userID = CONV(userIDHex, 16, 10);
    SET subjID = CONV(subjIDHex, 16, 10);
    SET relID = CONV(relIDHex, 16, 10);

    SELECT set_id INTO newID
    FROM Sets
    WHERE (
        user_t = userType AND
        user_id = userID AND
        subj_t = subjType AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (newID IS NULL) THEN
        INSERT INTO Sets (
            user_t,
            user_id,
            subj_t,
            subj_id,
            rel_id
        )
        VALUES (
            userType,
            userID,
            subjType,
            subjID,
            relID
        );
        SELECT LAST_INSERT_ID() INTO newID;
        SET exitCode = 1; -- create.
    ELSE
        SET exitCode = 0; -- find.
    END IF;
    SET newIDHex = HEX(newID);
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userType CHAR(1),
    IN userIDHex VARCHAR(16),
    IN subjType CHAR(1),
    IN subjIDHex VARCHAR(16),
    IN relIDHex VARCHAR(16),
    IN ratingVal VARBINARY(255),
    IN objType CHAR(1),
    IN objIDHex VARCHAR(16),
    -- OUT newIDHex VARCHAR(16),
    OUT exitCode TINYINT
)
BEGIN
    DECLARE setID, existsPriorRating BIGINT UNSIGNED;
    DECLARE ecFindOrCreateSet TINYINT;
    CALL findOrCreateSet (
        userType,
        userID,
        subjType,
        subjID,
        relID,
        setID,
        ecFindOrCreateSet
    );
    SET existsPriorRating = EXISTS (
        SELECT set_id
        FROM SemanticInputs
        WHERE (
            set_id = setID AND
            obj_t = objType AND
            obj_id = objID
        )
    );
    IF (NOT existsPriorRating) THEN
        INSERT INTO SemanticInputs (
            set_id,
            rat_val,
            obj_t,
            obj_id
        )
        VALUES (
            setID,
            ratingVal,
            objType,
            objID
        );
        SET exitCode = (0 + ecFindOrCreateSet); -- no prior rating.
    ELSE
        UPDATE SemanticInputs
        SET rat_val = ratingVal
        WHERE (
            obj_t = objType AND
            obj_id = objID AND
            set_id = setID
        );
        SET exitCode = (2 + ecFindOrCreateSet); -- overwriting an old rating.
    END IF;
END //
DELIMITER ;
