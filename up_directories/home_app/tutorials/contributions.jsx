
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
      "If you have started building a new app or feature and you want other " +
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
      "who are interested in the same topic is able to find it."
    }</p>
    <p>{
      "When we reach that point, this tutorial will be edited such that it " +
      "teaches you how to this, and not least also how to add a new " +
      "subclasses yourself. " +
      "But for now just post to the main class."
    }</p>
    <p>{
      "You do this by clicking the bar right under the link that says " +
      "'Belongs to Projects' link to expand the list menu. Then click the " +
      "'Add new' button, and write the project description in the text field " +
      "that is followed by a 'Post' button."
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
      "button. Where you should enter the (server-side) path to your app " +
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
        '  "Use full screen": USE_FULL_SCREEN,\n',
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
      "\"/1/HOME_DIR_ID/em.js;get/app\" into the aforementioned text field."
    }</p>

  </section>

</div>;
