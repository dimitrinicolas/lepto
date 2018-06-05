import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default [
	{
		input: 'src/main.js',
		output: {
			name: 'overflowColor',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
      babel({
        presets: [
          [
            'env',
            { modules: false }
          ]
        ],
        plugins: [
          'external-helpers'
        ],
        externalHelpers: true
      }),
			resolve(),
			commonjs()
		]
	},
	{
		input: 'src/main.js',
		external: ['ms'],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		],
    plugins: [
      babel({
        presets: [
          [
            'env',
            { modules: false }
          ]
        ],
        plugins: [
          'external-helpers'
        ],
        externalHelpers: true
      })
    ]
	}
];
