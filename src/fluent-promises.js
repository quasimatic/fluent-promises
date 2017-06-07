import isNative from './is-native';

class FluentPromises {
	constructor() {
		this.makeFluent = this.then;
		this.newStack = true;
	}

	then(resolve = result => result, reject = error => Promise.reject(error)) {
		this.previousPromise = this.newStack ? new Promise((innerResolve, innerReject) => this.callPreventCircularLock(resolve).then(innerResolve, innerReject)) : this.previousPromise.then(result => this.callPreventCircularLock(resolve, result), error => this.callPreventCircularLock(reject, error));

		this.newStack = false;
		return this;
	}

	catch(reject = error => Promise.reject(error)) {
		this.previousPromise = this.previousPromise.catch(error => this.callPreventCircularLock(reject, error));
		return this;
	}

	callPreventCircularLock(method, arg) {
		this.newStack = true;

		let result = method(arg);

		if (!isNative(method))
			this.newStack = false;

		return result === this ? result.previousPromise : Promise.resolve(result);
	}
}

export default FluentPromises;