module.exports = function(wallaby) {
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

		compilers: {
			'**/*.js': wallaby.compilers.babel()
		},

		testFramework: 'mocha',

		setup: function() {
			let chaiAsPromised = require('chai-as-promised');
			var sinonChai = require('sinon-chai');
			chai.should();
			chai.use(chaiAsPromised);
			chai.use(sinonChai);
		}
	};
};
