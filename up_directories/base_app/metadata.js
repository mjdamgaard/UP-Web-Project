export default {
  "Name": "Base app",
  "Is ready for use": true,
  "Description": <div>
    <p>
      A "base app" is the fundamental app that used to load other apps within
      it, depending on the URL. And it also defines a global header menu and
      layout surrounding the loaded apps.
    </p>
    <p>
      When loading an app, the base app should generally query for the best
      version of the given app, depending on popularity and on individual user
      preferences. And it can even query for the best version of itself first,
      which means that the users can also update the global header menu and
      frame around the loaded app.
    </p>
  </div>,
};