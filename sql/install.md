
# Installation

First install a MySQL database, then log-in as a user with root privileges on that database, or at least with privileges enough to create stored functions, as well as stored procedures and tables.

To log in, open a terminal and type in the command 'mysql -u YOUR_USERNAME -p',
where 'YOUR_USERNAME' is replaced with you username, and then type in your password when asked to do so.

Then you need to install the four SQL files in this folder: main_db.sql, main_db_sp_lig.sql, user_db.sql, and user_db_sp_lib.sql.

This is done by typing in e.g.
'\\. YOUR_FULL_PATH/sql/main_db_sp_lib.sql' <!-- (with only a single backslash in front, if you are reading this file as a plain text) --> after the 'mysql>' prompt, where 'YOUR_FULL_PATH' is replaced by the absolute path to this GitHub repository on your computer.

Do this for all the four files, or alternatively, substitute 'YOUR_FULL_PATH' in the install.sql file instead, and just run that instead.

