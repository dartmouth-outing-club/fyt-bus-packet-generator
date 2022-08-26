# FYT Bus Packet Generator
The “bus packet” is a human-readable document containing all the information that the bus driver will require to succesfully complete their trip.
This is a simple webapp to generate the bus packets for each trip.
A example of the kind of packet that this generates can be found in the `samples` directory.

Core functionality:
* Home page lets you view generated packets and create new ones
* You can create new packets with up to 10 stops
* Packets automatically include directions to each stop, and special instructions for the driver
* Packets also inform the driver what stop each trip will be getting on and off at, as well as the number of tripees on each trip
* View the routes, stops, and trips that have been loaded, along with information about which packets they are present in.

## Development
The first time you download the repo, you will need to run `npm install`.

* `npm start` - Run the server
* `npm run dev` - Run the server in dev mode, with hot-reloading
* `npm test` - Run the test suite
* `npm run validate` - Ensure that the assets in `/static` are valid (requires `vnu` installation)
* `npm run format` Run the linter in `--fix` mode to format the codebase (requires `standard` installation)

With the server running in dev mode, navigate to `http://localhost:3000` in browser to see the application.
The dev mode server will also serve the files in `/static` for requests that do not start with `/api`.
For example:

```
# Responds with the file in ./static/packets.html
GET /packets.html

# Responds with the API response found in ./src/routes/packets.js
GET /api/packets

# Responds with a 404 Not Found
GET /packets
```

This makes development simpler while encouraging you to use a real static file server in production.
*The first route is disable in production.*

You will require a Google Maps API Key.
It should be stored in a one-line `.env` file in the source root:
```
GOOGLE_API_KEY=your_key_here
```

## Deploying to Production
On your desired host:
1. `git clone` this repository
1. `scp` your `.env` file into the repository root, and the font `.woff` files into `/static/fonts`
1. Run `npm run init` to set up the database
1. Run `npm start` in your process manager of choice

You need to use a reverse proxy that will serve the static files itself, and then query the node server to handle `/api` requests.
I recommend nginx for this purpose, because it's well-proven and there are lots of "nginx + node" tutorials
Whichever reverse proxy you use, it should have a sane request size limit for the `/api` route that forwards to this application.

## Bus Packet Format
This is the process that the packet creator follows:
1. Get the directions for the bus route.
	* If the directions are in the database, use the directions in the database
	* Otherwise, query Google Maps for the directions, then save them in the database
1. For each stop, add in any special helpful knowledge or landmarks (confusing stops, specific signs, NOT HERE’s, etc)
1. At each stop on the route, describe which trip(s) will be getting on/off including
    * The trip number
    * The number of people on each trip
1. At each stop, put the approximate time that the bus should be departing; budget 15 minutes for each stop (arrival time at stop ‘n’ = Google maps time + 15\*[n-1] minutes).

A separate packet is required for each trip "direction" i.e. picking up, dropping off, and taking from the lodge require three distinct packets.

## Maintenance
### Library Dependencies
An important and explicit design goal of this codebase is to use as few dependencies as plausible.
To that end, the dependencies that this application does have are carefully chosen and well-contained.
If you are a future maintainer looking at the routing code in `routes.js` and thinking "well, express could handle this for you", hopefully this section explains my choices.

I'm building with technologies that I believe maximize the useful lifetime of this application by minimizing the maintenance cost.
The standards committes that maintain HTML, JS, will add or deprecate features, but never remove them, so as to preserve historical websites.
NodeJS supports the ECMAScript (JS) specification and maintains very long backwards compatibility with deprecated features in its standard library.
You can basically upgrade NodeJS forever and expect that the parts written in pure NodeJS will upgrade smoothly.
If some of the library functions I used get deprecated, it will be your job to maintain them.

The `npm` library has a reputation for being brittle, and as such there are only two production dependencies in this service: `better-sqlite` and `csv-parser`.
The former is a very lightweight shim on top of SQLite (more on SQLite in a moment); the database queries are all written in SQL, so if `better-sqlite` ever stops being supported, it should be pretty straightfoward to replace the library.
The `csv-parser` library is used exactly once.
Writing CSV parsers is very annoying.

In short; upgrading node versions or the library dependencies should be painless.

### Additional Dependencies
This application uses SQLite for storage.
SQLite is an extremely convenient file-writing/caching mechanism that itself maintains [absolutely ludicrous](https://sqlite.org/lts.html) backwards and forward compatibility guarantees.
For this reason it is the recommended storage format for the Library of Congress, and one of the most widely used software libraries ever.
Data created with this application is stored and queried via SQL.
I also use it to save directions so that we're not wasting money by querying the Google Maps API when we don't have to.

### Google Maps
The Google Maps API is obviously unavoidable, and is the portion of the application that is most likely to require maintenance, but I've isolated the API-specific portions to a single file, and will leave detailed directions about how to update that file should it ever become necessary.
I don't trust Google to maintain SQLite-level forward compatibility, but it's safe to say they're going to be pretty careful with the Maps API.
