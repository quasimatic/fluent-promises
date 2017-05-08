export default class FluentPromises {
	constructor() {
		this.promise = Promise.resolve();
	}

	wrapPromise(resolve, reject) {
		return this.waitForThen(resolve, reject);
	}

	waitForThen(resolve, reject = reason => Promise.reject(reason)) {
		this.promise = this.promise.then((value) => resolve.call(this, value), (reason) => reject.call(this, reason));
		return this;
	}

	waitForCatch(reject) {
		this.promise = this.promise.catch((reason) => reject.call(this, reason));
		return this;
	}

	then(onFulfilled = value => Promise.resolve(value), onRejected = reason => Promise.reject(reason)) {
		return this.waitForThen(value => {
				this.promise = Promise.resolve();
				return Promise.resolve(onFulfilled(value));
			},
			(reason) => {
				this.promise = Promise.resolve();
				return Promise.resolve(onRejected(reason));
			});
	}

	catch(onRejected = reason => Promise.reject(reason)) {
		return this.waitForCatch(reason => {
			this.promise = Promise.resolve();
			return Promise.resolve(onRejected(reason));
		});
	}
}