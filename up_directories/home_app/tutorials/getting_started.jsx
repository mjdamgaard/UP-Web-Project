



export function render() {
  return (
    <div>
      <h1>{"Tutorial: Basics"}</h1>
      <section>
        <h2>{"About this tutorial"}</h2>
        <p>{
          "This tutorial shows how to get started with " +
          "the User-Programmable Web (UP Web), and explains the core basics " +
          "of the using the system."
        }</p>
        <p>{
          "For a brief overview of what the UP Web is, see the first section " +
          "of the "}
          <span className="link" onClick={() => {
            this.trigger("goToAboutPage");
          }}>{"about page"}</span>{"."
        }</p>
        <p>{
          "To get the most out of this tutorial, it is recommended that " +
          "the you create a user account (no e-mail " +
          "required for now), and " +
          "also make sure to have Node.js installed, which you will need " +
          "in order to upload and edit your first UP web app."
        }</p>
        <p>{
          "However, if not wanting to do this at first, the tutorial can " +
          "also be followed regardless, as there are hints throughout the " +
          "tutorial in the form of " +
          "images which shows the expected outcomes to the tasks."
        }</p>
      </section>

      <section>
        <h2>{"Installation"}</h2>
        <p>{
          "To carry out the tasks of this tutorial, you need to first of " +
          "need to install Node.js, if this is not currently installed on " +
          "your computer. You will need this to execute a Node.js program " +
          "that lets you upload and and edit the source code that this " +
          "tutorial asks you to. " +
          "(Again, you can also choose to follow the tutorial without doing " +
          "this.) "
        }</p>
        <p>{
          "If Node.js is not yet installed on your computer, you can do so " +
          "following this instruction: "}<i>{"[TODO: Insert link]"}</i>{"."
        }</p>
        <p>{
          "And then you also need to clone the following GitHub repository: "
          }<i>{"[TODO: Insert link]"}</i>{
          ". If you don't know how to do that, here's a quick guide: " +
          ""}<i>{"[TODO: Insert link]"}</i>{"."
        }</p>
        <p>{
          "And finally, you also need to create a user account if you have " +
          "not " +
          "created one already ("}<b>{"no e-mail required"}</b>{" at this " +
          "point). " +
          "This should be straightforward to do. Just click on the " +
          "top-right user icon, and then click \"Sign up.\""
        }</p>
      </section>

      <section>
        <h2>{"Creating your first web app with this framework"}</h2>
        <p>{
          "No you are ready to create your first web app with the UP Web " +
          "framework. To do this, go open a terminal and cd to the GitHub " +
          "repository that you just downloaded. Then run the following command."
        }</p>
        <p><code className="command">{
          // TODO: This leads nowhere yet. Make it lead to an app with the
          // tasks of this tutorial (that the reader will be tasked to edit). 
          "$ node ./dir_uploads/upload_dir.js ./up_directories/tutorials/intro"
        }</code></p>
        <p>{
          "This will now prompt you for the username and password of your " +
          "account. (If you used an auto-generated password, you can find " +
          "it in the Settings → Password menu of your browser.)"
        }</p>
        {/* TODO: Insert image here */}
        <p>{
          "On success, you now have a simple program where you can type in " +
          "the command 'u' in order to upload/update your directory, or 'e' " +
          "to exit the program. Try to upload the directory by typing a " +
          "'u' in the command line, followed by Enter."
        }</p>
        {/* TODO: Insert image here */}
        <p>{
          "If that succeeded, great! You have now uploaded your first app " +
          "with this system. You can go to [TODO: Insert link] to see it, " +
          "where <id> is the number that was assigned to your new directory. " +
          "See Fig. 3 for how to find that id. [TODO: Insert figure.]"
        }</p>
        {/* TODO: Also implement the home page app such that you can go to
        specific user-created app via the URL path.*/}
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