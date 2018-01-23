import Vue from 'vue';
import axios from 'axios';
import VueAxios from 'vue-axios';
import {dateUtils} from 'utils/dateUtils.js';

Vue.use(VueAxios, axios);

// 导入封装的回调函数
import {
    cbs,
    gbs
} from 'config/';

// 动态设置本地和线上接口域名
// Vue.axios.defaults.baseURL = gbs.host;
Vue.axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

/**
 * 封装axios的通用请求
 * @param  {string}   type      get或post
 * @param  {string}   url       请求的接口URL
 * @param  {object}   data      传的参数，没有则传空对象
 * @param  {Function} fn        回调函数
 * @param  {boolean}   tokenFlag 是否需要携带token参数，为true，不需要；false，需要。一般除了登录，都需要
 */
export function request({
                            type,
                            path,
                            data,
                            fn,
                            errFn,
                            tokenFlag,
                            headers,
                            opts
                        } = {}) {

    var options = {
        method: type,
        url: path,
        headers: headers && typeof headers === 'object' ? headers : {}
    };

    //检测接口权限
    let api_flag = true;//todo 判断是否有接口权限  有了token就无需再判断
    if (api_flag === true) {
        options[type === 'get' ? 'params' : 'data'] = data;
        if (tokenFlag !== true) {
            if (!this.$store.state.user.userinfo.token) {//判断token是否存在或过期
                this.$alert('未授权！', '错误', {
                    confirmButtonText: '确定',
                    type: 'error'
                });
                this.$router.push('/login');
                return {};
            } else if (this.$store.state.user.userinfo.token['.expires']) {
                let expiresData = dateUtils.strToDate(this.$store.state.user.userinfo.token['.expires']);
                let diff = dateUtils.dateDiff('n', new Date(), expiresData);
                if (diff >= 2)
                    options.headers['Authorization'] = this.$store.state.user.userinfo.token.token_type + ' ' + this.$store.state.user.userinfo.token.access_token;
                else {
                    this.$router.push('/login');
                    return {};
                }
            }
            else {
                this.$router.push('/login');
                return {};
            }
        }

        //axios内置属性均可写在这里
        if (opts && typeof opts === 'object') {
            for (let f in opts) {
                options[f] = opts[f];
            }
        }

        if (!fn) {
            return Vue.axios(options);
        }
        else {
            // 分发显示加载样式任务
            tokenFlag ? '' : this.$store.dispatch('show_loading');
            //发送请求
            Vue.axios(options).then((res) => {
                this.$store.dispatch('hide_loading');
                console.log(res);
                let data = [];
                if (res[gbs.api_status_key_field] === gbs.api_status_value_field) {
                    if (gbs.api_data_field) {
                        data = res[gbs.api_data_field];
                        // fn(res[gbs.api_data_field]);
                    } else {
                        data = res.data;
                        // fn(res.data);
                    }
                    if (data[gbs.api_3clear_data_field] != undefined) {
                        if (data[gbs.api_3clear_status_key_field] == gbs.api_3clear_status_value_field) {
                            data = data[gbs.api_3clear_data_field];
                            fn(data);
                        } else {
                            this.$alert(data[gbs.api_3clear_status_message], '提示', {
                                confirmButtonText: '确定',
                                type: 'warning'
                            });

                            if (errFn) {
                                errFn.call(this, data);
                            }
                        }
                    }
                    else {
                        fn(data);
                    }
                } else {
                    this.$store.dispatch('hide_loading');
                    if (gbs.api_custom[res[gbs.api_status_key_field]]) {
                        gbs.api_custom[res[gbs.api_status_key_field]].call(this, res);
                    } else {
                        if (errFn) {
                            errFn.call(this, res.data);
                        } else {
                            cbs.statusError.call(this, res.data);
                        }
                    }
                }
            }).catch((err) => {
                if (errFn)
                    errFn.call(this, []);
                this.$store.dispatch('hide_loading');
                cbs.requestError.call(this, err);
            });
        }
    } else {
        this.$alert('您没用权限请求该接口！', '请求错误', {
            confirmButtonText: '确定',
            type: 'warning'
        });
    }
}

export function all(promises, sucFn, errFn) {
    this.$store.dispatch('show_loading');
    Vue.axios.all(promises).then(
        (res) => {
            if (res.length > 0 && res[0].data[gbs.api_3clear_data_field]) {
                res.forEach((item) => {
                    if (item.data[gbs.api_3clear_status_key_field] === gbs.api_3clear_status_value_field) {
                        item.data = item.data[gbs.api_3clear_data_field];
                    } else {
                        this.$alert(item.data[gbs.api_3clear_status_message], '提示', {
                            confirmButtonText: '确定',
                            type: 'warning'
                        });

                        if (errFn) {
                            errFn.call(this, []);
                        }
                    }
                });
                sucFn(res);
            }
            else
                sucFn(res);
            this.$store.dispatch('hide_loading');
        }
    ).catch((err) => {
        this.$store.dispatch('hide_loading');
    });
}
