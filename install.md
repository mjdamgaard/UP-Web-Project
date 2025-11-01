
## Installing a localhost server

If you want to install this system as a server on your localhost, you need to:

1. Install a MySQL database on your computer.

2. Go to the ./sql directory and follow the install.md instructions there.

3. Create a file of the name 'db_config.js' in the ./src directory (such that the relative file path from here becomes ./src/db_config.js), and add the following two lines in it:

        export const user = YOUR_MYSQL_USERNAME;
        export const password = YOUR_MYSQL_PASSWORD;

    where YOUR_MYSQL_USERNAME and YOUR_MYSQL_PASSWORD are replaced with the username and password of a user to your MySQL databases that you created as part of the previous step.

5. Open this directory in four separate terminals on your computer. (If using VS Code, a quick way of doing this is to open up this directory with VS Code, and then press Ctrl + Shift + C four times in quick succession).

6. With two of these terminals, start the two Node.js servers for AJAX requests, respectively located at ./src/server/ajax_server.js and ./src/server/ajax_server.js. This is done by running 'node ./src/server/ajax_server.js' in one terminal, then 'node ./src/server/login_server.js' in the other. (The node program should already be installed if you have installed npm.)

7. Now go to a third terminal and run 'npm start'. After a short while, this will open your browser with the website running. However, since the database is currently empty, you will get some errors. But you should still be able to access the account menu at the top right and create a new user. Do so.

8. Then go to the fourth terminal and run 'node ./update_dir.js ./up_directories/semantic_entities' and log in with the username and password of the account that you just created.

9. When logged in type in 'u' (for 'upload') and press Enter. This uploads the 'semantic_entities' UP directory to your database. After you have done this, also check that the prompt has now turned into 'dir #1>', which means that your new UP directory has the ID of '1' in the database.

10. Then, while logged in this way, you should also post the initial data for this UP directory. Do so by pressing 'p' (for 'post') followed by Enter. Then you are prompted for a "relative route" (after a '~#'), where you type in (or copy-paste) 'init.sm.js/callSMF/uploadInitialEntities'. This has the effect of calling the 'uploadInitialEntities()' server module function (SMF) located in ./up_directories/semantic_entities/init.sm.js. You then need to do the same thing for all the other functions exported by this module. So type in 'p' once again (followed by Enter), and then run 'init.sm.js/callSMF/insertInitialModerators', and then do the same for the 'postInitialScores01()' SMF, etc.

11. Now exit this program (or open up another terminal) and run 'node ./update_dir.js ./up_directories/home_app', and then log in with the same user. Here you don't need to upload any initial data, so just type 'u' followed by Enter, and that's it. And afterwards, also make sure that prompt now says 'dir #2>', as we need the semantic_entities and the home_app directories to get the IDs of '1' and '2', respectively.

12. And that's it, you should now be able to go to your browser and refresh the localhost page, in which case you should have a functional version of the website running on a local server.



## Restarting the server

If you want to restart the server as localhost, possibly after having restarted your computer, you then just need to go through Steps 4–6 again above, needing only three terminals this time. This is of course unless you also want to make updates to a UP directory, in which case you should also run the 'node ./update_dir.js ./up_directories/YOUR_DIRECTORY' command as well in a separate terminal.



## Trouble shooting

If you run into trouble with any of this, please don't hesitate to contact me (see ./contact_info.md).
