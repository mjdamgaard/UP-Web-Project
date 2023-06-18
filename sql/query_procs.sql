
SELECT "Query procedures";

-- DROP PROCEDURE selectInputSet;
-- DROP PROCEDURE selectRating;
-- DROP PROCEDURE selectRecentInputs;
--
-- DROP PROCEDURE selectTerm;
-- DROP PROCEDURE selectTermID;
--
-- DROP PROCEDURE selectUsername;
-- DROP PROCEDURE selectUserInfo;
-- DROP PROCEDURE selectText;
-- DROP PROCEDURE selectTextSubstring;
-- DROP PROCEDURE selectBinary;
-- DROP PROCEDURE selectBinarySubstring;
--
-- DROP PROCEDURE private_selectCreator;
-- DROP PROCEDURE private_selectCreations;



DELIMITER //
CREATE PROCEDURE selectInputSet (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN ratingRangeLo VARBINARY(255),
    IN ratingRangeHi VARBINARY(255),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        CONV(rat_val, 10, 16) AS ratVal,
        subj_id AS subjID
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        (ratingRangeLo IS NULL OR rat_val >= ratingRangeLo) AND
        (ratingRangeHi IS NULL OR rat_val <= ratingRangeHi)
    )
    ORDER BY
        CASE WHEN isAscOrder THEN rat_val END ASC,
        CASE WHEN NOT isAscOrder THEN rat_val END DESC,
        CASE WHEN isAscOrder THEN subj_id END ASC,
        CASE WHEN NOT isAscOrder THEN subj_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectRating (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN
    SELECT CONV(rat_val, 10, 16) AS ratVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        subj_id = subjID
    );
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE selectRecentInputs (
    IN startID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED
)
BEGIN
    SELECT
        user_id AS userID,
        pred_id AS predID,
        CONV(rat_val, 10, 16) AS ratVal,
        subj_id AS subjID,
        changed_at AS changedAt
    FROM RecentInputs
    WHERE id >= startID
    ORDER BY id ASC
    LIMIT maxNum;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE selectTerm (
    IN termID BIGINT UNSIGNED
)
BEGIN
    SELECT
        context_id AS cxtID,
        def_str AS defStr,
        def_term_id AS defTermID
    FROM Terms
    WHERE id = termID;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectTermID (
    IN cxtID BIGINT UNSIGNED,
    IN defStr VARCHAR(255),
    IN defTermID BIGINT UNSIGNED
)
BEGIN
    IF (cxtID = 0) THEN
        SET cxtID = NULL;
    END IF;
    IF (defTermID = 0) THEN
        SET defTermID = NULL;
    END IF;

    SELECT id AS termID
    FROM Terms
    WHERE (
        context_id <=> cxtID AND
        def_str = defStr AND
        def_term_id <=> defTermID
    );
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE selectUsername (
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT username AS username
    FROM Users
    WHERE id = userID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectUserInfo (
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT
        username AS username,
        public_keys_for_authentication AS publicKeys
    FROM Users
    WHERE id = userID;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE selectText (
    IN textID BIGINT UNSIGNED
)
BEGIN
    SELECT str AS textStr
    FROM Texts
    WHERE id = textID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTextSubstring (
    IN textID BIGINT UNSIGNED,
    IN length SMALLINT UNSIGNED,
    IN start INT
)
BEGIN
    SELECT SUBSTRING(str, start, length) AS textStr
    FROM Texts
    WHERE id = textID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectBinary (
    IN binID BIGINT UNSIGNED
)
BEGIN
    SELECT bin AS bin
    FROM Binaries
    WHERE id = binID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectBinarySubstring (
    IN binID BIGINT UNSIGNED,
    IN length SMALLINT UNSIGNED,
    IN start INT
)
BEGIN
    SELECT SUBSTRING(bin, start, length) AS bin
    FROM Binaries
    WHERE id = binID;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE private_selectCreator (
    IN termID BIGINT UNSIGNED
)
BEGIN
    SELECT user_id AS userID
    FROM PrivateCreators
    WHERE term_id = termID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE private_selectCreations (
    IN userID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT term_id AS termID
    FROM PrivateCreators
    WHERE user_id = userID
    ORDER BY
        CASE WHEN isAscOrder THEN term_id END ASC,
        CASE WHEN NOT isAscOrder THEN term_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;
