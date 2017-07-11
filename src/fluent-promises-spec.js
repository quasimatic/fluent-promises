import FluentPromises from './fluent-promises';
import sinon from 'sinon';

function return1() {
	return 1;
}

function return2() {
	return 2;
}

let sandbox = sinon.sandbox.create();
let spyDo1 = sandbox.spy(return1);
let spyDo2 = sandbox.spy(return2);

class TestObject extends FluentPromises {
	do1() {
		return this.makeFluent(spyDo1);
	}

	do2() {
		return this.makeFluent(spyDo2);
	}

	callsDo1AndAdd1() {
		return this.makeFluent(() => this.do1().then(r => r + 1));
	}

	callsDo2AndAdd2() {
		return this.makeFluent(() => this.do2().then(r => r + 2));
	}

	doCatchErrorInternalWrapper() {
		return this.makeFluent(() => {
		}, () => 'caught error');
	}

	doReject() {
		return this.makeFluent(() => Promise.reject('error'));
	}
}

describe('Fluent Promises', () => {
	beforeEach(() => sandbox.reset());

	it('should support getting value with then', () => {
		let test = new TestObject();
		return test.do1().should.eventually.equal(1);
	});

	it('should support getting value with await', async () => {
		let test = new TestObject();
		let result = await test.do1();
		result.should.equal(1);
	});

	it('should call a fluent method inside a makeFluent', () => {
		let test = new TestObject();
		return test.callsDo1AndAdd1().should.eventually.equal(2);
	});

	it('should support getting an inner then value with await', async () => {
		let test = new TestObject();
		let result = await test.callsDo1AndAdd1();
		result.should.equal(2);
	});

	it('should chain calls', async () => {
		let test = new TestObject();

		await test.do1().do2().should.eventually.equal(2);
		spyDo1.callCount.should.equal(1);
		spyDo2.callCount.should.equal(1);
	});

	it('should await a chain of calls', async () => {
		let test = new TestObject();
		let result = await test.do1().do2();
		spyDo1.callCount.should.equal(1);
		spyDo2.callCount.should.equal(1);
		result.should.equal(2);
	});

	it('should keep chain order even if methods called outside of chain', async () => {
		let test = new TestObject();

		test.do1();
		let result = await test.do2();

		spyDo1.callCount.should.equal(1);
		spyDo2.callCount.should.equal(1);
		result.should.equal(2);
	});

	it('should pass return value of then to next in chain', () => {
		let test = new TestObject();
		return test.do1().then(r => r + 1).should.eventually.equal(2);
	});

	it('should support calling then without a resolve function', () => {
		let test = new TestObject();
		return test.do1().then().do2().should.eventually.equal(2);
	});

	it('should allow for then and continuing of chain', async () => {
		let spy = sinon.spy();
		let test = new TestObject();
		let result = await test.do1().then(spy).do2();
		spy.calledWith(1).should.equal(true);
		result.should.equal(2);
	});

	it('should support chaining within a then block and continuing', () => {
		let test = new TestObject();

		return test.do1()
			.then(() => test.do1().do2().should.eventually.equal(2))
			.do2().should.eventually.equal(2);
	});

	it('should chain inside a then and return the inner value', () => {
		let test = new TestObject();
		return test.then(() => test.do1().do2()).should.eventually.equal(2);
	});

	it('should support multiple levels of inner thens', () => {
		let test = new TestObject();

		return test.then(() => {
			return test.do1().then(r1 => {
				return test.do2().then(r2 => r1 + r2);
			});
		}).should.eventually.equal(3);
	});

	it('should call a fluent method multiple times inside a makeFluent', () => {
		let test = new TestObject();
		return test.callsDo1AndAdd1().then(r1 => test.callsDo2AndAdd2().then(r2 => r1 + r2)).should.eventually.equal(6);
	});

	it('should call a separated chain in order', () => {
		let test = new TestObject();
		test.callsDo1AndAdd1();
		return test.callsDo2AndAdd2().callsDo2AndAdd2().then(() => {
			spyDo1.callCount.should.equal(1);
			spyDo2.callCount.should.equal(2);
		});
	});

});

