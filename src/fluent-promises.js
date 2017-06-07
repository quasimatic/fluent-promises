import isNative from './is-native';

class FluentPromises {
	constructor() {
		let newStack = true;

		function callPreventCircularLock(fp, method, arg) {
			newStack = true;

			let result = method(arg);

			if (!isNative(method))
				newStack = false;

			return result === fp ? result.previousPromise : Promise.resolve(result);
		}

		this.makeFluent = this.then = (resolve = result => result, reject = error => Promise.reject(error)) => {
			this.previousPromise = newStack ? new Promise((innerResolve, innerReject) => callPreventCircularLock(this, resolve).then(innerResolve, innerReject)) : this.previousPromise.then(result => callPreventCircularLock(this, resolve, result), error => callPreventCircularLock(this, reject, error));
			newStack = false;
			return this;
		};

		this.catch = (reject = error => Promise.reject(error)) => {
			this.previousPromise = this.previousPromise.catch(error => callPreventCircularLock(this, reject, error));
			return this;
		};
	}
}

export default FluentPromises;