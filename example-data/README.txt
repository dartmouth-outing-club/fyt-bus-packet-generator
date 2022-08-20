This directory contains examples of the various data read and output by the packet generator.

Some sample queries using httpie (make sure to add the key):

http https://maps.googleapis.com/maps/api/directions/json origin==44.875039,-71.05471 destination==43.7031377,-72.2898190 waypoints==43.977253,-71.8154831 key== > grant-to-lodge-to-hanvoer.json