describe('Await', () => {
	beforeEach(() => sandbox.reset());

	it('should continue from an inner then call to a basic one', async () => {
		let test = new TestObject();
		await test.callsDo2AndAdd2().do1().should.eventually.equal(1);
		spyDo2.callCount.should.equal(1);
		spyDo1.callCount.should.equal(1);
	});

	it('should await entire chain of calls with inner thens', async () => {
		let test = new TestObject();
		await test.callsDo1AndAdd1().callsDo2AndAdd2().should.eventually.equal(4);
		spyDo1.callCount.should.equal(1);
		spyDo2.callCount.should.equal(1);
	});

	it('should await entire chain of calls with inner thens', async () => {
		let test = new TestObject();
		await test.callsDo1AndAdd1().callsDo2AndAdd2().callsDo2AndAdd2().should.eventually.equal(4);
		spyDo1.callCount.should.equal(1);
		spyDo2.callCount.should.equal(2);
	});

	it('should call chain with some await at various points', async () => {
		let test = new TestObject();
		test.callsDo1AndAdd1();
		await test.callsDo2AndAdd2().callsDo2AndAdd2().should.eventually.equal(4);
		spyDo1.callCount.should.equal(1);
		spyDo2.callCount.should.equal(2);
	});

	it('should call chain with await at various points', async () => {
		let test = new TestObject();
		await test.callsDo1AndAdd1();
		await test.callsDo2AndAdd2().callsDo1AndAdd1().should.eventually.equal(2);
		spyDo1.callCount.should.equal(2);
		spyDo2.callCount.should.equal(1);
	});

	it('should support multiple chai as promised assertions', async () => {
		let test = new TestObject();
		await test.callsDo1AndAdd1().should.eventually.equal(2);
		await test.callsDo2AndAdd2().callsDo1AndAdd1().should.eventually.equal(2);
		spyDo1.callCount.should.equal(2);
		spyDo2.callCount.should.equal(1);
	});

	it('should support inner await calls within thens', async () => {
		let test = new TestObject();
		let result = await test.callsDo1AndAdd1().then(async r1 => {
			let i = await test.callsDo2AndAdd2().then(r2 => {
				return test.callsDo1AndAdd1().then(r3 => r3 + r2);
			});
			return i + r1;
		});

		result.should.equal(8);
	});

	it('should assert correctly with various types of calls', async () => {
		let test = new TestObject();

		try {
			await test.do1().callsDo2AndAdd2().should.eventually.equal(-1);
			throw new Error('Failed to assert correctly');
		}
		catch (e) {
			if (e.name !== 'AssertionError')
				throw e;
		}
	});
});

describe('Rejections', () => {
	it('should support then taking a reject method', async () => {
		let spyThen = sinon.spy();
		let spyCatch = sinon.spy();

		let test = new TestObject();

		await test.do1().then(spyThen, spyCatch).do2().should.eventually.equal(2);
		await spyThen.callCount.should.equal(1);
		await spyCatch.callCount.should.equal(0);
	});

	it('should catch errors', () => {
		let test = new TestObject();
		return test.doReject().should.be.rejectedWith('error');
	});

	it('should support propagate error if catch does not have a method', () => {
		let test = new TestObject();
		return test.doReject().catch().do1().should.eventually.be.rejectedWith('error');
	});

	it('should catch error in then', async () => {
		let spyCatch = sinon.spy();

		let test = new TestObject();
		await test.doReject()
			.then(() => {
			}, spyCatch)
			.do2().should.eventually.equal(2);

		spyCatch.callCount.should.equal(1);
	});

	it('should propagate error if then method does not catch it', () => {
		let test = new TestObject();
		return test.doReject()
			.then(() => {
			})
			.do2().should.be.rejectedWith('error');
	});

	it('should throw errors within a chain', () => {
		let test = new TestObject();
		return test.do1().doReject().do2().should.be.rejectedWith('error');
	});

	it('should support continuing from a catch', async () => {
		let spy = sinon.spy();
		let test = new TestObject();

		await test.do1().doReject().catch(spy).do2().should.eventually.equal(2);

		spy.calledWith('error').should.equal(true);
	});

	it('should catch error with internal wrapper', () => {
		let test = new TestObject();
		return test.doReject().doCatchErrorInternalWrapper().should.eventually.equal('caught error');
	});

	it('should support calling fluent methods from catch', () => {
		let test = new TestObject();
		return test.doReject()
			.catch(() => {
				return test.do1();
			})
			.should.eventually.equal(1);
	});

	it('should support calling fluent methods from catch handler in a then', () => {
		let test = new TestObject();
		return test.doReject()
			.then(() => {
			}, () => {
				return test.do1();
			})
			.should.eventually.equal(1);
	});
});

describe('Mixin', () => {
	it('should mixin into a class', () => {
		class TestMixin {
			constructor() {
				new FluentPromises(this);
			}

			do1() {
				return this.makeFluent(() => 1);
			}
		}

		let test = new TestMixin();
		return test.do1().should.eventually.equal(1);
	});

	it('should support inner await calls within thens', async () => {
		class TestMixin {
			constructor() {
				new FluentPromises(this);
			}

			do1() {
				return this.makeFluent(spyDo1);
			}

			do2() {
				return this.makeFluent(spyDo2);
			}

			callsDo1AndAdd1() {
				return this.makeFluent(() => this.do1().then(r => r + 1));
			}

			callsDo2AndAdd2() {
				return this.makeFluent(() => this.do2().then(r => r + 2));
			}

			doCatchErrorInternalWrapper() {
				return this.makeFluent(() => {
				}, () => 'caught error');
			}

			doReject() {
				return this.makeFluent(() => Promise.reject('error'));
			}
		}

		let test = new TestMixin();
		let result = await test.callsDo1AndAdd1().then(async r1 => {
			let i = await test.callsDo2AndAdd2().then(r2 => {
				return test.callsDo1AndAdd1().then(r3 => r3 + r2);
			});
			return i + r1;
		});

		result.should.equal(8);
	});
});