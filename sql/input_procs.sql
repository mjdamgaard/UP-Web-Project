
SELECT "rating_inputs";




DROP PROCEDURE inputOrChangeRatingSecKey;
DROP PROCEDURE inputOrChangeRating;




DELIMITER //
CREATE PROCEDURE createOrFindSet (
    IN userID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO newID
    FROM Sets
    WHERE (
        user_id = userID AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (newID IS NULL) THEN
        INSERT INTO Sets (
            user_id,
            subj_id,
            rel_id,
            elem_num
        )
        VALUES (
            userID,
            subjID,
            relID,
            0
        );
        SELECT LAST_INSERT_ID() INTO newID;
        SET exitCode = 0; -- create.
    ELSE
        SET exitCode = 1; -- find.
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userID BIGINT UNSIGNED,
    IN objID BIGINT UNSIGNED,
    IN setID BIGINT UNSIGNED,
    IN ratValHex VARCHAR(510),
    IN delaySigma TIME,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    DECLARE prevRatVal, ratVal VARBINARY(255);
    DECLARE setUserID, prevElemNum BIGINT UNSIGNED;

    -- if userID does not match set's user_id, fail.
    IF NOT EXISTS (
        SELECT id FROM Sets WHERE (id = setID AND user_id = userID)
    ) THEN
        SET exitCode = 1; -- user does not own the set (or set doesn't exist).
    ELSE
        IF (ratValHex = "") THEN
            SET ratValHex = NULL;
        END IF;
        SET ratVal = UNHEX(ratValHex);

        SELECT rat_val INTO prevRatVal
        FROM SemanticInputs
        WHERE (
            obj_t = objType AND
            obj_id = objID AND
            set_id = setID
        );
        SELECT elem_num INTO prevElemNum
        FROM Sets
        WHERE id = setID
        FOR UPDATE;
        SELECT rat_val INTO prevRatVal
        FROM SemanticInputs
        WHERE (
            obj_id = objID AND
            set_id = setID
        )
        FOR UPDATE;

        IF (ratVal IS NOT NULL AND prevRatVal IS NULL) THEN
            INSERT INTO RecentInputs (set_id, rat_val, obj_id)
            VALUES (setID, ratVal, objID);
            INSERT INTO SemanticInputs (set_id, rat_val, obj_id)
            VALUES (setID, ratVal, objID);
            SET exitCode = 0; -- success(ful insertion of new rating).
        ELSEIF (ratVal IS NOT NULL AND prevRatVal IS NOT NULL) THEN
            INSERT INTO RecentInputs (set_id, rat_val, obj_id)
            VALUES (setID, ratVal, objID);
            UPDATE SemanticInputs
            SET rat_val = ratVal
            WHERE (
                obj_id = objID AND
                set_id = setID
            );
            SET exitCode = 0; -- success(ful update of previous rating).
        ELSEIF (ratVal IS NULL AND prevRatVal IS NOT NULL) THEN
            INSERT INTO RecentInputs (set_id, rat_val, obj_id)
            VALUES (setID, ratVal, objID);
            ... 
        END IF;
    END IF;
END //
DELIMITER ;





-- DELIMITER //
-- CREATE PROCEDURE inputOrChangeRating (
--     IN userCombID VARCHAR(17),
--     IN setCombID VARCHAR(17),
--     IN objCombID VARCHAR(17),
--     IN ratValHex VARCHAR(510),
--     -- OUT newCombID VARCHAR(17),
--     OUT exitCode TINYINT
-- )
-- BEGIN
--     DECLARE userType, objType CHAR(1);
--     DECLARE userID, setID, objID BIGINT UNSIGNED;
--     DECLARE prevRatVal, ratVal VARBINARY(255);
--     DECLARE eccreateOrFindSet TINYINT;
--
--     CALL getTypeAndConvID (userCombID, userType, userID);
--     CALL getConvID (setCombID, setID);
--     CALL getTypeAndConvID (objCombID, objType, objID);
--     SET ratVal = UNHEX(ratValHex);
--     IF NOT EXISTS (
--         SELECT * FROM Sets
--         WHERE id = setID AND user_t = userType AND user_id = userID
--     ) THEN
--         SET exitCode = 4; -- set with that id and user does not exist.
--     ELSE
--         SELECT rat_val INTO prevRatVal
--         FROM SemanticInputs
--         WHERE (
--             obj_t = objType AND
--             obj_id = objID AND
--             set_id = setID
--         );
--         -- FOR UPDATE; -- Since this search only touches one row, only that row will
--         -- be locked. *No, this might cause some weird next-key locking.. Let me
--         -- see what to do.. ...Wait no, that actually shouldn't hurt much..
--         -- ..Yes, it might hurt (by beeing slow), who knows. I think I will
--         -- actually just query the Users table FOR UPDATE, which might actually
--         -- be reasonable in the future as well to check if the user is allowed
--         -- to make more inputs today, and thereby we will then also create a
--         -- mutex lock to ensure that a user (or user group (bot)) can only input/
--         -- update one rating at a time even when using several server clients at
--         -- the same time. ..But let me implement all this at a later time..
--         IF (prevRatVal IS NULL AND ratVal IS NOT NULL) THEN
--             INSERT INTO SemanticInputs (
--                 set_id,
--                 rat_val,
--                 obj_t,
--                 obj_id
--             )
--             VALUES (
--                 setID,
--                 ratVal,
--                 objType,
--                 objID
--             ); -- This might throw error due to race condition, but only if several
--             -- clients are logged in as the same user and rates at the same time.
--             -- ...(At least I think so, because FOR SHARE shouldn't lock indices..)
--             -- If the insert succeeds, we can then update elem_num.
--             UPDATE Sets
--             SET elem_num = elem_num + 1
--             WHERE id = setID;
--             CALL insertOrUpdateRecentInput (
--                 setID,
--                 objType,
--                 objID,
--                 ratVal,
--                 prevRatVal
--             );
--             SET exitCode = 0; -- no prior rating.
--         -- nothing happens if (prevRatVal IS NULL AND ratVal IS NULL).
--         ELSEIF (prevRatVal IS NOT NULL AND ratVal IS NOT NULL) THEN
--             CALL insertOrUpdateRecentInput (
--                 setID,
--                 objType,
--                 objID,
--                 ratVal,
--                 prevRatVal
--             );
--             UPDATE SemanticInputs
--             SET rat_val = ratVal
--             WHERE (
--                 obj_t = objType AND
--                 obj_id = objID AND
--                 set_id = setID
--             );
--             SET exitCode = 2; -- overwriting an old rating.
--         ELSEIF (prevRatVal IS NOT NULL AND ratVal IS NULL) THEN
--             CALL insertOrUpdateRecentInput (
--                 setID,
--                 objType,
--                 objID,
--                 ratVal,
--                 prevRatVal
--             );
--             DELETE FROM SemanticInputs
--             WHERE (
--                 set_id = setID AND
--                 obj_t = objType AND
--                 obj_id = objID
--
--             );
--             -- This UPDATE statement might cause a harmful race condition until
--             -- I reimplement this procedure more correctly at some point.
--             UPDATE Sets
--             SET elem_num = elem_num - 1
--             WHERE id = setID;
--             SET exitCode = 2; -- overwriting an old rating.
--         END IF;
--     END IF;
-- END //
-- DELIMITER ;
