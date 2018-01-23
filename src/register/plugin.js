/**
 * Created by <kangming@3clear.com> on 2017/8/8.
 */

import {ajax} from 'utils/';
import request from 'apis/';


let plugins = {};

for (var i = 0; i < request.length; i++) {
	if (typeof request[i] === 'object' && request[i].list && Array.isArray(request[i].list)) {
		for (var j = 0; j < request[i].list.length; j++) {
			plugins[request[i].list[j].method] = (function (n, m) {
				return function ({type = request[n].list[m].type, path = request[n].list[m].path, data, fn, errFn, tokenFlag, headers, opts} = {}) {

					return ajax.request.call(this, {
						type,
						path,
						data,
						fn,
						errFn,
						tokenFlag,
						headers,
						opts
					});


				};
			})(i, j);

		}
	}
}

plugins['promiseAll'] = function (promises, sucFn, errFn) {
	return ajax.all.call(this, promises, sucFn, errFn);
};

export default plugins;
