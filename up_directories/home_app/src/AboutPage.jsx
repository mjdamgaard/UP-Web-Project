

export function render() {
  return <div className="about-page">

    <h1>A user-programmable platform</h1>
    <p>
      This is a user-programmable platform: a platform where the users are
      actually able to extend and fork the apps on the platform themselves,
      and build new ones! And each individual user is then free to choose
      whichever version of each app that they like! 
    </p>
    <p>
      The user-uploaded apps are interpreted in a safe sandbox, which
      prevents users from hacking each other. And this sandbox extends to
      the back as well, meaning that the users can even implement their own
      back end for their apps, both in terms of the data structures and the
      algorithms.
    </p>

    <h2>Use cases</h2>
    <p>

    </p>



    <h2>How to use</h2>
    <p>
      On the home page of this website, you will see a list of user uploaded
      apps of a few different varieties that you can try out by clicking on
      them. For instance, if you click on the app titled 'Flip game,' you can
      see a little puzzle game as an example. And if you click on the triple
      bar ("≡") button on the right instead, you will see a list of alternative
      versions you can choose from.
    </p>
    <p>
      The list of apps even include the 'Home app,' which implements the app
      that defines the home page of this website. That's right, everything you
      see on this website is actually implemented as a user-uploaded app, and
      can be modified and extended by the users. If you thus click on the
      triple bar ("≡") to the right for the 'Home app,' you can explore and
      choose between other home page apps, uploaded by users.
    </p>
    <p>
      When logged in, you can also click a star ("☆") button to mark a given
      version as you favorite, which means that it will load instead the next
      time you load the given app.
    </p>
    <p>
      You can also rate the app versions via the arrow ("⇧⇩") buttons. If a new
      version of an app becomes more popular than the previous one, and if the
      user community as verified its safety, the new version will automatically
      take the place of the old one. Thus, you don't have to manually update
      your apps yourself by choosing new favorite versions. You can also just
      lean back and let the user community be in charge of updating your apps.
    </p>
    <p>
      The whole algorithm of how apps are updated is by the way implemented by
      the aforementioned 'Home app'
    </p>
    <p>
      (Tutorials for how to get started uploading your own user-programmed apps
      will be ready soon, and will be linked to here.)
    </p>
  </div>;
}
