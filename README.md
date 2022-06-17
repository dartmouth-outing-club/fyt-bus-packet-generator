# Trips Busing Packet Creator
A simple webapp to generate the the bus packets for each trip.

A example of the kind of packet that this generates can be found in the `samples` directory.

## Development
* `npm test` - Run the linter and the test suite
* `npm run format` Run the linter in `--fix` mode to format the codebase

## Packet Parameters
The “busing packet” is a human-readable document containing all the information that the bus driver will require to succesfully complete their trip. A separate packet is required for each trip "direction" i.e. picking up, dropping off, and taking from the lodge require three distinct packets.

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


