import FluentPromises from './fluent-promises';
import sinon from 'sinon';

function return1() {
	return 1;
}

function return2() {
	return 2;
}

class TestObject extends FluentPromises {
	do1() {
		return this.makeFluent(return1);
	}

	do2() {
		return this.makeFluent(return2);
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
	it('should support getting value with then', () => {
		let test = new TestObject();
		return test.do1().should.eventually.equal(1);
	});

	it('should chain calls', async () => {
		let test = new TestObject();
		let spy = sinon.spy(test, 'makeFluent');

		await test.do1().do2().should.eventually.equal(2);
		spy.args.should.deep.equal([[return1], [return2]]);
	});

	it('should keep chain order even if methods called outside of chain', async () => {
		let test = new TestObject();
		let spy = sinon.spy(test, 'makeFluent');

		test.do1();
		await test.do2();

		return spy.args.should.deep.equal([[return1], [return2]]);
	});

	it('should support calling then without a resolve function', () => {
		let test = new TestObject();
		return test.do1().then().do2().should.eventually.equal(2);
	});

	it('should support then taking a reject method', async () => {
		let spyThen = sinon.spy();
		let spyCatch = sinon.spy();

		let test = new TestObject();

		await test.do1().then(spyThen, spyCatch).do2();
		await spyThen.callCount.should.equal(1);
		await spyCatch.callCount.should.equal(0);
	});

	it('should call reject function in the then method', () => {
		let test = new TestObject();
		return test.doReject().then(() => {
		}).do2().should.eventually.be.rejectedWith('error');
	});

	it('should catch errors', () => {
		let test = new TestObject();
		return test.doReject().should.eventually.be.rejectedWith('error');
	});

	it('should catch errors within a chain', () => {
		let test = new TestObject();
		return test.do1().doReject().do2().should.be.rejectedWith('error');
	});

	it('should support catch with a method', () => {
		let test = new TestObject();
		return test.doReject().catch().do1().should.eventually.be.rejectedWith('error');
	});

	it('should allow for then and continuing of chain', async () => {
		let spy = sinon.spy();
		let test = new TestObject();
		await test.do1().then(spy).do2();
		spy.calledWith(1).should.equal(true);
	});

	it('should support chaining within a then block', () => {
		let test = new TestObject();

		return test.do1()
			.then(() => test.do1().do2().should.eventually.equal(2))
			.do2().should.eventually.equal(2);
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
});