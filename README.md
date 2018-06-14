# lepto

```console
$ npm i -D lepto
```

## Usage

### CLI / npm scripts

I recommend you to use lepto via [lepto-cli](https://github.com/dimitrinicolas/lepto-cli), so it can easily be integrated to your build process with npm sripts.

```console
$ npm i -g lepto-cli
```

Then you can follow the setup process:
```console
$ lepto setup
```

### Node.js API

### GUI

You can access the GUI if you launched lepto from the CLI, by default at the address `https://localhost:4490`.

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

## Plugins

### Built-in plugins

Lepto carries some built-in plugins, their name is prefixed by a `"lepto."`. Theses plugins doesn't create more files than they receives. Their only goal is to optimize files size, they can't ouput a file larger than the input.

#### lepto.jpeg

It use [`sharp`](https://www.npmjs.com/package/sharp).

Default config:
```js
{
  "quality": 80, /* From 1 to 100 */
  "progressive": true
}
```

#### lepto.png

It use [`node-pngquant`](https://www.npmjs.com/package/pngquant).

Default config:
```js
{
  "quality": "70-80", /* From 0 (worst) to 100 (better) */
  "colors": 256, /* From 2 to 256 */
  "speed": 3 /* From 1 (slower but lighter) to 10 (faster but heavier) */
}
```

#### lepto.gif

It use ImageMin's implementation of gifsicle: [`gifsicle`](https://www.npmjs.com/package/gifsicle).

Default config:
```js
{
  "colors": 256 /* From 2 to 256 */
}
```

#### lepto.svg

It use [`svgo`](https://www.npmjs.com/package/svgo).

It follows the [SVGO's config](https://github.com/svg/svgo#what-it-can-do).

### Additional plugins

- [`lepto-resize`] To resize and create retina alternatives
- [`lepto-vibrant-color`] To collect the vibrant colors from your images using `node-vibrant`

[`lepto-resize`]: https://github.com/dimitrinicolas/lepto-resize
[`lepto-vibrant-color`]: https://github.com/dimitrinicolas/lepto-vibrant-color

## Contributing

### lepto Build process

I have not yet integrated test because I'm waiting to integrate a method that takes as argument a single buffer, and return multiples outputs with only a list of plugins without globs filters (in prevision of an integration to gulp). I thought it would be difficult to integrate tests with such an "independent" tool (it decides by itself to process files by watching the input directory).

So there is only a build step for the GUI part that can be launched with the `npm start` command. It will watch for css and js files changes from the `gui/src/` directory and compiles them into `gui/dist/` with Babel and PostCSS.

### lepto Plugin writing

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
          if (buffer.length < input.outputs[i].buffer.length) {
            input.outputs[i].buffer = buffer;
          }
          next();
        };
      }(i));
    }
  };
};

module.exports = plugin;
```

Utils functions:

- `utils.size(Buffer)` return an object like `{ width: 100, height: 100 }`.
- `utils.mime(Buffer)` return the mime type as a string, eg: `"image/jpeg"`, [learn more here](https://developer.mozilla.org/fr/docs/Web/HTTP/Basics_of_HTTP/MIME_types).
- `utils.base(String)` return the base name of a file name, eg: `"IMG001.JPG"` > `"IMG001"`.
- `utils.ext(String)` return the extension of a file name, eg: `"IMG001.JPG"` > `"jpg"`.

You can inspire yourself by the [built-in plugins](plugins/).

## License

This project is licensed under the [MIT license](LICENSE).
