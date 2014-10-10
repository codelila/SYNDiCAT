Direktkredite
============

A service for tracking small loans with diverse terms, conditions, cancelation periods and loaners.

Prerequisites
----

Direktkredite runs on nodejs. It needs `xelatex` in `$PATH` and a populated `REMOTE_USER` set by a
reverse proxy in front of it.

Installation
----

```sh
# Install prerequisites
aptitude install nodejs npm git texlive-xetex

# Get source code
git clone https://github.com/codelila/SYNDiCAT.git

cd SYNDiCAT/

# Install dependencies
npm install

# Run tests
npm test
```

Configuration
-------------

Copy ``config/debtor.json.example`` to ``config/debtor.json`` and edit it
accordingly.

Running
----

```sh
# Start server in ADMIN_PARTY mode
# You can kill the server anytime with Strg+C
ADMIN_PARTY=someuser nodejs .

# Or, if you are not running Debian's nodejs
ADMIN_PARTY=someuser node .
```

You should now be able to browse to `http://localhost:3000` and be logged in as `someuser`.

For production usage, you would have to setup a reverse proxy such as nginx in front of SYNDiCAT.
This proxy must populate `REMOTE_SERVER`. You should not use `ADMIN_PARTY` in that case, obviously.
