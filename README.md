# Semantic Network Project
<!-- 
*My other README introduction is way too long and nerdy. So I'm in the process of writing this one, which ought to be way shorter.*
*(I also have to shorten the long version as well.)*
 -->

<!-- 
 *There is also a longer version of this introduction as well in the other [README document](https://github.com/mjdamgaard/openSDB/blob/main/README_long_version.md). It mostly repeats the points below, but it mentions some additional points as well.*
 -->

## Semantic ratings

<!-- ### Short description -->

This project wants to create
a website—and a browser extension—where
users can rate all kinds of resources (movies, videos, books, products, you name it!) according to arbitrary predicates!


### Existing technology 

Existing [folksonomy](https://en.wikipedia.org/wiki/Folksonomy) systems allow users to add [tags](https://en.wikipedia.org/wiki/Tag_(metadata)) to the various resources on the given site.
This makes it possible for other users to get a quick overview of the qualities of a given resource, and it can also be used for filtering searches.

However, existing systems only allow users to see *if* a given resource has a certain quality or not; they do not allow the users to see *how much* it fits that quality!

For instance, if you are looking for scary movie to watch, you might be able to get a list of all the movies that carries the 'scary' tag on a conventional site, but you cannot see *how* scary any given movie is in order to match the degree that you are searching for.

You could of course try to read comments and reviews for each individual resource, but this process is both slow and not very reliable, since reviews often vary greatly and do not necessarily cover all the things that you might be interested in.

### Ratable tags!

So how about system that allows the users to rate each tag on a scale?
<!-- so that each user can then tailor their searches and get their feeds sorted after exactly the qualities that they are looking for? -->
<!-- so that one can quickly get an overview of all the qualities of a given resource, without having  -->

This would mean that the users could easily get a **quick and nuanced overview** of all the qualities that they are interested in for each resource that they browse.

And it would furthermore make it possible to create **advanced searches** where users can search for *exactly* the qualities that they want in the type of resource that they are after![^1]

[^1]: The importance of this point cannot be overstated: Searching for things is such a big part of how we use the web, and if this project can better that experience, it could affect millions and millions of people.

It also makes it way easier an quicker for each user to **express their opinions** about resources with a high degree of nuance. Instead of spending several minutes writing a comment or a review that then just becomes the 10,000th one in a list, as is often the case, they would be able to quickly submit scores for the various ratings that are relevant to them. And after having done so, they will know that their contributions will benefit *all* the other users that browse or search for the same kind of resource, and not just the couple of users that make it down to that 10,000th comment.

This project believes that there is a giant possibility here for improving user experience and utility of the web!

<!-- ### Another example

<!-- TODO: Change this for an example/examples of rating products (etc.). -/->

To give another example, imagine that you are looking for an article about a subject, and you want to find one that is both very educational and also somewhat entertaining. Then you could take those two tags, 'educational' and 'entertaining,' in addition to a standard 'liked' rating, and by giving a lot of weight (by adjusting by a slider) to the 'educational' rating, and a little weight as well to the 'entertaining' rating, you can get these kinds of resources listed first in the search feed.

For each resource in such a search feed, you can then see the score for each of the given tags that you used in your search, as well as your other favorite tags. -->


<!-- ### Advanced searches

To elaborate on how the ratable tags can be used for advanced searches, .. Hm, maybe this is not important enough for this readme.. ..I considered mentioning that the advanced searches could both consist of determining weights (like my educational--entertaining example above) and also on determining ranges (like my scary-movie example). -->


## A Semantic Network

### User-to-user ratings and user groupings.

Apart from resources, the users can also rate themselves and each other. This further allows for the possibility that users can be grouped according to e.g. interests, opinions, reputation, activity, and so on.

This will make users able to further refine their searches and their feeds by adjusting what weight is given, not just to the various tags used in the search, but also to the various *user groups* as well.

This allows users to find out what groups they tend to agree with in certain matters, and then boost the opinions of those groups! This will then affect all the ratings that they see on the site, and it will also affect their search results and their feeds!

And if a user wants to change their preferences for what user groups are boosted, e.g. because they are in a different mood or they want to explore other user groups, they can do so manually and with immediate effect: They do not have to go through the long process of training an algorithm to notice their change in desires.    

<!-- (And they also don't have to do this when creating a new account, btw.) -->


### A browser extension and a network of ratings across the web

The project also seeks to develop a browser extension such that users can access the ratings of the Semantic Network across the web. This browser extension can then read the URL of any webpage that the user visits and query the network[^2] for ratings and comments that are relevant for the resource that the given webpage is about.

[^2]: All this traffic is encrypted and not logged at all; only actively submitted ratings and comments are stored.


For instance, if a user watches a video on YouTube, the browser extension can then query on show all the relevant ratings and comments for that video. Of course, in this particular example, YouTube will already have a comment section. But it does not have ratable tags for one thing, and it does not have the ability to prioritize comments and ratings from your own favorite user groups!


<!-- With this simple technology, users will thus be able to access and use the network across the web. And with further development, the browser extension could also analyze the webpage itself in order to recognize individual resources on it and query about data for them.. -->




<!-- Having a giant hub of.. -->


## Semantic structures

### Semantically structured resources

The semantic system that the project builds upon also allows for all resources to be structured in a semantic [graphs](https://www.geeksforgeeks.org/generic-treesn-array-trees/) of categories and subcategories. At the top level we have a category of everything, which the users can subdivide into subcategories, such as e.g. 'Media,' 'Science,' 'Products and services,' 'Fiction,' 'Websites,' etc.

This first of all gives the following alternative to conventional keyword searches: Instead of searching by typing in keywords in a search field, you can also search by browsing categories and subcategories. If you are searching for some music of a given genre to listen to, you might select "Media → Music → Pop → Indiepop" and browse the resources in that category.

It is the users themselves that are responsible for making and structuring the categories and subcategories of the website. And they do so via the semantic ratings as well: They rate which resources belong to which categories, and they rate which subcategories are relevant for which categories.


### Semantically structured comment sections

Comments are also implemented as "resources" in the system, which means that these can be rated and grouped into categories in the same way as other resources. In particular, this means that comment sections can be structured into categories and subcategories as well.

So suppose for example that you have just watched a video, or read an article or a post, and you have a specific question that you want to ask about it. With conventional comment sections, you would then often have to scroll past a great amount of comments before you find what you are looking for (or give up).

With a semantically structured comment sections, on the other hand, all comments can be grouped into tabs and sub-tabs by the users. All the reaction comments can thus be grouped into one tab, and all factual comments (questions, discussions, etc.), can be grouped into another, and the latter can also further be grouped into topics (if there are a lot of comments).

This can potentially make it a lot easier to find the given answer that you are looking for.

And in terms of discussions, these can furthermore be structured into whole [trees](https://www.geeksforgeeks.org/generic-treesn-array-trees/) of arguments and counterarguments. This could make it much easier for users to find all the arguments and counterarguments for a given discussion, and thus make them able to better form an informed opinion about the matter.

It would thus also greatly help users fact-check information on the web, and especially with a well-developed browser extension that allows them to query the Semantic Network about facts immediately while they are on whichever other website that serves them the information.   



<!-- 
### Benefits of a decentralized network

This project is completely open source and aims for decentralization! One of the major benefits of this from the users' perspective is that their inputs
-->






<!--

"
\subsection{Selling the idea to existing open source communities}

(02.02.24, 10:52) I am absolutely convinced that my Semantic Network Project will lead to the future of the web, and the idea \emph{must} also be ``sellable,'' in particular also to the various open source communities like the Linux community and Mozilla. The point is this: You have already shown, Linux and Mozilla, that open source project can very well compete with commercial solutions. Linux definitely competes with e.g.\ Windows---and I think that it is even quite a bit better! And Firefox definitely also competes with Chrome and Edge (it is my preferred browser)! So why couldn't open source also compete with web sites/platforms like YouTube and Facebook, etc.?? (And especially Reddit.\,.) `Well,' you might say, `a website requires servers and maintenance etc.' Yes, they do, but so what? If the users are happy to use the service, they will provide enough money to maintain the service. And if your service also helps other organizations/companies (like my Semantic Network Project!), then your absolutely golden: the service maintenance will be paid for! But hold on, should open source then try to compete with all existing websites at once, or which website should we choose to compete with first? Well! I know exactly what website we should begin with! Enter the concepts of a `Semantic Database' (SDB) and the concept of a `User-Programmable Application' (UPA)!

The great thing about an SDB is that you don't need to change the backend and add new relations to your database whenever you want to develop a new part of the web app. You have to do that with a relational database. If you for instance want to add a like button to your resources, you have to add new relations to contain the associated data. A relational database has its advantages. But one of the big advantage of an SDB is that you don't have to do this! The database is so flexible that you can just use the core of it for pretty much anything that you want.\footnote{The only time that you would need to write SQL (not counting the times that you upgrade the SDB solution itself, if you happen to be both a developer and a user of the SDB solution) is if you want to write the so-called `Aggregation Bots,' but these can also be implemented outside of the backend, and even by third parties.}
With an SDB, the users themselves can create whatever data structures they desire!\footnote{To fully make this point understandable, I should preferably have developed my prototype (openSDB) just a little bit further.}
%But of course, if you want to implement something like a like button, say, then you also need to change the frontend code, and this is also typically the job of the developers as well. %..Hm, lad mig lige tænke lidt inden jeg fortsætter, for open source kan jo allerede meget i sig selv, uden UPA.. (11:28) ...(11:50) Jo, lad mig bare fortsætte denne pointe. ..Ah, men lad mig lige starte på en anden måde..
This means that application can evolve quite a lot in how it can be used in different ways even without any actions required from the developers. This saves a lot of work from the developers, which means that the services are easier to pay for (by the users and donors).

But it gets even better! Introducing he concept of an `UPA,' which is that users can also upload scripts, (including React modules), HTML snippets, and CSS style sheets to the site! These will of course not be approved automatically,\footnote{Except if someone at some point were to complete my `safe JS subset' language, or a language like it.} but will be approved by the developers, requiring some work by them. However! Here the developers can safe a lot of work by out-sourcing the code validation to the users! This can be done by having a `safe script' rating, which the users can then rate. (This is almost trivial to implement.) And by utilizing something which I often refer to as `user groups' (implemented via a so-called `Aggregation bot' which then aggregates ratings of users), the developers can implement a user ranking based on how much they trust the users decisions of when a script is safe and not. This technology can even be furthered by implementing code annotations with attached ratings such that users can even rate specific snippets of a script for safety, which means that the next users to read through it can get an overview of which parts are the most tested/analyzed ones and which part are in greatest need for testing and/or analyzing. And with this, the developers then only need to read through the scripts that has risen to the surface in this process\footnote{Oh, by the way, users can also rate how interested they are in new script, meaning that the interesting scripts will get more attention by the user community.} a few times before accepting it for users to then be able to add to the site, i.e.\ as a kind of (so-called) `add-on' (similarly to how a `browser extension' works to change the contents of a site). Each user can then simply choose which extensions to use, a bit similarly to how open source projects can fork in general, but where the the process of forking back and forth a now just way more flexible, and can be decided by the individual users!

Not only does all this help reduce the cost of maintenance, which help justify the open source model, but it does something even more important as well. It answers the question posed in the beginning of this text of `what website to start with.' Well, if you start with this website, then it can branch and develop into all other websites! For instance, it could develop such that open-source `Facebook' is just under one tab in the site header, and YouTube, Reddit Wikipedia, etc., is under other tabs! So by starting with this website for this proposed open source website project, we get all possible websites for the price of one!

And what is more, because there are in fact more, the SDB website that I have in mind will also fill out a hole in the market that isn't discovered yet! I thus strongly believe that even without all the points above, and even without being an open source site, the `semantic website' that I have in mind would be a great commercial idea, had I wanted to make it a private enterprise. I really believe that the things that the site will afford will be greatly appreciated by the users, even without this whole deal of being open source, and about being a UPA. This is what truly makes this idea so golden: You don't even have to convince the users to join alone on being an `open source alternative to existing commercial sites,' and on being a flexible UPA, \emph{once} it has gathered enough interest. The website will also be able to attract users simply on the ground on filling out a hole in the market, providing the users with affordances/abilities that the didn't know they needed. If this sounds interesting, see my README.md introduction to the site on github.com/mjdamgaard/Semantic-Network-Project. (There is also a longer version (not well-edited, though) of that README which mentions more points about being open source etc.) %(12:42)

So there we go, this is an absolutely great idea---immensely great, I would say! Now, there is also another important point about how to ensure that the users can always trust the companies/organizations not to be corrupted over time. But I have described this in several other places (here in this `23-xx note collection.tex' document, possibly in my `main.text'/`2021 notes' document also, and in my READMEs in the GitHub repo of the project), so let me not repeat this here.

*\textit{The next paragraph is not so important; feel free to skip it:}

.\,.\,Oh, except that I should actually mention an important point.\,. .\,.\,Yeah okay so the outline of the idea is that the organizations/companies whose supplies the web services to run the website should all allow for any competitor/collaborator/third party to copy all their data and set up a copy of the site. This allows for a whole network of service providers where if one `node' in this network all of a sudden becomes corrupt (e.g.\ by not adhering to this rule), then the users can just immediately switch to and use some of the other `nodes.' Now, the new point that I wanted to mention is this: When this ``copying'' happens, it should be a public process that all users can see (perhaps getting notifications about it, even). The users have then agreed to this from the start, as part of using the services in the first place. And (now comes the point), if a user wants to have some data deleted about them,\footnote{Anonymity is greatly advised for the Semantic Network Project for the accounts/profiles that the users use in every-day matters, but a user might for instance accidentally reveal there identity even so.} then they just have to send this request to all nodes who has copied the data in question. (However, this is only in principle; in reality, the network will work together such that a user only needs to put in the request in one place, and then it will be sent to all other relevant nodes in the network (and confirmations of the deletion will also be sent back by each node).) Since all these nodes are required by law (as far as I know) to then delete the relevant data, this whole distributedness of the Semantic Network should thus not be a hindrance in practice for the users to get data deleted.

.\,.\,Okay, this was all I wanted to write here, I guess. If I think of something else that I've forgotten, then I will just append it here. (13:14)
"

-->