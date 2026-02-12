
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as VariableAppLinks from "./VariableAppLinks.jsx";


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Getting started"}</h1>
    {/* <h2>{"About this tutorial"}</h2>
    <p>{
      "This tutorial will show you how to create your first user-programmed " +
      "(UP) app and upload it to this website."
    }</p> */}
  <section>
    <h2>{"Create a user account"}</h2>
    <p>{
      "Before you can upload your first test app to up-web.org, you will " +
      "first of all need to create a user account."
    }</p>
    <p>{
      "Go to the top right of the page and click the user icon, then select " +
      "\"Sign up,\" and enter a username and password. (Make sure to use a " +
      "strong password that you have not used anywhere else, preferably by " +
      "letting your browser generate one for you.)"
    }</p>
    <p>{
      "You also have the option to enter your e-mail address, " +
      "but this is not a requirement at this point."
    }</p>
  </section>
  <section>
    <h2>{"Installing Node.js"}</h2>
    <p>{
      "You will also need to make sure that you have Node.js installed on " +
      "your computer."
    }</p>
    <p>{[
      "If you do not already have Node.js installed, follow the instructions " +
      "at ",
      <ELink key="link-node-install" href="https://nodejs.org/en/download" >
        {"nodejs.org/en/download"}
      </ELink>,
      "."
    ]}</p>
  </section>
  <section>
    <h2>{"Installing a program for uploading UP directories"}</h2>
    <p>{
      "Finally, you will also need to install a small Node.js program which " +
      "allows you to quickly and easily upload and update a whole UP " +
      "directory at once."
    }</p>
    <p>{[
      "You can get this program by cloning or downloading the GitHub " +
      "repository at ",
      <ELink key="link-UPDirUpdater"
        href="https://github.com/mjdamgaard/UPDirUpdater" >
        {"github.com/mjdamgaard/UPDirUpdater"}
      </ELink>,
      "."
      // " (To simply download the repository as a ZIP folder, click on the " +
      // "green 'Code' button, then click 'Download ZIP.')"
    ]}</p>
    <p>
      Once you have downloaded (and unpacked) this directory to your
      computer, open this 'UPDirUpdater' directory in your
      terminal/command prompt, or
      <ELink key="link-cd"
        href="https://en.wikipedia.org/wiki/Cd_(command)" >
        cd
      </ELink>
      into it, then run the following command to install the Node.js program.
      (Do not include the initial '$'.)
    </p>
    <p>
      <code className="command">{[
        '$ npm install',
      ]}</code>
    </p>
  </section>
  <section>
    <h2>{"Use an editor that supports JSX syntax"}</h2>
    <p>{
      "While it is not a strict requirement, it is also strongly " +
      "recommended that you use an editor/IDE that supports syntax " +
      "highlighting for JSX files, and especially if you want to proceed to " +
      "the next tutorials after this one."
    }</p>
    <p>{[
      "An example of an IDE that supports JSX syntax highlighting is ",
      <ELink key="link-vscode" href="https://code.visualstudio.com/" >
        {"VS Code"}
      </ELink>,
      "."
    ]}</p>
  </section>
  <section>
    <h2>{"Uploading your first UP app"}</h2>
    <p>{
      "You are now ready to upload and test your first UP app!"
    }</p>
    <p>{
      "If you take look in the 'up_directories' folder inside the " +
      "'UPDirUpdater' that you have " +
      "just downloaded, you will see that it " +
      "contains a project folder called 'hello_world'. This folder contains " +
      "the source code of an \"Hello, World!\" example app, which we will " +
      "now show you how to upload to up-web.org."
    }</p>
    <p>{
      "Make sure that you once again have your the 'UPDirUpdater' directory " +
      "open in a terminal. " +
      "Then run the following command. (Again, do not include the initial '$'.)"
    }</p>
    <p>
      <code className="command">{[
        '$ node ./update_dir.js ./up_directories/hello_world up-web.org',
      ]}</code>
    </p>
    <p>{
      "This will prompt you for the username and password for your user " +
      "account."
    }</p>
    <p>{
      "Then once you are logged in, you simply need to type in 'u' and hit " +
      "enter to upload the contents of the 'up_directories/hello_world' " +
      "folder:"
    }</p>
    <p>
      <code className="command">{[
        'dir #> u',
      ]}</code>
    </p>
    <p>{
      "Try doing this now. If the upload is successful, you should see " +
      "the following output, only where \"HOME_DIR_ID\" is replaced by a " +
      "hexadecimal number."
    }</p>
    <p>
      <code className="command">{[
        'Uploading...\n',
        'Uploaded /1/HOME_DIR_ID/.id.js\n',
        'Uploaded /1/HOME_DIR_ID/app1.jsx\n',
        'Uploaded /1/HOME_DIR_ID/app2.css\n',
        'Uploaded /1/HOME_DIR_ID/app2.jsx\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponent1.jsx\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponent2.jsx\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponentHOME_DIR_ID.jsx\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponent4.jsx\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponent4_2.jsx\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponent5.jsx\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponent6.jsx\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponent7.css\n',
        'Uploaded /1/HOME_DIR_ID/ExampleComponent7.jsx\n',
        'Uploaded /1/HOME_DIR_ID/em.js\n',
        'Success',
      ]}</code>
    </p>
    <p>{
      "And you might also note that the command line prompt now says"
    }</p>
    <p>
      <code className="command">{[
        'dir #HOME_DIR_ID>\n',
      ]}</code>
    </p>
    <p>{
      "where HOME_DIR_ID is substituted by the same hexadecimal number."
    }</p>
    <p>{
      "This means that the 'up_directories/hello_world' directory and " +
      "its files are now uploaded to the virtual file system of the server, " +
      "in a new home directory located at '/1/HOME_DIR_ID' on the server side."
    }</p>
    <p>{
      "The uploader program stores this HOME_DIR_ID in a file called " +
      "'.id.js', which is created inside of the targeted directory the " +
      "first time you upload it. That way, when you re-upload the same " +
      "directory at any time in the future, as long as you have not deleted " +
      "or edited this '.id.js' file, the directory will be uploaded to the " +
      "same '/1/HOME_DIR_ID' directory on the server."
    }</p>
    <p>
      Now, in order to see your new app rendered, insert the given
      HOME_DIR_ID that the uploader program shows you in the following input
      field.
      This will provide you with some useful links to your uploaded files, and
      to the new app itself.
    </p>
    <p>
      <div className="text-frame">
        <VariableAppLinks key="var-app-links" />
      </div>
    </p>
    <p>
      If you follow the first link in this list, after making sure that you
      have typed in the correct HOME_DIR_ID, you will be lead to a file browser
      app where you can browse the files that you have just uploaded.
    </p>
    <p>
      And to see your new "Hello, World!" app, do the the following.
    </p>
    <ol>
      <li>
        Follow the second link above,
        namely the one that says "app entity definition" (after you have
        inserted the correct HOME_DIR_ID).
      </li>
      <li>
        At the top of the new page that this leads you to, there is button
        which says "Submit and go to page." Make sure that you are logged in,
        then click this button.
      </li>
      <li>
        You should then be redirected to another page which contains some
        information about your new app. (You can edit this information later.)
        And at the top of this page, you should see a big link that says
        "View component." Click this link in order to go a page where you can
        see you new app rendered.
      </li>
    </ol>
    <p>
      The first time you view your new app, however, it will likely be blurred
      out, and a warning message will appear at the top. This message warns you
      about not falling for phishing attempts when viewing untrusted apps, and
      is displayed whenever the user community has not yet reviewed the given
      app and declared it as trusted.
    </p>
    <p>
      However, since you can obviously trust your own app yourself, feel free
      to just skip this message right away, and even check the "Do not warn
      against this component again" option.
    </p>
    <p>
      You can now see your new uploaded app! It should currently look as
      follows.
    </p>
    <p>{
      <div className="text-display">
        <h1>{"Hello, World!"}</h1>
      </div>
    }</p>
    <p>
      Now try to open up the file called 'app1.jsx', located at
      UPDirUpdater/up_directories/hello_world/app1.jsx on your own computer,
      using your editor of choice. You will see that this file simply reads
    </p>
    <p>
      <code className="jsx">{[
        'export function render() {\n',
        '  return <h1>Hello, World!</h1>;\n',
        '}',
      ]}</code>
    </p>
    <p>
      This is the file that currently defines your app. (We will explain why
      this is in a moment.) As you can see, this module file simply
      defines a function called render(), which
      returns a {"<h1>"} HTML element that reads "Hello, World!". 
    </p>
    <p>
      Now go ahead and try to edit this file by replacing the word "World" with
      something else, perhaps your own name, or whatever you like.
    </p>
    <p>
      Then save the file and go back to the uploader program, and once again
      upload the directory the same way as you did before. (If you still
      have the program open from before, all you need to do is type in the
      'u' command again and hit Enter.)
    </p>
    <p>
      <code className="command">{[
        'dir #HOME_DIR_ID> u',
      ]}</code>
    </p>
    <p>
      Now go to the page of your app once again (and refresh the page if
      needed). You should now immediately be able to see the changes that you
      have just
      made to your app:
    </p>
    <p>{
      <div className="text-display">
        <h1>Hello, <i>{"<Word of your choice>"}</i>!</h1>
      </div>
    }</p>
    <p>
      You have now uploaded and edited your first UP app!
    </p>
  </section>


  <section>
    <h2>Editing the metadata of your app</h2>
    <p>
      In order to understand why the 'app1.jsx' file was assigned as the root
      component of your new app, open up the file called 'em.js', in the
      same UPDirUpdater/up_directories/hello_world directory.
    </p>
    <p>{
      "On Ln. 15 of this file, you will see an exported object called " +
      "'app,' whose definition reads" 
    }</p>
    <p>
      <code className="jsx">{[
        'export const app = {\n',
        '  "Class": "/1/1/em1.js;get/components",\n',
        '  "Name": APP_NAME,\n',
        '  "Component path": abs(COMPONENT_PATH),\n',
        '  "Example component path": undefined,\n',
        '  "No margins": NO_MARGINS,\n',
        '  "No header": NO_HEADER,\n',
        '  "GitHub repository": GITHUB_REPO_URL,\n',
        '  "Creator(s)": () => fetchCreatorEntPath(),\n',
        '  "Description": abs("./em.js;get/appDescription"),\n',
        '};'
      ]}</code>
    </p>
    <p>
      This object contains all the metadata needed in order for the "home app"
      of up-web.org (i.e. the app that this website uses as its root) to
      render your app. {/* , as well as some additional useful metadata. */}
      And indeed, this was the very object that you submitted when you pressed
      the "Submit and go to page" button in the three-step process listed
      above, before you were able to see your app.
    </p>
    <p>
      When you submit this object, the home app creates a new database entity
      that contains a reference to this 'app' export. And when you go to the
      page of that entity, i.e. the page that the "Submit and go to page"
      button redirected you to, the home app will load the data contained in
      this 'app' object in order to read the relevant metadata.
    </p>
    <p>
      Note, by the way, that clicking the same button again will not alter the
      state of the database once the app has already been submitted, so feel
      free to use the same three-step path to get to your app page whenever you
      like.
    </p>
    <p>
      Now, if you want to edit the metadata of your app, it is best not to
      edit the 'app' object itself directly, but rather to edit the
      values of the five constants that you see just above it in the
      'em.js' file:
    </p>
    <p>
      <code className="jsx">{[
        'const APP_NAME = "YOUR_APP_NAME";\n',
        'const COMPONENT_PATH = "./app1.jsx";\n',
        'const GITHUB_REPO_URL = "URL_TO_YOUR_GITHUB_REPO";\n',
        'const NO_MARGINS = false;\n',
        'const NO_HEADER = false;'
      ]}</code>
    </p>
    <p>
      And here you might first of all note the particular 'COMPONENT_PATH'
      constant, which currently has the value of "./app1.jsx". As you might
      have guessed, this constant contains a relative path to the JSX module
      that is assigned to be the root component of the given app. 
    </p>
    <p>
      In fact, have a go at changing this path to "./app2.jsx" instead,
      such that the line now reads
    </p>
    <p>
      <code className="jsx">{[
        'const COMPONENT_PATH = "./app2.jsx";',
      ]}</code>
    </p>
    <p>
      Since the 'app2.jsx' currently also returns {"'<h1>Hello, World!</h1>'"}
      from its render() function, you can see that if you try to re-upload
      your directory once again, and refresh the app page, you
      should now see the same "Hello, World!" text as you did initially: 
    </p>
    <p>{
      <div className="text-display">
        <h1>{"Hello, World!"}</h1>
      </div>
    }</p>
    <p>
      You now know how to specify the root component of your app!
      (You will learn more about the
      syntax and the structure of these '.jsx' component modules in the
      <ILink key="link-tut-2" href="~/jsx-components" >
        next tutorial
      </ILink>.)
    </p>
    <p>
      It is also worth briefly discussing the other four metadata
      constants that you see above.
    </p>
    <p>
      First of all, we have the 'APP_NAME' constant, which defines the name of
      your app. This name will often be displayed when your app is referenced,
      e.g. if the app appears as part of a list of app components. And the
      app's name will furthermore also appear in the standard URL to the page
      of your app, as you can see if you go to your app page and have a look at
      the URL.   
    </p>
    <p>
      Feel free to go ahead and try to change this 'APP_NAME' constant, e.g. to
      "Hello World app", and see if the URL does not indeed change as well.
      (Remember to re-upload you directory once again before refreshing the
      page.)
    </p>
    <p>
      Next, there is the 'GITHUB_REPO_URL' constant, which you
      ought to specify at some point if you want your share your app with
      others. (It is strongly recommended to use a public GitHub
      repository for your app.)
    </p>
    <p>
      And finally, there is the 'NO_MARGINS' and 'NO_HEADER' constants,
      which are meant to affect how your app is positioned on the webpage. 
      The 'NO_MARGINS' constant thus specifies, if true, that the app should
      define its own margins. And the 'NO_HEADER' constant, once implemented,
      will specify that the app should define its own header, meaning that the
      header of the home app will be hidden. (However, this latter constant
      is not implemented yet and will currently have no effect on how your app
      is displayed.)
    </p>
  </section>

  <section>
    <h2>Final remarks</h2>
    <p>{[
      "You now know how to upload and edit UP apps. The following couple " +
      "of tutorials will then teach you how to create more advanced " +
      "components, as well as how to " +
      "style these components. And once you finish ",
      <ILink key="link-tut-4" href="~/useful-things-to-know">
        {"Tutorial 4"}
      </ILink>,
      ", you should have all the knowledge required to start making " +
      "your own client-side apps."
    ]}</p>
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
    <p>
      And if you have any questions at all, e.g. about specific bugs
      that you might encounter, or about
      the system or the project in general, please don't hesitate to post
      your question to one of the forums listed at the bottom the
      <ILink key="link-home-page" href="/" >
        home page
      </ILink>.
      Or alternatively, you can also e-mail up-web.org directly at
      mads@up-web.org.
    </p>
  </section>
</div>;



  {/* <p>{
    "By the way, the initial \"1\" in the paths shown above is the ID of " +
    "up-web.org (which might in the future by just one node in a " +
    "whole distributed and decentralized network of \"UP nodes\")."
  }</p> */}

  {/* <p>{
    "(The \"em\" in em.js is by the way short for \"entity module.\")" 
  }</p> */}
