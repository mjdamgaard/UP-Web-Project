
SELECT "Creating main DB...";
\. YOUR_FULL_PATH/sql/main_db.sql

SELECT "Creating main DB interface...";
\. YOUR_FULL_PATH/sql/main_db_sp_lib.sql

SELECT "Creating user DB...";
\. YOUR_FULL_PATH/sql/user_db.sql

SELECT "Creating user DB interface...";
\. YOUR_FULL_PATH/sql/user_db_sp_lib.sql