
import * as ILink from 'ILink';
import * as ELink from 'ELink'; 


export function render() {
  return indexPage;
}

const indexPage = <div className="text-page">
  <h1>The User-Programmable Web</h1>

  <section>
    <h2>A user-programmable platform</h2>
    <p>
      This is a user-programmable platform: A platform where the
      users themselves are free to fork and extend all the apps on it,
      and build new ones.
    </p>
    <p>
      And each individual end user is also free to choose exactly which
      version of each app they want to use themselves, without having to go to
      a different web domain or download a different app.
    </p>
    <p>
      When a user uploads source code for a new app, the platform interprets
      this source code and sandboxes it such that other users can try it out
      without fear of getting hacked.
    </p>
    <p>
      This sandbox even extends to the back end, which means that users are
      also free to program their own back-end data structures and their own
      algorithms for their apps.
    </p>
    <p>
      And if an app extends an existing one, then once this new version is
      reviewed and declared as trusted by the user community, the new app
      version can also be given access the same back-end API.
    </p>
    <p>
      For instance, if a user uploads a new version of an existing SoMe app
      with some added feature, such as a different algorithm or some new
      tool, then once the user community has ensured that this new version
      behaves as intended, and does not try to trick its users in any way,
      it can go from accessing a temporary, mock-up data structure to
      accessing the same data structure as its predecessor.
    </p>
    <p>
      For more on user-programmable platforms, follow
      <ELink key="link-github-repo-user-programmable-1"
        href="https://github.com/mjdamgaard/UP-Web-Project/blob/main/user-programmable_platform.md">
        this link
      </ELink>.
    </p>
  </section>

  <section>
    <h2>Business model</h2>
    <p>
      This platform is currently fully open-source, and will likely continue
      to have a fully open-source branch in the future. However, in order to
      be able to actually pay the developers who contribute source code to the
      platform, we also propose a model which is designed to be a golden middle
      way between open and closed source. We call this model an
      <ELink key="link-github-repo-tech-co-op-1"
        href="https://github.com/mjdamgaard/UP-Web-Project/blob/main/open_tech_cooperative.md">
        open tech cooperative
      </ELink>.
    </p>
    <p>
      In this model, the developers who contribute source code to the platform
      does so under a license that allows anyone to extend the source code, as
      long as they publish it under the same license. However, the rights to
      use the software is not given to the public at large, but is instead
      given specifically to the platform, allowing it to use the software to
      earn a profit.
    </p>
    <p>
      This profit can be generated similarly to any conventional platform,
      namely via paid subscriptions and/or by showing ads on the platform.</p>
    <p>
      However, in order to assure the contributing developers and the end users that
      the platform has their best interests at heart, the platform will
      use a cooperative company model where the users and developers end up
      governing the platform.
    </p>
    <p>
      This platform will thus not only put its users in charge of its
      development, but will even put the users in charge of everything
      eventually, by essentially turning into a
        <ELink key="link-consumers-co-op"
          href="https://en.wikipedia.org/wiki/Consumers%27_co-operative">
          consumers' cooperative
        </ELink>
      (or a "user's cooperative," if you will), once a certain level of
      maturity has been reached.
    </p>
    <p>
      For more on the model of open tech cooperatives, follow
      <ELink key="link-github-repo-tech-co-op-2"
        href="https://github.com/mjdamgaard/UP-Web-Project/blob/main/open_tech_cooperative.md">
        this link
      </ELink>.
    </p>
  </section>

  <section>
    <h2>Advantages</h2>
    <section>
      <h3>A great creative advantage</h3>
      <p>
        A user-programmable platform like this will have a great advantage in
        the creative department, since it essentially has all the benefits of
        open source without the drawbacks:
      </p>
      <p><ul>
        <li>
          Like any closed-source platform, this platform
          will be able to reward the developers fairly for their contributions.
        </li>
        <li>
          But at the same time, like any open-source platform, this platform will also be able to
          draw on the entire world for coming up with new creative ideas for
          how to extend the apps on the platform, and for implementing those
          ideas.
        </li>
        <li>
          These contributors might also be users of the software themselves,
          who might therefore be motivated to contribute in order to make the
          product better for themselves and their peers, on top of being
          motivated by the monetary rewards.
        </li>
        <li>
          And like open source, this platform will also ensure that the users
          of the software will not end up being squeezed for money by the
          owners, in the process known as
          <ELink key="link-enshittification-1"
            href="https://en.wikipedia.org/wiki/Enshittification">
            enshittification
          </ELink>.
          Instead the users themselves will end up as the owners of the
          software, effectively.
        </li>
      </ul></p>
      <p>
        With these benefits, the platform will be able to draw in many more
        creative contributions than any closed-source platform can hope to
        draw from its workers.
      </p>
      <p>
        And especially in an age where AI continues to advance as a development
        tool, and the process of going from idea to implementation gets
        easier and easier, a platform's success will to an increasing extend
        rely on its ability to generate new creative ideas for improving the
        platform.
      </p>
      <p>
        Thus, a user-programmable platform will have a great competitive
        advantage in the long run over any other platform that does not
        to the same extend engage its users and put them in charge of its
        development.
      </p>
    </section>

    <section>
      <h3>The users can trust the platform</h3>
      <p>
        Another great benefit of this platform is that the end users will be
        able to trust the platform not to undergo
        <ELink key="link-enshittification-2"
          href="https://en.wikipedia.org/wiki/Enshittification">
          enshittification
        </ELink>
        in the end.
      </p>
      <p><ul>
        <li><i>
          Are you tired of platforms whose algorithms always tries to funnel
          you into a dopamine loop, without being able to adjust this?
        </i></li>
        <li><i>
          Are you tired of rude comments and posts not being sufficiently
          suppressed, or of misinformation and inappropriate content not being
          sufficiently moderated?
        </i></li>
        <li><i>
          Are you tired of search results being dominated by paid-for entires,
          rather than just showing you the things that are the most relevant?
        </i></li>
        <li><i>
          Are you tired of AI slop and clickbait?
        </i></li>
        <li><i>
          Are you tired of your data being sold to third parties, or of the
          lack of transparency in this regard?
        </i></li>
        <li><i>
          Are you tired of ads that just keep increasing in volume?
        </i></li>
        <li><i>
          Or are you tired of updates in general that make things worse?
        </i></li>
      </ul></p>
      <p>
        With a user-programmable platform, you will no longer have
        to worry about any of these problems. Here the <i>users</i> are in
        charge, and each user can freely choose which version of each app they
        want to use.
      </p>
      <p>
        And if a significant part of the user base wants a new feature, it is
        only a matter time before someone will implement it, and collect the
        rewards for doing so.
      </p>
    </section>
  </section>

  <section>
    <h2>More information</h2>
    <p>
      For more information on what sets a user-programmable platform apart
      from other platforms,
      follow
      <ELink key="link-github-repo-user-programmable-2"
        href="https://github.com/mjdamgaard/UP-Web-Project/blob/main/user-programmable_platform.md">
        this link
      </ELink>.
    </p>
    <p>
      And for more information about the proposed governance structure and
      business model of the platform, follow
      <ELink key="link-github-repo-tech-co-op-3"
        href="https://github.com/mjdamgaard/UP-Web-Project/blob/main/open_tech_cooperative.md">
        this link
      </ELink>.
    </p>
  </section>

  <section>
    <h2>Explore this prototype</h2>
    <p>
      This website already implements a functional prototype of a
      user-programmable platform, where users can freely upload apps and app
      components to it.
    </p>
    <p>
      To explore some examples of some user-uploaded app components, go to
      the
      <ILink key="link-comp" href="/ep/1/1/em1.js;get/components" >
        Components page
      </ILink>.
      (You will also find
      this app on that list, since this whole web app is built and uploaded
      as a user-programmed app itself.)
      After clicking on an element in the list, click on 'View component' in
      order to see it. 
    </p>
    <p>
      And to get started on building and uploading user-programmed apps
      yourself, go to the
      <ILink key="link-tut-1" href="/tutorials">
        Tutorial pages
      </ILink>.
    </p>
    <p>
      By the way, this prototype will also soon be given a start page with a
      clearer overview of all the user-uploaded apps,
      and where the users will be able to see how they can easily switch
      between different versions of each app.
    </p>
  </section>

</div>;
