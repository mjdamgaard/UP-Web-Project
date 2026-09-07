
## Installing a localhost server

If you want to install this system as a server on your localhost, you need to:

1. Install a MySQL/MariaDB database on your computer.

2. Go to the ./sql directory and follow the install.md instructions there.

3. Create a file of the name 'config.js' in the ./src/server/db_io directory, next to the existing file called 'config_template.js'. Then copy the contents of config_template.js into your new config.js file, and change the "user" and "password" properties in the two exported objects to match the username and password of the database user that you just created as part of the previous step. (Note also that the this config.js file in this folder should be ignored by the ./.gitignore file, if you ever want to push some changes to a fork/branch of this GitHub repo.)

5. Open this directory in four separate terminals on your computer. (If using VS Code, a quick way of doing this is to open up this directory with VS Code, and then press Ctrl + Shift + C four times in quick succession).

6. With two of these terminals, start the two Node.js servers for AJAX requests, respectively located at ./src/server/ajax_server.js and ./src/server/ajax_server.js. This is done by running 'node ./src/server/ajax_server.js' in one terminal, then 'node ./src/server/login_server.js' in the other. (The node program should already be installed if you have installed npm.)

7. Now go to a third terminal and run 'node ./server_interface.js localhost -c' to create a new user account.

8. When logged into this CLI program, first type in the command 'cd semantic_entities' to change to the 'semantic_entities' directory. Then type in the single-letter command 'u' (for 'upload') in order to upload the './up_directories/semantic_entities' directory to the server.

9. Repeat this process for the 'home_app' directory again (which ought to be your second upload.) In other words, run the 'cd home_app' command, followed by the 'u' command. And continue this process for all the directories listed in the './up_directories/home_app/placeholders.json' file, whose list ought to look something like this:
    - "semantic_entities"
    - "home_app"
    - "file_browser"
    - "app_browser"
    - "utilities"
    - "home_app_01"
    - "flip_game"
    - "flip_game_01"
    - "untrusted_example"
    - "mastermind"
    - "mastermind_01"
    - "examples"

    Note that some of these directories might report a failure, but that is okay for now.

10. Now try to exit the program and start it again with the command 'node ./server_interface.js localhost -d all' And after having logged in with the same user account. Run the command 'u'. This should now re-upload all these directories with no error (hopefully). (And if you ever make a change to one of the directories, you just run 'u' to upload the changes, after having logged in the same way.)

11. Next, while logged into the 'server_interface.js' CLI program, run the command 'cd semantic_entities', followed by the command 'p' (for 'post'). You are then prompted for route that defines a post request. Copy and paste "init.sm.js./callSMF/uploadInitialEntities" (without the quotation marks) into this prompt and hit enter. That will insert some essential data into some database tables for this directory. 

12. Then do a similar thing for the 'home_app' directory: First run 'cd home_app' to go to that directory. Then run the 'p' command and insert the string "./server/init.sm.js./callSMF/_init_1" into the prompt that follows. And afterwards run 'p' once again, this time inserting "./server/init.sm.js./callSMF/_init_2" instead.

13. Now you should have uploaded and prepared all the data needed. You can then run 'npm start' in the last of the four terminals that you have opened, and this should start the main HTTP server on your localhost, and make your default browser open up that localhost server for you.



## Restarting the server

If you want to restart the server as localhost, possibly after having restarted your computer, you then just need to go through Steps 4–6 again above, needing only three terminals this time. This is of course unless you also want to make updates to a UP directory, in which case you should also run the 'node ./server_interface.js localhost -d all' command as well in a separate terminal.


## Uploading to the web instead of your localhost

If wanting to upload to e.g. up-web.org (or another website with the same API), just change 'localhost' with 'up-web.org' in all of the above.



## Troubleshooting

If you run into trouble with any of this, please don't hesitate to contact us (see ./contact_info.md).
