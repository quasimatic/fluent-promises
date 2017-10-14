let toString = Object.prototype.toString;
let functionToString = Function.prototype.toString;

let hostConstructorRegEx = /^\[object .+?Constructor\]$/;

let nativeRegEx = RegExp(`^${String(toString).replace(/[.*+?^$\{}()|[\]\/\\]/g, '\\$&').replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?')}$`);

function isNative(value) {
	let type = typeof value;
	return type === 'function' ? nativeRegEx.test(functionToString.call(value)) : (value && type === 'object' && hostConstructorRegEx.test(toString.call(value))) || false;
}

module.exports = isNative;
