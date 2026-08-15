export default {
  "Name": "Base app",
  "Is ready for use": true,
  "Description": <div>
    <h2>Base app</h2>
    <h3>Summary</h3>
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
      the general frame around the loaded app.
    </p>
    <h3>API notes</h3>
    <p>
      All base apps should conform to following web API: If the first segment
      starts with "o-" followed by a hexadecimal string, treat the hexadecimal
      string as a directory ID and load the ("original") app component defined
      by the main.jsx" file of that directory. And if the URL starts with "s-"
      instead, load the ("standard") app that is the most popular current
      version of that app (where the "popularity" measure is free to be
      redefined by the base app version). And if the whole segment consists
      of a hexadecimal string with no prefix, load the current best version of
      the app based both on "popularity" <i>and</i> on the user's individual
      preferences (if logged in).
    </p>
    <p>
      After having loaded the given app, the base app should also generally
      replace the same first segment (using the JSXInstance.replaceURL()
      method) to a segment defined by the loaded app, which is supposed to be
      most senior version of the app that implements the same web API. By doing
      this, it means that when a user shares a URL with another user, the base
      app will start from this most senior app version and fetch the best
      version of that app given the preferences of the user who loads it. This
      thus allows users with different app preferences to share URLs with each
      other in a way where the overall semantics of the shared URL always
      remains the same, but where different users who loads the URL can still
      get their own app preferences.
    </p>
    <p>
      Lastly, if the first segment equals "base" followed by second segment
      that is the directory ID of a trusted base app version, load that
      particular base app (and instruct it to not load an updated version of
      itself).
    </p>
    {/* TODO: Add a 'More info' section with a link for more info. */}
  </div>,
};