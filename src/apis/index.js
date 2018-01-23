/**
 * Created by <kangming@3clear.com>
 * date: 2017/8/8
 * desc: 导出所有模块需要用到接口
 */
import basic from './basic/';
import forecast from './forecast/';
import monitor from './monitor/';
import account from  './account';

export default [{
	module: 'basic',
	name: '基本信息',
	list: basic
}, {
	module: 'forecast',
	name: '预报接口',
	list: forecast
}, {
	module: 'monitor',
	name: '监测接口',
	list: monitor
}, {
	module: 'account',
	name: '用户、角色',
	list: account
}];
