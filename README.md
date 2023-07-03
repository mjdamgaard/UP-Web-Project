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
subject–relation–object statements (referred to as 'triplets') as metadata to
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


## Overview of the semantic system of openSDB

### Semantic inputs

The example from before with "Peter Jackson" + "is the director of" + "Lord of
the Rings: The Fellowship of the Ring" explains the general concept of a
semantic system, but openSDB does not actually store semantic links directly as
triplets like this. Instead the system stores semantic statements as
predicate–subject pairs, but allows Terms to be compound, meaning that a
predicate can be formed from a relation and an object. One could for example
form a predicate from "is the director of" and "Lord of the Rings: The
Fellowship of the Ring" put together. This choice makes queries faster by a
considerable amount, but it does come with the downside that relations are not
automatically two-way, and subject–relation–object statements thus need to be
stored two ways: as Predicate(relation, object) + subject and as
Predicate(relation, subject) + object to make them work both ways. I believe
this trade-off will be worth it.

More importantly, each semantic statement is also stored together with the ID
of the user who states the statement, and with a rating value running from 0 to
10 (in small steps of 10 divided by 65535) which denotes the degree to which
the user deems the statement to be true, like when answering a survey. A rating
value of five thus means a neutral degree; meaning that the statement is deemed
neither to be particularly right/fitting for the subject nor wrong/unfitting. A
rating value towards 0 then of course means very wrong/unfitting and a rating
value towards 10 means very true/fitting.

These combinations of user + predicate + subject + rating is referred as
'semantic inputs' in the terminology of openSDB, and for any constant pair of
user and predicate, the set of relevant rating–pairs stored in the database as
part of semantic inputs are referred to as 'input sets' (or sometimes just
'sets' for brevity). Due to a uniqueness constraint any subject can only appear
once in such sets (i.e. a user can only give one rating to any given statement),
and the input sets are stored as ordered in terms of the rating value. openSDB
also aims to store these input sets as compactly as possible, meaning that
retrieval of these sets can be done very efficiently. In fact, retrieval of
input sets is seen as the most central type of query of the database, and
therefore one that should be optimized as much as possible (hence the choice
mentioned in the first paragraph of this section).  

When using the database, however, users will mostly not want to query for one
particular users ratings, but instead to query for an average of ratings from
all users. openSDB intends to also implement such queries as queries for input
sets, only where the user ID is replaced for the ID of an averaging algorithm.
Furthermore, for each such algorithm, openSDB intends to actually store the
averaged (or otherwise aggregated) ratings in the same way as other semantic
inputs such that these averages can be retrieved as efficiently as the
single-user input sets. Thus, the averaging/aggregation algorithms will be
implemented as what we might refer to as 'bots,' namely since they take the
place of users in the user ID column of the semantic inputs table. The input
sets of these "bots" will then be maintained via continuous scheduled events
that update the ratings according to recent user inputs.

### Terms

Terms are what denoted the semantic units of the system, including the
relations and predicates, and even the users themselves since each new user of
the SDB will get their own Term representing them. All Terms have a unique ID,
first of all, and are defined by two fields/columns: An ID of a so-called
Context, which are themselves a kind of Term, and then a defining string. The
Context defines, typically via a template, how the defining string is to be
interpreted semantically. An example of such a template could be: "Movie:
\<Title\>, \<Year\>", and an example of a Term that defines an instance of this
template could be one that had "The Lord of the Rings: The Fellowship of the
Ring|2001" as its defining string. Note that '|' is thus used as a delimiter for
dividing a defining string up into several parts.

To give another example, let us say this "Movie: \<Title\>, \<Year\>" + "The Lord of
the Rings: The Fellowship of the Ring|2001" Term is given the ID of 28 in the
SDB. Take then the following template: "is an important/useful instance of the
{\<Noun phrase\> of \<Term\>}", which can be used to construct predicates from just
a noun phrase and any given object term. If we then want to construct the
statement that Peter Jackson is the director of this Movie, we can first of all
create the desired predicate, by defining a Term of this template Context and
with "Director|\#28" as its defining string. Here, "\#28" will ..


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
