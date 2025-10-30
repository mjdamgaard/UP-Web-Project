


// TODO: Make this intro much more snappy and eye-catching (shorter paragraphs,
// lists, and more (sub)headers, and get to the key selling points immediately,
// preferably in a list).


export function render() {
  return (
    <div>
      <h1>{"Introduction to the User-Programmable Web (UP Web)"}</h1>
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

    </div>
  );
}