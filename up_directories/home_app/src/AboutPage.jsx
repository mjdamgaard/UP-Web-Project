

export function render() {
  return <div className="about-page">

    <h1>A user-programmable platform</h1>
    <p>
      This is a "user-programmable" platform: a platform where the users
      themselves are actually able to extend and fork the apps on it,
      and build new ones! And each individual user is free to choose
      whichever version of each app that they like! 
    </p>
    <p>
      The user-uploaded apps are interpreted in a safe sandbox, which
      prevents users from hacking each other. And this sandbox even extends to
      the back as well, which means that the user-uploaded apps even get to
      implement their own back end as well, both in terms of the data
      structures and the algorithms!
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
      can be modified and extended by the users themselves! If you thus click
      on the triple bar ("≡") to the right for the 'Home app,' you can explore
      and choose between other home page apps uploaded by users.
    </p>
    <p>
      When logged in, you can also click a star ("☆") button to mark a given
      version as your favorite, which means that this version will be the one
      that is loaded the next time you open the given app.
    </p>
    <p>
      You can also rate the app versions via the arrow ("⇧⇩") buttons. If a new
      version of an app becomes more popular than the previous one, and if the
      user community has verified its safety, the new version will automatically
      take the place of the old one. Thus, you don't have to manually update
      your apps yourself by continuously choosing new favorite versions. You
      can also just lean back and let the user community be in charge of
      updating your apps.
    </p>
    <p>
      By the way, the whole algorithm of how apps are updated is implemented
      via the aforementioned 'Home app,' which the users are also free to
      fork and change. Thus, the users even get control over how their apps are
      automatically updated.
    </p>
    <p>
      <i>A tutorial for how to get started creating and uploading your own
      user-programmed apps will be available soon!</i>
    </p>


    <h2>Business model</h2>
    <p>
      It will basically be free for app-developing users to upload new apps to
      the network, except for the miniscule cost of storing the source code
      itself. And the rest of the costs, namely in terms of computational
      resources and storage space for the data uploaded by the users of the
      apps, will instead be carried be those users themselves.  
    </p>
    <p>
      The users of the apps pay for their resource consumption either by
      watching ads on the platform, or via subscription plans.  
    </p>
    <p>
      The developing users can either choose to license their apps completely
      open-source, which means that they can be used by other user-programmable
      platforms as well, as part of a decentralized, open-source network.
      Or they can choose to give exclusive licensing rights to this platform
      in particular, allowing it to monetize their apps more efficiently.    
    </p>
    <p>
      A sizable portion of the revenue of the platform will then be used to
      reward these app developers for their contributions. (The exact
      percentage is TBD.) And if investments and/or revenue is lacking at
      first, the company behind the platform might choose to reward the early
      contributors in stock units instead, which will also have the benefit of
      giving the developers a vested interest and a vote in the company.
    </p>


    <h2>Some exciting use cases</h2>


  </div>;
}
