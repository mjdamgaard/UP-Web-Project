# openSDB (prototype)
*Status: in development*

## Introduction to the project

openSDB is a Semantic Database (SDB) that is both open source and open for any
other parties to copy, at least for a majority of the (non-sensitive) data.

By 'semantic' we refer to the fact that entities in the database can be linked
via (user-provided) relations that can carry any meaning. Thus, if we take the
fundamental entities inhabiting the database, which openSDB calls 'Terms' and
which can represent everything from web resources to real-life objects, places
and persons, the users of the SDB can then upload links between all these Terms
in the form of relations, expressed as lexical items in a natural language
(such as English).

For instance we could have the lexical item: "is the director of", which a user
might want to use as a relation to express e.g. that Peter Jackson is the
director of The Lord of the Rings: The Fellowship of the Ring. That user can
then upload or find the Terms "is the director of", "Peter Jackson" and "The
Lord of the Rings: The Fellowship of the Ring" and subsequently use these to
construct the statement: "Peter Jackson is the director of Lord of the Rings:
The Fellowship of the Ring."

This concept of an SDB is thus very much related to the concept of the Semantic
Web, as envisioned by Tim Berners-Lee in 1999 (see e.g.
[www.wikipedia.org/wiki/Semantic_Web](https://en.wikipedia.org/wiki/Semantic_Web)).
The main difference, however, is that the Semantic Web (so far) has mainly been
intended to run across the whole World Wide Web, by having web developers add
subject-relation-object statements (referred to as 'triplets') as metadata to
their web pages. Semantic Web applications are then supposed to read this
metadata from across the web to get its data structures.

This is opposed to approach of this project, which aims to develop such
applications on top of databases instead (i.e. SDBs), being accessed through
a limited number of web domains, instead of having these applications run on top
of the entire web at once.

*If the reader is not already familiar with (or interested in) the Semantic*
*Web beforehand, they might want to skip (or skim) down to the next section.*

This approach has the drawback that it is not immediately as decentralized as
the conventional Semantic Web: If the latter would have ever taken off, it
would have immediately been as decentralized as the World Wide Web. But the
conventional Semantic Web never really did take off, and perhaps for good
reason, as we will discuss in a moment. Therefore we must start to think of
alternative approaches if we ever want to fully realize the dream of the
Semantic Web. And luckily, while the approach of storing semantic data in
databases rather than in web pages as metadata does sound to be a bit more
centralized, the fact that openSDB encourages other organizations/parties to
copy the source code and data and start their own databases means that we can
create a network of independent SDBs that can end up forming a big decentralized
distributed database of semantic data. And on top of this decentralized and
distributed SDB, a new Semantic Web can be formed.

Now, the reason why the approach of SDBs might have a big advantage over the
conventional approach, is that, as I see it, the conventional approach is a bit
stuck in an old and outdated way of thinking about the web. In this old way of
thinking, the difference between developers and users of the web was not as wide
as it is today. As a "user" of the web you could surf the web and visit web
pages, and if you wanted to add something to the web yourself, you could
"simply" make your own website and host it from a domain. But this way of
thinking about the users of the web is far from the reality today: There is a
wide gab between the developers and the average users of the web, and the
average user is *not* going to write any HTML when they want to add something to
the web (and they are especially not going to write semantic metadata triplets,
as this takes even more knowledge than just being able to write simple HTML).    

And yet the "average users," i.e. the non-developers, add so much to the web
in its present state. Nowadays when we use the web, we often go to the same
websites that we have visited many times before, not to see what new content
the developers have added to the site, but instead to see what other users of
the site have uploaded. This revolution of the web in terms of how we use it is
what is known as the Web 2.0.

<Paragraphs about the need for users to be able to add semantic links, not just
devs>

But of course, arguing why one approach for reaching the dream of the Semantic
Web might be more promising than a previous one is not of much if you do not
already share in that dream, which is something that most readers probably will
not. We will therefore in the following section discuss some useful
applications, which I believe can garner a wide userbase. The first goal of
the openSDB project is then to create a website that implements these
applications and then to prove its usefulness be attracting a considerable
amount of users. And only once this is achieved begins the further task of
getting other parties to join in and together develop the system into a
distributed and decentralized one. ...


## The "killer application" of openSDB

The first application of openSDB that I am currently in the process of
developing (currently alone, but I hope that I can attract others to the
project), and which I believe...













<!--
But now we are getting ahead of ourselves. The first goal of openSDB should not
be to revolutionize how the web is used. The first goal should be create at
least just one useful application of a Semantic Database (SDB), and then prove
its usefulness by being able to attract a significant number of users.
-->
