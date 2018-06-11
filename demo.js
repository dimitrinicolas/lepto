const lepto = require('./src/lepto.js');

let runner = lepto({
  input: './demo/input',
  output: './demo/output',
  watch: true,
  dataOutput: './demo/output/data.json',
  filters: [
    {
      glob: ['**/*.{jpg,jpeg}'],
      use: [
        require('./plugins/resize.js')({
          width: 10
        }),
        require('./plugins/vibrant-color.js')(),
        {
          name: 'lepto.webp'
        }
      ]
    },
    {
      glob: '**/*.png',
      use: [
        {
          name: 'lepto.resize',
          width: 32
        }
      ]
    },
    {
      dir: 'incr',
      use: [
        {
          name: 'lepto.resize',
          width: 32
        }
      ]
    }
  ]
});

runner.handleLog(console.log);
