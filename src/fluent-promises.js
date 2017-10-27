let isAwait = require('./is-native');

class FluentPromises {
	constructor(object = this) {
		let newStack = true;
		let awaitHandled = false;
		let savedValue;

		let methodBeforeAwait;
		let lastMethod;

		function callPreventCircularLock(fp, method, arg) {
			newStack = true;

			if (method === methodBeforeAwait) {
				savedValue = arg;
			}

			if (awaitHandled) {
				arg = arg || savedValue;
				awaitHandled = false;
			}

			if (isAwait(method)) {
				awaitHandled = true;
			}

			let result = method(arg);

			if (!isAwait(method)) {
				newStack = false;
			}

			return result === fp ? result.previousPromise : Promise.resolve(result);
		}

		object.makeFluent = object.then = (resolve = result => result, reject = error => Promise.reject(error)) => {
			if (isAwait(resolve)) {
				methodBeforeAwait = lastMethod;
			}
			else {
				lastMethod = resolve;
			}

			if (newStack) {
				object.previousPromise = new Promise((innerResolve, innerReject) => callPreventCircularLock(object, resolve).then(innerResolve, innerReject));
			} else {
				object.previousPromise = object.previousPromise.then(
					result => callPreventCircularLock(object, resolve, result),
					error => callPreventCircularLock(object, reject, error));
			}
			newStack = false;
			return object;
		};

		object.catch = (reject = error => Promise.reject(error)) => {
			object.previousPromise = object.previousPromise.catch(error => callPreventCircularLock(object, reject, error));
			return object;
		};

		return object;
	}
}

module.exports = FluentPromises;
