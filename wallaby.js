module.exports = function(wallaby) {
	return {
		files: [
			{pattern: 'node_modules/babel-polyfill/dist/polyfill.js', instrument: false},
			{pattern: 'src/**/*.js'},
			{pattern: '!src/**/*-spec.js', load: false},
		],

		tests: [
			{pattern: 'src/**/*-spec.js'}
		],

		compilers: {
			'**/*.js*': wallaby.compilers.babel({
				presets: ['env'],
				babel: require('babel-core')
			})
		},

		env: {
			type: 'node',
			runner: 'node'
		},

		testFramework: 'mocha',

		setup: function() {
			require('babel-polyfill');
			var chaiAsPromised = require('chai-as-promised');
			chai.should();
			chai.use(chaiAsPromised);
		}
	};
};
