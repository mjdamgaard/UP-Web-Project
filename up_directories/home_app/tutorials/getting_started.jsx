
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Getting started"}</h1>
    <p>{
      "This tutorial will show you how to upload and edit your first " +
      "\"Hello, World!\" UP app."
    }</p>
  <section>
    <h2>{"Create a user account at up-web.org"}</h2>
    <p>{
      "Before you can upload your first test app to up-web.org, you will " +
      "first of all create a user account."
    }</p>
    <p>{
      "Go to the top right of the page and click the user icon, then select " +
      "\"Sign up\", and enter a username and password. (Make sure to use a " +
      "strong password that you have not used anywhere else, preferably by " +
      "letting your browser generate one for you.)"
    }</p>
    <p>{
      "You can also enter your e-mail address as well, but this is not a " +
      "requirement."
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
    <p>{
      "And after this, you are now ready to upload and test your first UP app!"
    }</p>
  </section>
  <section>
    <h2>{"Uploading your first UP app"}</h2>
    <p>{
      "If you take look in the up_directories folder, you will see that " +
      "contains a project folder called 'hello_world'. This folder contains " +
      "the source code of an \"Hello, World!\" example app, which you will " +
      "now try to upload to up-web.org."
    }</p>
    <p>{
      "..."
    }</p>
  </section>
</div>;




export function render() {
  return (
    <div>
      <h1>{"Tutorial 1: Getting started!"}</h1>
      <section>
        <h2>{"About this tutorial"}</h2>
        <p>{
          "This tutorial shows you how to create your first user-programmed " +
          "(UP) app and upload it to this website!"
        }</p>
      </section>

      <section>
        <h2>{"Requirements"}</h2>
        <p>{
          "If your computer is already set up for building React apps, " +
          "you should be fine. Otherwise do the following two things."
        }</p>
        <ul>
          <li>{
            // TODO: Make these and all the following links ELinks instead,
            // after having made that dev component.
            "Install Node.js. (See https://nodejs.org/en/download or " +
            "https://docs.npmjs.com/downloading-and-installing-node-js-" +
            "and-npm for how to do this.)"
          }</li>
          <li>{
            "(Recommended) Make sure to use an editor or IDE with syntax " +
            "highlighting for JSX. (Visual Studio Code has this, at least if " +
            "you install a package for it.)"
          }</li>
        </ul>
        <p>{
          "And apart from this you also need to:"
        }</p>
        <ul>
          <li>{
            "Download/clone *[No, fork..] the GitHub repository at ..." +
            "TODO: Make another GitHub repo specifically for uploading " +
            "directories, not to localhost, but to the website."
          }</li>
          <li>{
            "Create a user account on this website. (No e-mail required.)"
          }</li>
        </ul>
      </section>

      <section>
        <h2>{"Creating your first \"Hello, world\" app"}</h2>
        <p>{
          "No you are ready to create your first web UP app. " +
          "To do this, go open a terminal and cd into the GitHub " +
          "repository that you just downloaded. Then run the following command."
        }</p>
        <p><code className="command">{
          "$ node ./upload_dir.js ./up_directories/tutorial_apps/hello_world"
        }</code></p>
        <p>{
          "This will now prompt you for the username and password of your " +
          "account. (If you used an auto-generated password, you can find " +
          "it in the Settings → Password menu of your browser.)"
        }</p>
        <p>{
          "On success, you now have a simple program where you can type in " +
          "the command 'u' in order to upload/update your directory, or 'e' " +
          "to exit the program. Try to upload the directory by typing a " +
          "'u' in the command line, followed by Enter."
        }</p>
        <p>{
          "If that succeeded, great! You have now uploaded your first app " +
          "with this system. You can go to [TODO: Insert link] to see it, " +
          "where <id> is the number that was assigned to your new directory. " +
          "See Fig. 3 for how to find that id. [TODO: Insert figure.]"
        }</p>
        <p>{
          "As you see, your new app currently does nothing other then print " +
          '"Hello, World!" on the page. [TODO: Insert image of that.] ' +
          "In the following sections, you will be tasked with making it " +
          "do a lot more."
        }</p>
      </section>
    </div>
  );
}


// <section>
  {/* <h2>{"..."}</h2> */}
  {/* <p>{ */}
    // "You are also very welcome to send an e-mail to mads@up-web.org if you " +
    // "have any questions. And if you run into any bugs that you don't know " +
    // "how to solve, please feel free to send an e-mail as well, as I " +
    // "might be able to help you."
  // }</p>
{/* </section> */}