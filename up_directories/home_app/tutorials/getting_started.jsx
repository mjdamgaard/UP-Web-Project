
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Getting started"}</h1>
    <h2>{"About this tutorial"}</h2>
    <p>{
      "This tutorial will show you how to create your first user-programmed " +
      "(UP) app and upload it to this website!"
    }</p>
  <section>
    <h2>{"Create a user account at up-web.org"}</h2>
    <p>{
      "Before you can upload your first test app to up-web.org, you will " +
      "first of all need to create a user account."
    }</p>
    <p>{
      "Go to the top right of the page and click the user icon, then select " +
      "\"Sign up\", and enter a username and password. (Make sure to use a " +
      "strong password that you have not used anywhere else, preferably by " +
      "letting your browser generate one for you.)"
    }</p>
    <p>{
      "You also have the option to enter your e-mail address here as well, " +
      "but this is not a requirement."
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
      <ELink key="link-UPDirUploader"
        href="https://github.com/mjdamgaard/UPDirUpdater" >
        {"github.com/mjdamgaard/UPDirUpdater"}
      </ELink>,
      "."
    ]}</p>
    <p>{
      "Once you have downloaded (and unpacked) this directory to your " +
      "computer, open this directory in your terminal (or cd into it), then " +
      "run the following command to install the Node.js program:"
    }</p>
    <p>
      <code className="command">{[
        '$ npm install',
      ]}</code>
    </p>
  </section>
  <section>
    <h2>{"Uploading your first UP directory"}</h2>
    <p>{
      "You are now ready to upload and test your first UP app!"
    }</p>
    <p>{
      "If you take look in the up_directories folder, you will see that " +
      "contains a project folder called 'hello_world'. This folder contains " +
      "the source code of an \"Hello, World!\" example app, which you will " +
      "now be shown how to upload to up-web.org."
    }</p>
    <p>{
      "Make sure that you once again have your newly downloaded directory " +
      "open in a terminal."
    }</p>
    <p>{
      "Then run the following command:"
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
      "enter to upload the contents of the up_directories/hello_world " +
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
      "hexadecimal number:"
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
        'Success\n',
        'dir #HOME_DIR_ID>\n',
      ]}</code>
    </p>
    <p>{
      "And you might also note that the command line prompt now says:"
    }</p>
    <p>
      <code className="command">{[
        'dir #HOME_DIR_ID>\n',
      ]}</code>
    </p>
    <p>{
      "where \"HOME_DIR_ID\" is the same hexadecimal number."
    }</p>
    <p>{
      "This means that your the up_directories/hello_world directory and " +
      "its files are now uploaded to the virtual file system of the server, " +
      "in a new home directory located at /1/HOME_DIR_ID on the server side."
    }</p>
    <p>{
      "The uploader program stores this HOME_DIR_ID in a file called " +
      "'.id.js', which it creates inside of the targeted directory the " +
      "first time you upload it. That way, when you re-upload the same " +
      "directory at any time in the future, as long as you have not deleted " +
      "or edited this .id.js file, the directory will be uploaded to the " +
      "same /1/HOME_DIR_ID directory on the server."
    }</p>
    <p>{
      "By the way, the initial \"1\" in the paths shown above is the ID of " +
      "up-web.org (which might in the future by just one node in a " +
      "whole distributed and decentralized network of \"UP nodes\")."
    }</p>
    <p>{
      "Now, in order to view your uploaded files, you can now try to go to " +
      "up-web.org/f/1/HOME_DIR_ID, where you should make sure to substitute " +
      "\"HOME_DIR_ID\" in this URL by the hexadecimal number from the " +
      "prompt. So for instance, if your new home directory was assigned an " +
      "ID of \"123ab\", you should go to up-web.org/f/1/123ab."
    }</p>
    <p>{
      "This should lead you to a simple file browser app where you can view " +
      "the uploaded files."
    }</p>
    <p>{
      "Then to verify that these files were indeed uploaded from you " +
      "computer, try to open the hello_world/app1.jsx file in a " +
      "text editor on your computer, and then replace the three dots on " +
      "Ln. 4 with \"World!\" instead, such that the full line reads:" 
    }</p>
    <p>
      <code className="jsx">{[
        'return <h1>{"Hello, World!"}</h1>;',
      ]}</code>
    </p>
    <p>{
      "Then re-upload your directory by once again typing in the 'u' command " +
      "into the uploader program as before (provided you are still logged in):" 
    }</p>
    <p>
      <code className="command">{[
        'dir #HOME_DIR_ID> u',
      ]}</code>
    </p>
    <p>{
      "And after hopefully seeing the same successful output as before, you " +
      "can now go to up-web.org/f/1/HOME_DIR_ID/app1.jsx (once again " +
      "replacing \"HOME_DIR_ID\" with the number from before) to see the " +
      "now edited file!" 
    }</p>
    <p>{
      "(Feel free to edit this text into something else as well if you want, " +
      "but note that other users can also view the same files.)" 
    }</p>
  </section>
  <section>
    <h2>{"Uploading your first UP app!"}</h2>
      <p>{
        "Having uploaded the directory with the source code for your first " +
        "\"Hello, World!\" app, it does not take a lot to also upload and " +
        "view the app itself." 
      }</p>
      <p>{
        "First let us have a look at the hello_world/em.js file. " +
        "(You can view this file either on your own computer or at " +
        "up-web.org/f/1/HOME_DIR_ID/em.js)." 
      }</p>
      <p>{
        "On Ln. 14 of this file, you will see an exported object called " +
        "'app'. This object is a database entity, that when uploaded " +
        "to the right part of the database will will represent your UP app." 
      }</p>
      <p>{
        "(The \"em\" in em.js is by the way short for \"entity module.\")" 
      }</p>
      <p>{
        "Now to upload this entity, all you need to do is to first of all " +
        "go to " +
        "up-web.org/f/1/HOME_DIR_ID/em.js;get/app (where \"HOME_DIR_ID\" " +
        "should of course once again by substituted with your particular " +
        "home directory ID), while also making sure that you are still " +
        "logged in, by the way. Then you should see a button that says " +
        "'Submit and go to page.' Now, click that button in order to upload " +
        "this entity."
      }</p>
      <p>{
        "Provided that you were indeed logged in, this should now bring you " +
        "to a newly " +
        "created page for your new app component. For now, do not bother too " +
        "much with what is on this page, apart from a large link saying " +
        "'View component' near the top of the page. Click that link!"
      }</p>
      <p>{
        "This will bring you to a page where you can view your new " +
        "\"Hello, World!\" app component. But first you have to dismiss a " +
        "warning about not falling for phishing attempts, as well as not " +
        "generally trust the information of the viewed component, as it " +
        "has been uploaded by a user. But since the user in this case is " +
        "yourself, you can quickly dismiss this warning."
      }</p>
      <p>{
        "And now you will see your app rendered on the page, which, unless " +
        "you have edited it to say something else (or never " +
        "substituted the dots for \"World!\" in the first place), should now " +
        "say:"
      }</p>
      <p>{
        <div className="text-display">
          <h1>{"Hello, World!"}</h1>
        </div>
      }</p>
      <p>{
        "You have now learned how to upload your first UP app!"
      }</p>
  </section>
  <section>
    <h2>{"Changing the metadata of your component"}</h2>
      <p>{
        "..."
      }</p>
  </section>
</div>;



// <section>
  {/* <h2>{"..."}</h2> */}
  {/* <p>{ */}
    // "You are also very welcome to send an e-mail to mads@up-web.org if you " +
    // "have any questions. And if you run into any bugs that you don't know " +
    // "how to solve, please feel free to send an e-mail as well, as I " +
    // "might be able to help you."
  // }</p>
{/* </section> */}