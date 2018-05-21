# Steam Player Bans

Checking a Steam players game bans using the [Steam Web API](https://developer.valvesoftware.com/wiki/Steam_Web_API).

# Development

This project requires [Node.js](http://nodejs.org/) (>= v8) and [npm](https://npmjs.org/) (comes with Node).

Install dependencies with `npm`:

    $ npm install

Start production build:

    $ npm start

Starting development server:

    $ npm run dev


## Configuration (API Keys etc.)

In order to load the configuration make sure there is a `config.json` file in the `src/` folder or provide a URL to it by setting the env var `CONFIG`.

Windows Powershell E.g: `$env:CONFIG="https://<url-to-config.json>"`.
