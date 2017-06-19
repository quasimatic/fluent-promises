import isNative from './is-native';

class FluentPromises {
	constructor(object = this) {
		let newStack = true;

		function callPreventCircularLock(fp, method, arg) {
			newStack = true;

			let result = method(arg);

			if (!isNative(method))
				newStack = false;

			return result === fp ? result.previousPromise : Promise.resolve(result);
		}

		object.makeFluent = object.then = (resolve = result => result, reject = error => Promise.reject(error)) => {
			object.previousPromise = newStack ? new Promise((innerResolve, innerReject) => callPreventCircularLock(object, resolve).then(innerResolve, innerReject)) : object.previousPromise.then(result => callPreventCircularLock(object, resolve, result), error => callPreventCircularLock(object, reject, error));
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

export default FluentPromises;