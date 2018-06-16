# nlog

## What is nlog?

nlog is a utility for processing and storing data from log files in a way which
makes it easier to work with the data. Rather than your applications logs all 
being dumped into a log file for you to dig through when you are debugging, 
nlog watches the files and knows what to look for. Using patterns defined in 
configuration files, nlog is aware of the shape of a given line of data, and 
how each part of the data should be interpretted.

When paired with an nlog client, the real value becomes apparent. Clients 
connect to nlog's web socket server to subscribe to particular data streams 
and get realtime updates whenever anything happens in the log file, presenting 
to data in a sleek and easy to read format - or whatever other format you want 
the data in.

## Who is nlog for?

nlog was designed to solve the problem of speed debugging programs during development. 
Although there are plans to expand the scope of nlog's functionality in the future, 
in its current state, it primarily stands to benefit developers who want more oversight 
of their log files during development to speed up the process.

## How can I use nlog?

While nlog is still in development as of writing this, it is currently 100% ready for 
standard use cases. The normal workflow in setting up nlog is pretty simple.

### The Configurations

The first step is to define what you want to set nlog to watch. This is done using 
configuration files (located by default at `~/.nlog/conf.d/`). A standard configuration 
file might look something like this:

```
{
  "name": "Display Name",
  "target": "/path/to/log/file",
  "rules": {
    "regex": "^\\[(.+?)\\] (.*)\\.(.\\w+): (.*?) ([\\[{].*[}\\]]) ([\\[{].*[}\\]])",
    "matches": [
      {
        "name": "timestamp",
        "displayName": "Time",
        "type": "timestamp"
      },
      {
        "name": "environment",
        "type": "string"
      },
      {
        "name": "severity",
        "type": "string"
      },
      {
        "name": "message",
        "type": "string"
      },
      {
        "name": "data",
        "type": "json"
      },
      {
        "name": "other",
        "type": "json"
      }
    ]
  }
}
```

The configuration file is made of a number of important parts. The most essential 
fields for the config to have are the `target`, the `rules.regex` and the `rules.matches`.
The target defines which file will be watched for changes, the regex defines the 
expected structure of each line, and specifies capture groups which should contain 
valuable information, and the matches is an array which describes in order, 
what each capture group contains, what type of data it is, and what it should be named.

The above example configuration should be suitable for interpreting Laravel log files
with structures like this:

```
[2018-06-14 01:47:13] vm.INFO: Some data i want to log {"foo": "bar", "baz": [1,2,3,4,5]} []
```

### The Applications

Clone the repo and install node modules

`git clone https://github.com/cpave3/nlog && cd nlog && npm install`

Initialise the clients

`git submodule init && git submodule update && git submodule foreach npm install`

Start the nlog server (although it is planned, there is currently no headless mode, 
so you might want to do this in a `tmux` session or something like that)

`npm link && nlog` or `node ./src/index.js`

Start an nlog client (the CLI client is currently stable, the react client is in development)

`cd ./clients/nlog-cli && npm link && nlog-cli`
