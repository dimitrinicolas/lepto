# lepto

> Automated images Editing, Optimization and Analyze

The main purpose of this tool is to make the best images optimizations practices simple to implement in your projects. This project is recent, so use it with care, I'm listening to all feedbacks.

You give to lepto your input directory, the plugins and their options that you want to use, your output directory. Then lepto does his job.

What is the difference with [ImageMin](https://github.com/imagemin/imagemin)? I think that ImageMin and lepto are suitables for differents project. If you deal with large applications, then go on ImageMin, but if you are building small static websites and you want to simply keep your assets directory structure, then you could try lepto.

If you want to learn more about images optimizations, I recommend you the amazing [images.guide](https://images.guide/) by Addy Osmani.

## Usage

```console
$ npm i -D lepto
```

### CLI / npm scripts

I recommend you to use lepto via [lepto-cli](https://github.com/dimitrinicolas/lepto-cli), so it can easily be integrated to your build process with npm sripts.

```console
$ npm i -g lepto-cli
```

Then you can follow the setup process:
```console
$ lepto setup
```
It will guide you to create a configuration file.

Check out [lepto-cli repository](https://github.com/dimitrinicolas/lepto-cli) for more informations.

### GUI

You can access the GUI if you launched lepto from the CLI, by default at the address `http://localhost:4490`.

The purpose of the GUI is to add more precise quality settings to files one by one. You can easily play with the quality slider and see the result at the same time, so you can choose the most suitable option for each of your ressources.

You can also edit your filters and plugins configuration thought the interface.

To save the changes and relaunch lepto's process, click on the Save button or press  <kbd>⌘S</kbd> / <kbd>Ctrl+S</kbd>.

> See below for Node.js API usage.

## Plugins

### Built-in plugins

Lepto carries some built-in plugins, their name is prefixed by `"lepto."`. Theses plugins doesn't create more files than they receives. Their only goal is to optimize files size, they can't ouput a larger file.

#### "lepto.jpeg" using [`sharp`](https://www.npmjs.com/package/sharp)

Default config:
```js
{
  "quality": 80, /* From 1 to 100 */
  "progressive": true
}
```

#### "lepto.png" using [`node-pngquant`](https://www.npmjs.com/package/pngquant)

Default config:
```js
{
  "quality": "70-80", /* From 0 (worst) to 100 (better) */
  "colors": 256, /* From 2 to 256 */
  "speed": 3 /* From 1 (slower but lighter) to 10 (faster but heavier) */
}
```

#### "lepto.gif", using ImageMin's implementation of gifsicle: [`gifsicle`](https://www.npmjs.com/package/gifsicle)

Default config:
```js
{
  "colors": 256 /* From 2 to 256 */
}
```

#### "lepto.svg", using [`svgo`](https://www.npmjs.com/package/svgo)

It follows the [SVGO's config](https://github.com/svg/svgo#what-it-can-do).

### Additional plugins

* [`lepto-resize`](https://github.com/dimitrinicolas/lepto-resize) To resize and create retina alternatives
* [`lepto-vibrant-color`](https://github.com/dimitrinicolas/lepto-vibrant-color) To collect the vibrant colors from your images using `node-vibrant` and save them inside your data json file

## Config

Default config:
```js
{
  "watch": false, /* Watch for input file changes */
  "watchConfig": false, /* Watch for config file change to automatically update it */
  "followUnlink": false, /* Remove ouputed files when the source file is deleted from the input directory */
  "processAll": true, /* Process all files on launch, recommended if followUnlink activated */
  "gui": true, /* The GUI can be disabled */
  "openGui": false, /* Automatically open the GUI in your default browser */
  "guiPort": "4490", /* GUI port */
  "logLevel": "all", /* all 0-3 (0: silent, 1: only errors, ..., 3: all) */
  "dataOutput": null, /* Path of your data json file, eg: output/data.json */
  "dataRootPath": null /* Relative path removed from file names inside the data json file */
}
```

Lepto watch files by default when launched with lepto-cli.

## Node.js API

You simply have to call `lepto()` by giving it your config.

```js
const lepto = require('lepto');

const runner = lepto({
  input: 'assets/input',
  output: 'assets/output',
  filters: [

  ]
  /* ...config */
})
```

Now you can listen to events with the `on(event, callback)` method, the events are `all` for all events, `success`, `info`, `warn`, `error` and `processed-file`.

The `success`, `info` and `warn` events gives an object with a `msg` inside, eg: `{ msg: 'Info message' }`.

The `error` just gives a string of the error message.

The `processed-file` gives an object with informations about the file process:

```js
{
  adj: 'new', /* file watch event: '' (initial process), 'new' or 'changed' */
  input: 'icons/github.png',
  inputSize: 1000000, /* sizes in bytes */
  outputSizes: [ 20000, 50000 ]
  output: [ 'icons/github.png', 'icons/github@2x.png' ],
  timeSpent: 300 /* process time in ms */
}
```

Example of events integration:

```js
runner.on('error', msg => {
  console.error(msg);
});
runner.on('processed-file', data => {
  /* deal with data */
});
runner.on('all', (data, event) => { /* When listening to 'all' events, the callback receive the event name as a seconde argument */
  if (typeof data.msg !== 'undefined') {
    console.log(event + data.msg);
  }
});
```

## Contributing

### Lepto Build process

I have not yet integrated test because I'm waiting to integrate a method that takes as argument a single buffer, and return multiples outputs with only a list of plugins without globs filters (in prevision of an integration to gulp). I thought it would be difficult to integrate tests with such an "independent" tool (it decides by itself to process files by watching the input directory).

So there is only a build step for the GUI part that can be launched with the `npm start` command. It will watch for css and js files changes from the `gui/src/` directory and compiles them into `gui/dist/` with Babel and PostCSS.

Because you could ask yourself the question: I love React but I didn't used it for the GUI because I had planned to deal with many `contenteditable` elements that are terrible to work with React. The part of the is messy I admit it, I have to tidy up.

### Lepto Plugin writing

A lepto plugin has to deal with multiples output files associated to one input file, a plugin is a function called with the plugins options that must return a function that will process the files. This last function receive an `input` object, a `fulfill` method and an object of `utils` methods.

The `input` object looks like that:
```js
input = {
  input: 'icons/social/github.png',
  outputs: [
    {
      dir: 'icons/social',
      filename: 'github.png',
      buffer: <Buffer>
    },
    {
      dir: 'icons/social',
      filename: 'github@2x.png',
      buffer: <Buffer>
    }
  ],
  data: {}
};
```

If the plugin is the first called, it will receive only one output, additional outputs are created by others plugins.

A data object is shared between plugins during the process of files, his content will be saved to a json file choosed by the user.

Example of lepto plugin:
```js
const plugin = (opts={}) => {
  return function plugin(input, fulfill, utils) {
    let finish = -input.outputs.length + 1;
    const next = () => {
      finish++;
      if (finish > 0) {
        fulfill(input);
      }
    };
    for (let i in input.outputs) {
      optimizer(input.outputs[i].buffer).then(function(i) {
        return function(buffer) {
          input.outputs[i].buffer = buffer;
          next();
        };
      }(i));
    }
  };
};

module.exports = plugin;
```

Utils functions:

* `utils.size(Buffer)` return an object like `{ width: 100, height: 100 }`.
* `utils.mime(Buffer)` return the mime type as a string, eg: `"image/jpeg"`, [learn more here](https://developer.mozilla.org/fr/docs/Web/HTTP/Basics_of_HTTP/MIME_types).
* `utils.base(String)` return the base name of a file name, eg: `"IMG001.JPG"` > `"IMG001"`.
* `utils.ext(String)` return the extension of a file name, eg: `"IMG001.JPG"` > `"JPG"`.

You can inspire yourself by the [built-in plugins](plugins/).

## License

This project is licensed under the [MIT license](LICENSE).
