SmartThings CLI Live Log Viewer
===============================

This is a simple CLI tool that queries the SmartThings "Live Logging" server
and prints some nice colorful logs.

This is a total hack and it uses some dirty tricks under the hood to make
the connection. It may work for a while and they may change their setup and 
break it. You can use this until they do :)

install
-------

Required Node.js 6+ and npm

`npm -g install st-logger`

usage
-----

If you don't pass `-u` or `-p` you will be prompted, this cli tool does not store the information,
it simply passes it along to ST for a login cookie and then uses that. The auth details and cookie are
lost once the cli exits.

    Streaming Live Logging from the SmartThings Graph API
    Usage: bin/st-logger -u <user> -p <pass>

    Options:
      --user, -u     Your SmartThings username (email)                      [string]
      --pass, -p     Your SmartThings password                              [string]
      --type, -t     Filter the event types: event,info,debug,trace (comma
                     seperated)         [string] [default: "event,info,debug,trace"]
      -h, --help     Show help                                             [boolean]
      -v, --version  Show version number                                   [boolean]


