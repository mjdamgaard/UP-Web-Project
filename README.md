# openSDB (prototype)

## The core concept of an SDB

openSDB is a Semantic Database (SDB) that is both open source and open for any
other parties to copy and use (for the most part).

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
[www.wikipedia.org/wiki/Semantic_Web](https://en.wikipedia.org/wiki/Semantic_Web) or [www.w3.org/RDF/Metalog/docs/sw-easy](https://www.w3.org/RDF/Metalog/docs/sw-easy)).
The main difference, however, is that the Semantic Web (so far) has mainly been
intended to run across the whole World Wide Web, by adding having web developers
add subject-relation-object statements (referred to as 'triplets') as metadata
to their web pages.

This approach certainly has the immediate advantage over the approach of an SDB
that it is quite decentralized from the beginning (as decentralized as the
World Wide Web). But by having SDBs that are open source, and which encourages
copying of (non-sensitive and in-public-domain) data, as well as subscribing to
a goal of combining all such SDBs into a decentralized distributed database
in the future, this approach can also yield a completely decentralized system
in time.

Now, on the other hand, the approach of trying to reach Tim Berners-Lee's dream
via SDBs, which is indeed the ultimate goal of this project, might very well
also have some major advantages over what has been the conventional approach so
far. To motivate the argument for why this is, let







, interfaced through a web
application, which I intend to host at www.opensdb.com once it is ready.

The term 'semantic' here refers to the fact that the data is structured in terms
of subject-relation-object connections, much similar to core concepts of the
Semantic Web, a vision originally proposed by Tim Berners-Lee (see e.g.
[www.wikipedia.org/wiki/Semantic_Web](https://en.wikipedia.org/wiki/Semantic_Web) or [www.w3.org/RDF/Metalog/docs/sw-easy](https://www.w3.org/RDF/Metalog/docs/sw-easy)).

And in fact, this project actually hopes to breathe new life into this vision,
and hopefully be able to lay the way for a new web: the Semantic Web.

But now we are getting ahead of ourselves. The first goal of openSDB should not
be to revolutionize how the web is used. The first goal should be create at
least just one useful application of a Semantic Database (SDB), and then prove
its usefulness by being able to attract a significant number of users.

Now, I have a lot applications in mind for this SDB that I think could
potentially attract users once they are built, and which I do not expect will
take me too long to build (even on my own). But there is definitely one ...
