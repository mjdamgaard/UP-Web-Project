
# Installation

First install mysql (or mariadb), and create two databases, preferably called 'mainDB' and 'userDB', respectively.

Then log-in as a user with root privileges, or at least with privileges enough to create stored functions, as well as stored procedures and tables. To do this, open a terminal and type in the command
        mysql -u YOUR_USERNAME -p
  where 'YOUR_USERNAME' is replaced with you username. Then type in your password when asked to do so.

Now install the four SQL files in this folder, namely main_db.sql, main_db_sp_lig.sql, which should be executed in the 'mainDB' database, and user_db.sql, and user_db_sp_lib.sql, which should be executed in the 'userDB' database.

If you read the ./install_template.sql file, you see a template for the commands necessary to do this. And remember to first execute 'USE mainDB;', and also to switch databases in the middle with 'USE userDB;'.

