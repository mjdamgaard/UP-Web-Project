



export function render() {
  return (
    <div>
      <h1>{"Tutorial: Introduction to the User-Programmable Web"}</h1>
      <section>
        <h2>{"About this tutorial"}</h2>
        <p>{
          "This tutorial is a quick introduction to the overall concept " +
          "of the User-Programmable Web (UP Web), and how to get started " +
          "with it."
        }</p>
        <p>{
          "To get the most out of this tutorial, the tutorial will at some " +
          "point request that the reader creates a user (no e-mail " +
          "required), and " +
          "also makes sure to have Node.js installed, in order to create and " +
          "edit their first app with the system. However, the tutorial will " +
          "also provide hints in the form of images showing what the user " +
          "supposed to see after carrying out the tasks. So the tutorial " +
          "should also be understandable even if one does not want to carry " +
          "out these tasks."
        }</p>
      </section>

      <section>
        <h2>{"Overview of the UP Web"}</h2>
        <p>{
          "The idea of the UP Web is built around a new JavaScript (JS) " +
          "framework (name TBD), which as a special feature allows the user-" +
          "provided code to be executed in a sandboxed JS interpreter. " +
          "This allows users to share code modules with each other with a " +
          "very high degree of freedom, and very little oversight required."
        }</p>
        <p>{
          "The shared modules can't link or redirect the user to any harmful " +
          "sites, they can't access any sensitive data of the user without " +
          "the user's own permission, and they can't corrupt the user's " +
          "existing data. " +
          "Of course, phishing attempts will always be a possibility, " +
          "but the users that are interested enough to seek out and try new " +
          "modules made by others will generally not be the same kind of " +
          "users who are likely to fall for such attempts."
        }</p>
        <p>{
          "The great benefit of all this is that it allows for the " +
          "user-provided JS modules to be served directly from a database, " +
          "with no " +
          "verification required, neither of the syntax or the semantics of " +
          "the code. This means that it will cost very little to set up a " +
          "new web app with the system: as cheap as making a series of posts " +
          "of a similar size to, say, an existing social media web app."
        }</p>
        <p>{
          "The system doesn't care whether the uploaded data is a comment " +
          "or a piece of source code to a new web app. " +
          "And the same applies when it comes to serving that data to other " +
          "users. So why should it cost any more to make a new web app than " +
          "to make a couple of posts."
        }</p>
        <p>{
          "This is paired with the fact that the JS framework in question " +
          "is highly modular, copying most of its design from React "}<i>{
          "[TODO: Insert link here]"}</i>{" (but with less boilerplate code " +
          "required), which means that users can import " +
          "front-end (JSX) components from other users' applications or " +
          "libraries, as well as functions and classes, etc. " +
          "This means that users will in practice be able to create whole " +
          "new web apps with very little source code required."
        }</p>
        <p>{
          "And it is not just front-end components that can be shared and " +
          "collaborated on among the users. The backend of the servers that " +
          "serves these user-made modules also allow these modules to be " +
          "run "}<i>{"server-side"}</i>{"! And these server modules are " +
          "able to read and write data from the database, but only in a " +
          "designated area of the database, which means that server modules " +
          "can't read or alter the data stored by other server modules."
        }</p>
        <p>{
          "And once again, the cost of making these server modules is " +
          "basically only determined by the cost of uploading the source " +
          "code. " +
          // "For although " +
          // "the stored data is compartmentalized between the server modules, " +
          // "it is nonetheless still stored on the same fixed number of " +
          // "relational tables in the database, meaning that "
          "For even if the server module creates several database tables, " +
          "these tables are only virtual tables: The data is actually stored " +
          "on just a few, already existing relational tables, which means " +
          "that it cost next to nothing to create new tables. And when it " +
          "comes to the data that is being uploaded to these tables, that " +
          "is not the concern of the developer/admin of the server module, " +
          "but rather it is the uploading users who carries the cost for the " +
          "uploads. (And each user will get some capacity of upload data " +
          "that they can use for free each week.)"
        }</p>
        <p>{
          "The goal of the UP Web is then to create a distributed database " +
          "of web apps and backend solutions/algorithms, and the modular " +
          "components from which they are built. " +
          "Furthermore, the dream here is not just to add bunch of user-made " +
          "web apps to the existing market, but also in particular to make " +
          "some of these apps highly adjustable for the individual user. " +
          "Since the web apps will be built from large database of " +
          "modular components and solutions, there is no reason why the " +
          "individual user shouldn't be able to get the versions of the " +
          "components that suits them the best. And even more importantly, " +
          "there is no reason why the individual user shouldn't be able " +
          "to choose exactly the algorithms that "}<i>{"they"}</i>{" want! " +
          "(This also includes how those algorithms handles the user's data, " +
          "and what part of that data is shared with other server modules " +
          "and/or third parties, and importantly what part is not.)"
        }</p>
        <p>{
          "Thus, imagine a web where each user gets to " +
          "choose the design and underlying algorithms of the apps that " +
          "suits them the best."
        }</p>
      </section>

      <section>
        <h2>{"Getting started"}</h2>
        <h3>{"Installation"}</h3>
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

        <h3>{"Creating your first web app with this framework"}</h3>
        <p>{
          "No you are ready to create your first web app with the UP Web " +
          "framework. To do this, go open a terminal and cd to the GitHub " +
          "repository that you just downloaded. Then run the following command."
        }</p>
        <p><tt>{
          // TODO: This leads nowhere yet. Make it lead to an app with the
          // tasks of this tutorial (that the reader will be tasked to edit). 
          "$ node ./dir_uploads/upload_dir.js ./up_directories/tutorials/intro"
        }</tt></p>
        <p>{
          "This will now prompt you for the username and password of your " +
          "account. (If you used an auto-generated password, you can find " +
          "it in your browser's Settings → Password menu.)"
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
          "In the following sections, you will be tasked with editing it to " +
          "do more than that."
        }</p>
      </section>
    </div>
  );
}