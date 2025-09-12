
# A User-Programmable Web

*A prototype of this project will be available soon on [www.up-web.org](https://www.up-web.org), possibly within just a few weeks.*



## Summary

### User-programmable web applications
This project seeks to create a new version of the Web where the users have complete control over both the appearance and the underlying algorithms of the web applications, and in such a way that each individual user can choose the appearance and the algorithms that suits them the best.

This is achieved by implementing a web development framework where it is safe for users to share their programming modules, and to try out those of others, without having to worry about being attacked.
And once these modules are ready for use, the website can make them immediately available for other users to try, with minimal central oversight required.

This allows us to create a very decentralized system where users can create web apps in collaboration with each other in a modular way — like building with LEGO — and where they can immediately try out their solutions and share them with others.

### Low costs
Furthermore, the cost of creating a new web apps using this system is extremely low: The cost of uploading a new app (or app component) is just the cost of uploading its source code alone. And this true even for apps that stores user data in the database, since the developer does not need to allocate the storage space needed for this. And the database does not care whether a user uploads some data to one app or another, so there is no real reason that the developer should have to pay anything more in order for their app to be able to store data in the database.

This means that even if you want to create, say, something like a new social media app, perhaps for a select group of people that you know, or with a special theme in mind, the cost of doing this will be so low that it will likely be a free service in most cases. And once this project takes off, other users will likely have already made some good templates that you can use, which will make creating such apps very quick and very cheap.


### A distributed and decentralized open source network 
Naturally, the whole project is open source, and copy-lefted, which means that anyone is free to fork the project if they want to, and are also free to set up their own service providers for the network.

In fact, the whole project aims to become a distributed and decentralized system in time, with a whole network of independent nodes that are programmed, by the users, to work together and create what we might then call the 'User-Programmable Web.'




## A React-like JS framework that runs all source code in a sandbox


### Basics
At the core if this technology is a special JS interpreter that runs all source code in a sandbox, with a different set of functions available when compared to regular JS, such that each accessible function is safe to be executed for all users.

Apart from a few functions that are built into the JS interpreter itself, most of the fundamental functions available, that are not user-defined ones, come from so-called 'developer libraries.' These libraries are imported dynamically by the user scripts, which means that there are no limit to the number of developer libraries that the given service provider might make available for its users.

Furthermore, users are also free to import functions and classes, etc., from other user-uploaded directories. (And they can choose whether to bundle these imports together with their own modules, namely if they want to bundle their project directory, or to just import the foreign user modules dynamically as well).

When a user wants to upload a new project, they can upload it as a whole directory at once. A tutorial for how to do this will available soon. They will then become the admin of that directory, which means that they are also free to edit the files in that directory.



### Front-end React-like components
One particular developer library that is already available from the beginning is one that implements a React-like JS framework, where users can write React-like JSX components for the front end. This is how users are able to program new web apps for the website, and/or new components for existing web apps to use.

In fact, when the prototype is ready at [up-web.org](https://www.up-web.org), almost everything you see on the site, apart from the top right user account menu, is programmed in this React-like framework. And any user will thus be able to program the same thing, and much more.

The users might even find that this alternative React-like framework is easier to use in some ways than regular React, since it removes a lot of boilerplate code that you would otherwise have to include in React, in particular when you want a component to be able to transmit signals to and from its ancestor components and/or its descendant components.



### Back-end server modules
Users are furthermore able to create and upload back-end modules, to which the front-end components can connect in order to fetch or post data to the database. We will refer to such modules here as 'server modules' (SMs).

A server module (SM) is any JS module that is uploaded to a directory with the extension of '.sm.js'. For such modules, each function that is exported from the module is treated as part of the API of the SM, allowing clients to call these functions via a certain type of HTTP requests.

When a called server module function (SMF) is executed this way, it automatically elevates the privileges of the execution such that the function is allowed to post data to the database (at least in the case of a POST request), and to fetch private data. Other server modules in other project directories will not be able to write directly to the same part of the database, nor read any of the private data stored there. So if a serer module wants to post data to a different SM in a different project directory, it will have to use the same exact API as the clients do.

A very keen reader might then ask: If users are supposed to be able to freely try out web apps and app components of other users, what is preventing those components from sending requests to any SM that they want and request it to delete or corrupt some of the user's data, or to fetch private data on behalf of the user, and then trick the user into posting this data again to another SM, where others are able read it?

The answer is by utilizing a system much like the Cross-Origin Resource Sharing (CORS) system used by HTTP, but where the "origin" of the request is not the domain of the website, but rather the path to the given component that sends the request. Any SMF that carries out such sensitive actions should thus make sure to first call a function that checks and authorizes the requesting component. And as long as these components are clear and explicit about the action that is about to happen, this should prevent users from accidentally deleting or publicizing any of their data.

The SMFs can also allow clients to override their CORS-like checks, namely if said clients have assigned special trust the requesting component. This means that old SMs can still remain in use, without having to continuously update their component whitelists whenever a part of the userbase wants to use different front-end components to communicate with them.



## An outline of how to use the system

As mentioned, the prototype at [up-web.org](https://www.up-web.org) is currently still a few weeks from being ready to showcase. But let us try to give a quick overview of how that website will function in order to allow users to create web applications in a modular and collaborative way.

When a user has uploaded a project directory containing some app components that they want to make available for others, they can create a new entity in the database for each of these components. These entities will contain defining information about the component, including the internal URL for importing it into other scripts, as well as a description of it, and also preferably a link to a GitHub repository containing the source code. By using GitHub this way, it allows users to identify themselves as authors of the code, and it also allows users to choose the license for their source code. By choosing an open-source, copy-left license, it signals that other users are free to build upon your solutions and to use them in other projects.

<!-- Using GitHub this way also automatically gives us an online backup of the source code, which means that if a service provider somehow fails — maybe from being hacked, or maybe the userbase loses trust in them — then user can easily just copy projects onto a new service provider in the network. Furthermore, the admins of a project directories will also be able to download backups of the public user data held in relational database tables, which means that this data can also be backed up and copied onto other service provider nodes in the network. -->

When an entity representing a component is added to the database, the user will be able to navigate to a category of all 'App components' on the website, and submit the component entity to that category. Other users will then be able to view it and try it out, and to up-rate it among the existing components in the category.

This main category of 'App components' will thus initially provide a good way for users to share web applications with each other. But as the list grows, it will be necessary with subcategories as well. In order to get that, the website also allows users to submit entities representing subcategories as well, and to up-rate them for the given parent category, exactly in the same way that they are able to submit and up-rate members of the category. Examples of subcategories for the 'App components' category could be categories such as 'Social media apps,' or 'Games,' or 'UI utility components,' etc.

And of course, each of these subcategories can then again get their own subcategories, and so on, giving us a growing tree full of different kinds of components. With such a tree, users will be able to categorize their new solutions precisely, and others will be able to find these solutions easily, simply be going down the tree of categories until they find exactly the category of components that they are looking for.




## An "Everything Website"

### User-defined web pages
The 'App components' tree will be available on its own web page at [up-web.org](https://www.up-web.org), accessed from the header menu. But what about the home page of the website? Which component should be shown here?

Here we will actually also give the reins completely to the users, and have them decide what this home page should contain. The 'App components' tree thus ought to include a category specifically of 'Home pages.' And here we will simply choose the top-rated one in that category to show as the home page of the website.

It will thus be completely up to the users what the home page should look like, including what other pages it links to, and what web applications it links to. One might compare this to a wiki site such as Wikipedia, but where the pages can link not just to other article pages, but to any kind of page or web app, or any kind of component at all. This will thus essentially allow the users to build what we might call an "Everything Website," with the ability to contain any kind of application that the users want.



### Self-updating links and nested components

Furthermore, we will implement what we might refer to as 'variable links,' or 'self-updating links.' These are links that instead of leading to a constant component, does a similar thing as we do for the home page, namely to query for the top-rated component for a given category, and then link to that.

This first of all means that the author of a page or an app does not need to keep updating the links contained in the page/app continuously. By using one of the variable links, the link will just always automatically lead to the best version of the given component that is available in the network, as rated by the users.

And we can even do the same thing for nested components, namely by implementing a component that automatically queries for the top-rated component for a given category and then renders that.

For instance, if the page is some Wikipedia-like article, say, about a person, the author of the article component is able to define a component category of 'Early life' sections for that person. And whenever some user writes/edits a better version of that section, as rated by the users, it will automatically replace the previous one. And the author can do this with any other section as well. So by using these 'variable component,' the whole article can thus become self-updating in this way in principle.


### User-tailored pages

And while this automatic updating of components will be very handy, it is not even the main reason that one might choose to use such variable components and links. An even more exciting reason to use these is that it allows users to get the version of the page/app that best suits their own individual preferences. The self-updating components are thus able to look at the specific user's preferences when it comes to what is the best component to show, or to link to.

For example, when it comes to Wikipedia-like articles, one user might generally prefer longer and more elaborate articles, and another user might generally prefer more brief and concise articles.

And for social media apps, some users might prefer a more keen and careful moderation that filters out undesired posts from the user's feed, while other users might prefer a less thorough moderation in general. And there might also be a big difference in what kind of posts each user is sensitive to.

Furthermore, even when it comes to the layout and theme of a given app or page, the variable components can allow users to get different versions. There is thus no limit, in principle, for how much each web app or web page can be tailored to any specific type of user.


### Decentralized algorithms

And when it comes to the algorithms used in e.g. feeds or search result of various web applications, the users can also be in complete charge of which algorithms they want to use.

Sure, any web application is free to use any specific algorithm that it wants. But unless there is a good reason for not choosing an algorithm with a high level of transparency and ability to be tailored specifically to the individual user's preferences, the users will likely just choose an alternative application instead where they have more agency over the algorithms.

This will hopefully usher in a new age of the Web where using an algorithm is not a quid pro quo, like how things are now: The algorithms collect personal data about you when you use them, often in a non-transparent way, and in return you get results that might be more relevant to you, if you are lucky (at least until the process of "enshittification" inevitable takes its toll).

But with this user-programmable system, the users can be in complete charge over the algorithms. They are the ones that program them, first of all. And each of them can be free to choose whichever algorithm that they themselves want to use.

Particularly, in terms of the user data that is fed to the algorithms, each user will be able to provide only the data that *they* want. And even if they don't want to provide any at all, this is also possible, as they can then instead just try to tweak the parameters of a given algorithm manually, in order to make them suit their preferences the best. No quid pro quo needed.


<!--

Furthermore, we will implement two components that will hopefully see a lot of use. First, there will be a component that doesn't have any content by default, but only a prop (i.e. a 'property' in React terminology) defining a component category. And when this component is loaded, all it does is to fetch the top-rated component in that given category, import it dynamically, and then display it inside of it. (This component is indeed what will be used for the home page, namely with a category prop pointing to the 'Home pages' category.)

So when making a new web page, whether as a candidate for the home page or a completely different page, the author is able to make parts of that page variable such that they are updated continuously, without the authors intervention, to be the best versions of themselves that is currently available in the network. For instance, if the page is some Wikipedia-like article, say, about a person, the author of the article component is able to define a component category of 'Early life' sections for that person, or any other section in the article, for that matter. And by using this "self-updating" component, as we might call it, the whole article can thus becomes self-updating in this way. 

Second, we will also implement a similar component but for internal links on the website, which, rather than displaying the top-rated component for the given category, will instead lead to that component when the user clicks the link. That way, a web page can thus also utilize "self-updating" links, as we might call them.

With these ingredients, we can thus essentially get an "Everything Website," namely where all kinds of web apps can be accessed, and where apps and pages can automatically update themselves with the latest best solutions, without requiring the authors of the components to continuously intervene in this process.

-->



<!--

## Decentralized algorithms

In the previous two sections, we talked about how front-end components might be rated among the users. But who decides which users have a vote and who does not? Do all users have an equal amount of voting power, or do the votes of some users count as more than others?

Once again, the answer is to give the reins to the users themselves to decide this, and in a decentralized way such that each user can effectively choose their own system for how the votes are distributed.

More precisely, each user is able to choose an algorithm that distributes "weights" among the userbase. These weights can then be used by other algorithms that aggregate the scores of the users.

This system can in particular be used when it comes to rating the components within a component category. So when one of the two aforementioned "self-updating" components looks for the "top-rated" component for a given category, they can thus query for this using the preferred algorithm of the given user.

For instance, a user that prefers longer, more elaborate articles might get longer sections in the articles, as opposed to a user that prefers more brief and concise articles.

And when it comes to the algorithms used in e.g. feeds or search result of various web applications, the users can also be in complete charge of which algorithms they want to use. Sure, some web applications might use a fixed algorithm only. But unless there is a good reason for doing so, users will then likely just choose an alternative application instead where they have more agency over the algorithms.

This will hopefully usher in a new age of the Web where using an algorithm is not a quid pro quo like how things are now: The algorithms collect personal data about you when you use them, often in a non-transparent way, and in return you get results that might be more relevant to you if you are lucky (at least until the process of "enshittification" invariable takes its toll).

Instead, the users will be able to provide only the data that they *want* to the algorithms. And if they don't want to provide any at all, they are also free to just try to tweak the parameters of the algorithms manually, in order to make them suit their preferences, no quid pro quo needed.

-->


## Superusers and regular users

Obviously, not all users will be programmers that contribute source code to the network. Some users will of course just be using the apps of the network without contributing source code on their own. And that is perfectly fine.

The same is true when it comes to selecting which algorithm to use. Obviously, we cannot expect each individual user to go and select their preferred algorithms before being able to use the website. Instead we will simply select the most popular set of preferences as the default ones for each new user, and then make it easy for users to change these preferences whenever they want.



## GDPR and similar legal matters

In terms of things like GDPR, the hope is that the network will at some point achieve a legal status similar to the Word-Wide Web, where it is not the service providers that are liable for the contents of the user-made applications of the network.

But until that is achieved, [up-web.org](https://www.up-web.org) will simply reserve the right to delete any app, along with its data, that does not comply to GDPR, or does not comply to other terms of service. (But if using GitHub, your source code, and any backups of the public data that you have made for your app, will still be available there, and can possibly be moved to other service providers.)

And for apps that tries any sort of malicious behavior, such as phishing attempts, or attempts to make the users delete, corrupt, or involuntarily publicize their data, we will most likely also keep reserving the right to delete such apps for any foreseeable future.



## Funding the project

Last but not least, let us talk a bit about how the website intends to get its funds.

Obviously, since most of the content of the website, including the front-end and back-end source code, is supposed to come from and be maintained by the users themselves, the cost of maintaining the website will be relatively low. But we will still need money to provide the servers necessary for the system, as well as for maintaining and updating the so-called developer libraries that was introduced above.

Of course, a fallback option could always be for the website to show ads in the margins. But [up-web.org](https://www.up-web.org) will commit itself to not push any ads on the users. We would much rather simply keep a 'Sponsors' tab at the top, and ask the users to go to this tab once in while and send some mental appreciation towards our sponsors.

With a large enough userbase, this will hopefully be able generate more than enough revenue to keep the site going, without needing to push any ads on the users at all.

<!-- We will also make it possible for users to donate to the website, which might also have the beneficial side-effect for the user of gaining more esteem in the user network. And at some point, we might also make a system where user can watch ads as an alternative way of donating to the website. -->

Other potential service providers of the network in the future are of course free to monetize their websites in whichever way they want. But since the users can choose freely between all the service providers in principle, and are able to switch to another one whenever they like, the userbase should thereby have the power to prevent "enshittification" of the network.


Lastly, [up-web.org](https://www.up-web.org) also at some point intends to found an organization for monetizing user-contributions, not necessarily so much when it comes to the user-made source code for the site, but more so when it comes to user content such as videos and images, and all such creative content. Hopefully we will be able to create a good organization where such content creators can pool their IPs, and vote on what paywalls to set up for what content, in a fair and democratic way.




