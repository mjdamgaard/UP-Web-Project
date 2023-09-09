# Change the config file of this folder!

Change the config file of this folder to match the your setup of the SDB.

To install this prototype and run it, you will first need a PHP server (I am
using Apache 2) and a MySQL server. (These can be easily installed and run on
your computer. See https://www.php.net/manual/en/install.php for how to install
PHP and https://dev.mysql.com/doc/mysql-getting-started/en/ for how to install
MySQL.)

And when you have your MySQL server installed, create a databases and change
the config files of this folder
to match the passwords and names that you choose.

Install the SDB in that database by first running
$ `mysql -u YOUR_USERNAME -p -D YOUR_DATABASE_NAME`,
followed by
mysql> `\. YOUR_FULL_PATH/sql/install/compile_sdb.sql`.
