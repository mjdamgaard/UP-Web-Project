
# Notes about the current implementation and how to extend it


## Outline of the current implementation

The current prototype of a user-programmable platform that this GitHub repo implements uses a custom JS interpreter to very carefully sandbox all user-uploaded code, both in the front end and in the back end.

The job of the sandbox that the interpreter implements is the following.

* It has to make sure that the program cannot call unsafe native functions directly, at least not without special permission.
<!--  -->
* It has to keep track of the resource usage, in particular in the back end where the used "gas" (a.k.a. "resource tokens") is deducted from the user's account (at least for POST requests).
<!--  -->
* In the front end, it has to make sure that no unsafe HTML is inserted in the DOM tree.

* And it also has to be able to isolate front-end components from each other such that they cannot interfere with the HTML or the style of outside components, or nested components that has been isolated within them.
<!--  -->
* In the back end, the sandbox has to make sure that a back-end module can only interact directly with its own part of the database/storage space.
<!--  -->
* It also has to take care of user authentication in a separate layer such that the back-end modules does not have to implement this themselves (but only has to take care of the 'authorization' part).
<!--  -->
* And it has to keep track of where the each request originated, which can either be a given (isolated) front-end component or a given back-end module. This allows the back-end modules to check that a request originated from a valid source, similar to how the [Origin header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin) is used for HTTP requests across different domains.
<!--  -->
* Lastly, the sandbox has to keep track of the permissions of any function that is called, and make sure to throw an error if that function does something that it is not permitted to. These permissions depends on the context in which the function was called. (For instance, one front-end component might be trusted to link to any external website that it wants to, while another might not.)

<!--
There are also a bunch of little things that are too many to list. For instance, my implementation also prevents users from mutating each others modules, by making immutability the default. And it guards against users accidentally injecting downloaded JSX into their components, even though they are also still *able* to download on use JSX from other users. And there's many more things. 
-->

The way that the current interpreter keeps track of permissions and requests origins is to keep a separate environment of permission flags and request origins, etc., which is inherited only between function calls (not from the declaration environments of the functions).



## Shortcomings

The current implementation works, but the fact that everything is currently based around a JS interpreter first of all means that all user-made programs has to be based on JS/TS, even on the back end. And it also slows the applications down compared to the native JS interpreter.

Furthermore, the current implementation only implements *one* framework for building front-end components (a framework similar to React).

But luckily, there is a way to extend the current implementation such that users can first of all get to program in essentially any front-end framework that they want.

And there is even a way to extend the back end as well such that users can also use essentially any language and any framework here as well.



## Extending the front end


### Using iframes for testing prototypes

A natural approach to sandboxing front-end components would of course be to use an [iframe sandbox](https://www.w3schools.com/tags/att_iframe_sandbox.asp). This would especially be useful in the initial prototype sharing phase, allowing users to share component prototypes built in any front-end framework.

By setting the [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) of the iframe, we can make sure that the browser can only target a specific back-end module controlled by the same developer, and we can also prevent this back-end module from making any HTTP requests elsewhere.

However, hackers might potentially be able to break out of the iframe sandbox, so in order to increase security, we should first of all require that each developer identifies and authenticates themselves, either as a public person (preferably), or as a known and trusted user in some programming community.

And when trying out a new prototype, the user should be redirected to a different subdomain at the top level, where they are automatically logged in with a test user profile, and not their actual user profile.

And of course, the user should accept and dismiss a warning about not falling for phishing attempts before being allowed to try out the prototype, as this is always a danger that iframe sandboxes cannot prevent.


### Compiling trusted components to Web Components

When a prototype is liked by enough users, and is subsequently verified as being secure, it ought to be compiled into a [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components), if not already implemented as such.

And from there, the users cna now freely import and use this new, user-made Web Component from then on (without the need for any iframe sandboxes, or requiring the user to change profiles, or accept and dismiss any warnings).

Updates can be made to such a Web Component. But in order to prevent supply chain attacks, any front-end module that is in use should be administrated, not just by a few individual users, but by a whole user group at once, namely where enough users have to sign on to an update before it is rolled out, and where users in the group can also veto and thereby delay a new update if it seems suspicious.

(By the way, the same is true for any back-end module that is in use: These should also be administrated by whole user groups, rather than individual users.)



## Extending the back end

We can also extend the back end to allow the users to set up servers implemented in arbitrary languages and frameworks, by implementing a cloud where they can access to their own virtual Linux machine.

I have some specific plans for how to do this, which will allow the users to implement any kind of server that they want, while still keeping the overhead costs low, such that the developers still only have to pay the cost of storing their source code (in line with the principles of a [user-programmable platform](README.md)).

But without getting too much into technical details, the concept can also be summarized as simply: A [serverless](https://en.wikipedia.org/wiki/Serverless_computing) cloud service, where the resource consumption tokens are withdrawn from the requesting users rather than from the developers.

We might also name this kind of service as a "financed platform as a service" ("FPaaS").
