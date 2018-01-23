import * as types from './mutations_types'

export default {
    [types.SET_MENU_OPEN](state) {
        state.width = '250px';
        state.menu_flag = true;
    },
    [types.SET_MENU_CLOSE](state) {
        state.width = '55px';
        state.menu_flag = false;
    },
};
