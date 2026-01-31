
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Sharing your contributions"}</h1>
  <section>
    <h2>{"How to share an ongoing project"}</h2>
    <p>{[
      "If you have started working a new app or feature and you want other " +
      "users to join in, you can make a post describing it on the ",
      <ILink key="link-proj" href="/entPath/1/1/em1.js;get/projects" >
        {"Projects"}
      </ILink>,
      " page."
    ]}</p>
    <p>{
      "On this page you see a class of 'Projects,' whose members are all the " +
      "user-submitted projects."
    }</p>
    <p>{
      "If you are one of the first users of this website, you can just post " +
      "your project to the 'Projects' class itself. But once enough users " +
      "have joined, it will often be better to find a specific subclass of " +
      "the 'Projects' class, and post it under that instead, such that users " +
      "who are interested in the same topic are able to find it."
    }</p>
    <p>{
      "When we reach that point, this tutorial will be edited such that it " +
      "teaches you how to this, and not least also how to add a new " +
      "subclasses yourself. " +
      "But for now just post to the main class."
    }</p>
    <p>{
      "You do this by clicking the bar right under the link that says " +
      "'Belongs to Projects' in order to expand the list menu. Then click " +
      "the 'Add new' button, and write the project description in the text " +
      "field that is followed by a 'Post' button."
    }</p>
    <p>{
      "(Please excuse the cluttered layout. Again, this website is only " +
      "a prototype at this stage.)"
    }</p>
    <p>{
      "And after you have submitted the text, you also need to give it a " +
      "positive score on the list, which is done by adjusting the slider " +
      "that appears, then clicking the 'Submit' button underneath it."
    }</p>

  </section>

  <section>
    <h2>{"How to share a new app"}</h2>
    <p>{[
      "When your new app is ready to be tried out by others, you can post " +
      "it on the ",
      <ILink key="link-comp" href="/entPath/1/1/em1.js;get/components" >
        {"Components"}
      </ILink>,
      " page."
    ]}</p>
    <p>{[
      "This is done in a similar way as how you post a project, except " +
      "that you need to use the text field that is followed by a 'Submit' " +
      "button. Here you should enter the (server-side) path to your app " +
      "component entity, which is the object that contains the metadata " +
      "about your component, as was introduced in ",
      <ILink key="link-tut-1" href="~/getting-started" >
        {"Tutorial 1"}
      </ILink>,
      "."
    ]}</p>
    <p>{
      "In that tutorial, the component entity object looked like this:"
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
    <p>{
      "And its absolute (server-side) path was given by " +
      "\"/1/HOME_DIR_ID/em.js;get/app\", where \"HOME_DIR_ID\" is replaced " +
      "by the hexadecimal ID that was assigned to your directory."
    }</p>
    <p>{
      "So if you for instance wanted to share your \"Hello, World!\" app " +
      "from that tutorial, you would need to submit " +
      "\"/1/HOME_DIR_ID/em.js;get/app\" into the aforementioned text field, " +
      "and then give it a positive score."
    }</p>

  </section>

  <section>
    <h2>{"How to log a contribution"}</h2>
    <p>{[
      "Whenever you create or modify a user-programmed app, it is also a " +
      "good idea to log it on the ",
      <ILink key="link-contr" href="/entPath/1/1/em1.js;get/contributions" >
        {"Contributions"}
      </ILink>,
      " page."
    ]}</p>
    <p>{
      "And here you can also log any other kind of contribution that you " +
      "have made " +
      "to the project, which you want other users to know about."
    }</p>
    <p>{
      "Given that your logs can be confirmed as being true, they might " +
      "then earn monetary rewards at some point in the future."
    }</p>
    <p>{
      "In fact, up-web.org intends to let its sponsors and donors help " +
      "decide how the money should be distributed among all the " +
      "contributors to the project, namely by voting " +
      "on the best algorithm that determines this. And this algorithm might " +
      "very well take these logged contributions into account, and how they " +
      "are rated by other users."
    }</p>
    <p>{
      "And apart from maybe earning monetary rewards, having made " +
      "contributions to the project will also likely increase your esteem " +
      "among other users, who might then give your votes and scores a " +
      "greater weight in the various algorithms."
    }</p>
    <p>{
      "Just make sure that your contribution logs can be confirmed, which " +
      "in terms of source code contributions can best be done by making " +
      "sure that your source code is also hosted in a public GitHub " +
      "repository."
    }</p>

  </section>


  {/* TODO: Consider adding a Discussions section here as well at some point */}
</div>;
