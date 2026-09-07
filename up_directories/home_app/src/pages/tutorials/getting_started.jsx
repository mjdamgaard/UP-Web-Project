
import * as ILink from 'ILink';
import * as ELink from 'ELink';
import * as VariableAppLinks from "./VariableAppLinks.jsx";


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>Getting started</h1>
  <section>
    <h2>Introduction</h2>
    <p>
      This tutorial will teach you how to upload and edit your
      first "user-programmed" (UP) app.
    </p>
    <p>
      For this you will need first to create a user account, and then install a
      command line interface program on your computer which allows you to
      upload and update the source code for your apps on the server.
    </p>
  </section>
  <section>
    <h2>Create a user account</h2>
    <p>
      Before you can upload your first test app to up-web.org, you will
      first of all need to create a user account.
    </p>
    <p>
      Go to the top right of the page and click the user icon, then select
      "Sign up," and enter a username and password. (Make sure to use a
      strong password that you have not used anywhere else, preferably by
      letting your browser generate one for you.)
    </p>
    <p>
      You also have the option to enter your e-mail address,
      but this is not a requirement at this point.
    </p>
  </section>
  <section>
    <h2>Installing Node.js</h2>
    <p>
      You will also need to make sure that you have Node.js installed on
      your computer.
    </p>
    <p>
      If you do not already have Node.js installed, follow the instructions at
      <ELink key="link-node-install" href="https://nodejs.org/en/download" >
        nodejs.org/en/download
      </ELink>.
    </p>
  </section>
  <section>
    <h2>Installing a program for uploading UP directories</h2>
    <p>
      Finally, you will also need to install a small Node.js program which
      allows you to quickly and easily upload and update a whole UP
      directory at once, via a simple command line interface.
    </p>
    <p>
      You can get this program by cloning or downloading the GitHub 
      repository at
      <ELink key="link-server-interface"
        href="https://github.com/mjdamgaard/up-server-interface" >
        github.com/mjdamgaard/up-server-interface
      </ELink>.
    </p>
    <p>
      Once you have downloaded this directory to your computer, open this
      'up-server-interface' directory in your terminal/command prompt, or
      <ELink key="link-cd"
        href="https://en.wikipedia.org/wiki/Cd_(command)" >
        cd
      </ELink>
      into it, then run the following command to install the Node.js program.
    </p>
    <p>
      <code className="command">{[
        'npm install',
      ]}</code>
    </p>
  </section>
  {/* <section>
    <h2>Use an editor that supports JSX syntax highlighting</h2>
    <p>
      While it is not a strict requirement, it is also strongly
      recommended that you use an editor/IDE that supports syntax
      highlighting for JSX files, and especially if you want to proceed to
      the next tutorials after this one.
    </p>
    <p>
      An example of an IDE that supports JSX syntax highlighting is
      <ELink key="link-vscode" href="https://code.visualstudio.com/" >
        {"VS Code"}
      </ELink>.
    </p>
  </section> */}
  <section>
    <h2>Uploading your first UP app</h2>
    <p>
      You are now ready to upload and test your first UP app!
    </p>
    <p>
      If you take look in the 'up_directories' folder inside the
      'up-server-interface' that you have just downloaded, you will see that it
      contains a project folder called 'hello_world'. This folder contains
      the source code of a "Hello, World!" example app, which we will
      now show you how to upload to up-web.org.
    </p>
    <p>
      To run the program that you have just installed, once again open up
      'up-server-interface' directory in your terminal (if it is not still
      open), then run the following command.
    </p>
    <p>
      <code className="command">{[
        'node ./server_interface.js up-web.org -d hello_world',
      ]}</code>
    </p>
    <p>
      This will prompt you for the username and password for your user account.
    </p>
    <p>
      (If using Windows, it seems that you have to manually type in both the
      username and the password here, as copy-pasting them apparently does not
      seem to work for the time being.)
    </p>
    <p>
      Then once you are logged in, you simply need to type in 'u' and hit
      enter to upload the contents of the 'up_directories/hello_world'
      folder:
    </p>
    <p>
      <code className="command">{[
        'hello_world> u',
      ]}</code>
    </p>
    <p>
      Try doing this now. If the upload is successful, you should see
      the following output, only where "HOME_DIR_ID" is replaced by a
      hexadecimal number (such as '123ab' or 'ab123ef').
    </p>
    <p>
      <code className="command">{[
        'Uploading files in hello_world...\n',
        '- Created /1/HOME_DIR_ID/main.jsx\n',
        '- Created /1/HOME_DIR_ID/metadata.js\n',
        'Files in hello_world was uploaded.\n',
      ]}</code>
    </p>
    <p>
      This means that the contents of 'up_directories/hello_world' have now
      been uploaded to server, in a new home directory located
      at '/1/HOME_DIR_ID' server-side.
    </p>
    <p>
      You can also get this home directory ID by typing in the following
      command.
    </p>
    <p>
      <code className="command">{[
        'hello_world> id',
      ]}</code>
    </p>
    <p>
      Try to insert this hexadecimal ID into the following field. This will
      then provide you with a link to your new "Hello, World!" app, as well as
      a link the server-side files that you have just uploaded.
    </p>
    <p>
      <div className="text-frame">
        <VariableAppLinks key="var-app-links" />
      </div>
    </p>
    <p>
      To go and see your newly uploaded app, simply follow the first of the two
      links above. This will bring you to a webpage where you will see a
      warning about not falling for phishing attempts. This warning is shown
      for all apps that has not yet been reviewed by the user community.
      But since you are the author of the app, as long as you have inserted the
      right "HOME_DIR_ID" in the filed above, you can of course go right ahead
      and dismiss that warning. 
    </p>
    <p>
      Once you have dismissed the warning, you should see the following.
    </p>
    <p>
      <div className="text-display">
        <h1>Hello, World!</h1>
      </div>
    </p>
    <p>
      Congratulations! You have just uploaded your first UP app!
    </p>
    <p>
      Now to edit this app, open up the file called 'main.jsx' inside the
      'up_directories/hello_world' directory in a text editor/IDE of your
      choice, and preferably one that supports syntax highlighting for JSX
      files. You will see that is contents read:
    </p>
    <p>
      <code className="jsx">{[
        'export function render() {\n',
        '  return <h1>Hello, World!</h1>;\n',
        '}',
      ]}</code>
    </p>
    <p>
      Now go ahead and try to edit this file by replacing the word "World" with
      something else, perhaps your own name, or whatever you like.
    </p>
    <p>
      Then save the file and go back to the server_interface.js program in your
      terminal, and once again upload the directory the same way as you did
      before. (If you still have the program open from before, all you need to
      do is type in the 'u' command again and hit Enter.)
    </p>
    <p>
      <code className="command">{[
        'hello_world> u',
      ]}</code>
    </p>
    <p>
      Now go to the page of your app once again (and refresh the page if
      needed). You should now immediately be able to see the changes that you
      have just made to your app:
    </p>
    <p>
      <div className="text-display">
        <h1>Hello, <i>{"<Word of your choice>"}</i>!</h1>
      </div>
    </p>
    <p>
      You have now edited your first UP app!
    </p>
  </section>

  <section>
    <h2>Deleting an uploaded directory</h2>
    <p>
      If you ever want to delete your uploaded UP directory again, ... <i>TODO:
      Implement the command to remove a directory, then finish this section.</i>
    </p>
  </section>

  {/* <section>
    <h2>Final remarks</h2>
    <p>{([
      "You now know how to upload and edit UP apps. The following couple " +
      "of tutorials will then teach you how to create more advanced " +
      "components, as well as how to " +
      "style these components. And once you finish ",
      <ILink key="link-tut-4" href="~/useful-things-to-know">
        {"Tutorial 4"}
      </ILink>,
      ", you should have all the knowledge required to start making " +
      "your own client-side apps."
    ])}</p>
    <p>
      Then once you are ready to move on to creating apps that upload
      and download data from the database, Tutorials
      <ILink key="link-tut-5" href="~/server-modules">
        5
      </ILink>
      and
      <ILink key="link-tut-6" href="~/db-queries">
        6
      </ILink>
      will teach you how.
    </p>
  </section> */}

  <footer>
    <div className="prev-link"></div>
    <div className="next-link">
      <ILink key="link-tut-2" href="../jsx-components">
        Next tutorial
      </ILink>
    </div>
  </footer>
</div>;
