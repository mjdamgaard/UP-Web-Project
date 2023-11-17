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

So how about system that allows the users to rate each tag on a scale!?
<!-- so that each user can then tailor their searches and get their feeds sorted after exactly the qualities that they are looking for? -->
<!-- so that one can quickly get an overview of all the qualities of a given resource, without having  -->

This would mean that the users could easily get a **quick overview** of all the qualities that they are interested in for each resource that they browse.

And it would furthermore make it possible to create **advanced searches** where users can search for *exactly* the qualities that they want in the type of resource that they are after!
(The importance of this point cannot be overstated: Searching for things is such a big part of how we use the web, and if this project can better that experience, it could affect millions and millions of people.)

It also makes it way easier an quicker for each user to **express their opinions** about resources with a high degree of nuance. Instead of spending several minutes writing a comment or a review that then just becomes the 10,000th one in a list, as is often the case, they would be able to quickly submit scores for the various rating that are relevant to them. And after having done so, they will know that their contributions will benefit *all* the other users that browse or search for the same kind of resource, and not just the couple of users that make it down to that 10,000th comment.

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


### A browser extension and a network of ratings across the web

The project also seeks to develop a browser extension such that users can access the ratings of the Semantic Network across the web. This browser extension can then read the URL of any webpage that the user visits and query the network[^1] for ratings and comments that are relevant for the resource that the given webpage is about.

[^1]: All this traffic is encrypted and not logged at all; only actively submitted ratings and comments are stored.


For instance, if a user watches a video on YouTube, the browser extension can then query on show all the relevant ratings and comments for that video. Of course, in this particular example, YouTube will already have a comment section. But it does not have ratable tags for one thing, and it does not have the ability to prioritize comments and ratings from your own favorite user groups.


<!-- With this simple technology, users will thus be able to access and use the network across the web. And with further development, the browser extension could also analyze the webpage itself in order to recognize individual resources on it and query about data for them.. -->




<!-- Having a giant hub of.. -->


## Semantic structures

### Semantically structured resources

The semantic system that the project builds upon also allows for all resources to be structured in a semantic [graphs](https://www.geeksforgeeks.org/generic-treesn-array-trees/) of categories and subcategories. At the top level we have a category of everything, which the users can subdivide into subcategories, such as e.g. 'Media,' 'Science,' 'Products and services,' 'Fiction,' 'Websites,' etc.

This first of all gives the following alternative to conventional keyword searches: Instead of searching by typing in keywords in a search field, you can also search by browsing categories and subcategories. If you are searching for some music of a given genre to listen to, you might select "Media → Music → Pop → Indiepop" and browse the resources in that category.

It is the users themselves that are responsible for making and structuring the categories and subcategories of the website. And they do so via the semantic ratings as well: They rate which resources belong to which categories, and they rate which subcategories are relevant for which categories.


### Semantically structured comment sections

Comments are also implemented as "resources" in the system, which means that these can also be rated and grouped into categories in the same way as other resources. In particular, this means that comment sections can be structured into categories and subcategories as well.

So suppose for example that you have just watched a video, or read an article or a post, and you have a specific question that you want to ask about it. With conventional comment sections, you would then often have to scroll past a great amount of comments before you find what you are looking for (or give up).

With a semantically structured comment sections, on the other hand, all comments can be grouped into tabs and sub-tabs by the users. All the reaction comments can thus be grouped into one tab, and all factual comments (questions, discussions, etc.), can be grouped into another, and the latter can also further be grouped into topics (if there are a lot of comments).

This can potentially make it a lot easier to find the given answer that you are looking for.

And in terms of discussions, these can furthermore be structured into whole [trees](https://www.geeksforgeeks.org/generic-treesn-array-trees/) of arguments and counterarguments. This could make it much easier for users to find all the arguments and counterarguments for a given discussion, and thus better be able to form an informed opinion. 



<!-- 
### Benefits of a decentralized network

This project is completely open source and aims for decentralization! One of the major benefits of this from the users' perspective is that their inputs
-->
