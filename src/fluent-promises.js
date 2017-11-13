import isAwait from './is-await';

class FluentPromises {
	constructor(object = this) {
		let newStack = true;
		let awaitHandled = false;

		let savedValueBeforeAwait;
		let saveResolveMethod = false;
		let methodToRecordResultFor;

		function wrapProxy(o) {
			return new Proxy(o, {
				get(target, key) {
					if (key === 'makeFluent' || key === 'then')
						saveResolveMethod = true;

					return Reflect.get(target, key);
				}
			});
		}

		function callPreventCircularLock(fp, method, arg) {
			newStack = true;

			if (method === methodToRecordResultFor) {
				savedValueBeforeAwait = arg;
			}

			if (awaitHandled) {
				arg = arg || savedValueBeforeAwait;
				awaitHandled = false;
			}

			let result = method(arg);

			if (!isAwait(method)) {
				newStack = false;
			}
			else {
				awaitHandled = true;
			}

			return result === fp ? result.previousPromise : Promise.resolve(result);
		}

		object.makeFluent = object.then = (resolve = result => result, reject = error => Promise.reject(error)) => {
			if (saveResolveMethod) {
				methodToRecordResultFor = resolve;
				saveResolveMethod = false;
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

		return wrapProxy(object);
	}
}

module.exports = FluentPromises;
