



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