module.exports = function() {
	return {
		files: [
			{pattern: 'src/**/*.js'},
			{pattern: '!src/**/*-spec.js', load: false},
		],

		tests: [
			{pattern: 'src/**/*-spec.js'}
		],

		env: {
			type: 'node',
			runner: 'node'
		},

		testFramework: 'mocha',

		setup: function() {
			let chaiAsPromised = require('chai-as-promised');
			chai.should();
			chai.use(chaiAsPromised);
		}
	};
};
