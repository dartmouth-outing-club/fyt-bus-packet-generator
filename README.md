# FYT Bus Packet Generator
The “bus packet” is a human-readable document containing all the information that the bus driver will require to succesfully complete their trip.
This is a simple webapp to generate the the bus packets for each trip.
A example of the kind of packet that this generates can be found in the `samples` directory.

Current functionality:
* Home page lets you view previously generated packets
* You can create new packets with up to 10 stops
* Generated packets automatically include directions to each stop, and special instructions for the driver

Future functionality:
* List the trips that will be on the bus and what stop they will be getting off at
* View the routes that have been loaded already
* Download all the packets

## Development
The first time you download the repo, you will need to run `npm install`.

* `npm start` - Run the server
* `npm run dev` - Run the server in dev mode, with hot-reloading
* `npm test` - Run the linter and the test suite
* `npm run validate` - Ensure that the assets in `/static` are valid (requires `vnu` installation)
* `npm run format` Run the linter in `--fix` mode to format the codebase

With the server running in dev mode, navigate to `http://localhost:3000` in browser to see the application.

## Deployment instructions
On your desired host:
1. `git clone` this repository
1. `scp` your `.env` file into the repository root, and the font `.woff` files into `/static/fonts`
1. Run `npm run init` to set up SQLite
1. Run `npm start` in your process manager of choice

## Bus Packet Format
This is the process that the packet creator seeks to automate:
1. Get the directions for each bus route from Google maps
1. For each stop, add in any special helpful knowledge or landmarks (confusing stops, specific signs, NOT HERE’s, etc)
1. At each stop on the route, describe which trip(s) will be getting on/off including
    * The trip number
    * The leader names
    * The number of people on each trip
    * The number of people who should be in the bus at the end of the stop
1. At each stop, put the approximate ETA, so drivers can know how they’re fitting into the schedule.
1. Budget 15 minutes for each stop. (Arrival time at stop ‘n’ = Google maps time + 15\*[n-1] minutes).

A separate packet is required for each trip "direction" i.e. picking up, dropping off, and taking from the lodge require three distinct packets.

## Maintenance and Dependencies
This app has exactly two production dependencies: a library dependency on `better-sqlite`, a set of node bindings for the SQLite database engine, and a service dependency on the Google Maps Directions API.
Everything else runs using solely standards-compliant HTML, CSS, and JavaScript.

I'm choosing to build using only these technologies because I would like this application to be made continually available essentially forever.
The JavaScript that ran in Netscape Navigator would run in today's Google Chrome; by the [Lindy Effect](https://en.wikipedia.org/wiki/Lindy_effect), we can expect that JavaScript will continue to be supported for the next 27 years (half-kidding).
The standards committes that maintain HTML, JS, will add or deprecate features, but never remove them, so as to preserve historical websites.
That's a level of support that we'd like to build our apps on top of.

### SQLite
SQLite is an extremely convienent file-writing/caching mechanism that itself maintains [absolutely ludicrous](https://sqlite.org/lts.html) backwards compatibility guarantees, and the foundation guarantees forward compatibility through the year 2050.
For this reason it is the recommended storage format for the Library of Congress, and one of the most widely used software libraries of all time.
I use it to save directions so that we're not wasting money by querying the API when we don't have to.
It also creates a convient file that can be queried with SQL.

### Google Maps
The Google Maps API is obviously unavoidable, and is the portion of the application that is most likely to require maintenance, but I've isolated the API-specific portions to a single file, and will leave detailed directions about how to update that file should it ever become necessary.
I don't trust Google to maintain SQLite-level forward compatibility, but it's safe to say they're going to be pretty careful with the Maps API.
