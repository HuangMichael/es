<template>
    <div class="head-nav" :style="{'height':headerHt+'px'}">


        <!--<el-row>-->
            <!--<el-col :span="24" class="logo-container">-->
                <!--<img src="../../assets/logo.png" alt="">-->
            <!--</el-col>-->
        <!--</el-row>-->


        <div style=";background-color: #163b6d;"
             :style="{'height':headerHt+'px','line-height':headerHt+'px'}">
            <img  style="margin-bottom: 9px;margin-left: 25px;margin-right: 80px" src="../../assets/logo.png" alt="">
            <el-menu

                    unique-opened router
                    :default-active="$store.state.router.leftCurRouter"
                    :active="$store.state.router.headerCurRouter"
                    mode="horizontal"
                    background-color="#163b6d"
                    text-color="#fff"
                    active-text-color="#fff">
                <template v-for="(route,index) in $router.options.routes">
                    <el-submenu :index="route.path" v-if="!route.hidden&&route.children.length>1">
                        <template slot="title">
                            <i :class="route.icon  +' icon'"
                               :style="{'color':$store.state.router.headerCurRouter===route.path?'#fff':'#fff'}"></i>
                            {{route.name}}
                        </template>

                        <el-menu-item
                                v-for='(child,cindex) in route.children'
                                :key='route.path+"/"+child.path'
                                :index='route.path+"/"+child.path'>
                            <i :class="child.icon  +' icon'"></i>
                            {{child.name}}
                        </el-menu-item>
                    </el-submenu>

                    <el-menu-item v-else-if="!route.hidden"
                                  :index="route.path"
                                  :key='route.path'>
                        <!--<i :class="route.icon"></i>-->
                        <i :class="route.icon +' icon'"></i>
                        {{route.name}}<!-- {{item.path}} -->
                    </el-menu-item>

                </template>
            </el-menu>

            <div class="userInfo" :style="{'top':(headerHt-27)/2+'px'}">
                <div class="userNameDiv">
                    <i class="fa fa-user-circle" style="margin-right: 5px"></i>
                    <el-dropdown
                            trigger="click"
                            @command='setDialogInfo'>
                            <span class="el-dropdown-link">
                                {{this.$store.state.user.userinfo.un}}<i
                                class="el-icon-caret-bottom el-icon--right"></i>
                            </span>
                            <el-dropdown-menu slot="dropdown">
                                <!-- <el-dropdown-item command='info'>修改信息</el-dropdown-item> -->
                                <el-dropdown-item
                                    command='pass'
                                    >修改密码</el-dropdown-item>
                                <!--<el-dropdown-item-->
                                    <!--command='set'-->
                                    <!--&gt;系统设置</el-dropdown-item>-->
                                <!--<el-dropdown-item-->
                                    <!--command='set'-->
                                    <!--v-if='$store.state.user.userinfo.pid==0'>系统设置</el-dropdown-item>-->
                                <el-dropdown-item
                                    command='logout'>退出</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                   <!--  <span> {{$store.state.user.userinfo.un}}</span> -->
                </div>

                <div class="logoutDiv" @click='logout'>
                    <i class="fa fa-power-off logout"></i>
                    <span>退出</span>
                </div>
            </div>
        </div>


        <el-dialog size="small" :title="dialog.title"
                   :visible="dialog.show_pass">
            <el-form style="margin:20px;width:80%;"
                     label-width="100px"
                     :model="dialog.user_info"
                     :rules="dialog.user_info_rules"
                     ref='user_info'>
                <!--<el-form-item class='edit-form'-->
                <!--label="邮箱"-->
                <!--prop='email'>-->
                <!--<el-input v-model="dialog.user_info.Email" disabled placeholder='常用邮箱'></el-input>-->
                <!--</el-form-item>-->
                <el-form-item class='edit-form'
                              label="用户名称"
                              prop='name'>
                    <el-input v-model="dialog.user_info.name" disabled placeholder='用户名'></el-input>
                </el-form-item>
                <el-form-item class='edit-form'
                              label="当前密码"
                              prop='oldPassword'>
                    <el-input
                            type='password'
                            placeholder='当前密码'
                            auto-complete='off'
                            v-model="dialog.user_info.oldPassword"></el-input>
                </el-form-item>
                <el-form-item class='edit-form'
                              label="新密码"
                              prop='newPassword'>
                    <el-input
                            type='password'
                            placeholder='新密码'
                            auto-complete='off'
                            v-model="dialog.user_info.newPassword"></el-input>
                </el-form-item>
                <el-form-item class='edit-form'
                              label="确认密码"
                              prop='password_confirm'>
                    <el-input
                            type='password'
                            placeholder='确认密码'
                            auto-complete='off'
                            v-model="dialog.user_info.password_confirm"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialog.show_pass = false">取 消</el-button>
                <el-button type="primary" @click="updUserPass('user_info')">确 定</el-button>
            </span>
        </el-dialog>


        <!--<el-dialog size="small" :title="dialog.title"-->
        <!--v-model="dialog.show_set">-->
        <!--<el-form style="margin:20px;width:80%;"-->
        <!--label-width="100px"-->
        <!--v-model='dialog.set_info'-->
        <!--ref='set_info'>-->
        <!--<el-form-item label="登录方式">-->
        <!--<el-select placeholder="请选择登录方式"-->
        <!--v-model='dialog.set_info.login_style'>-->
        <!--<el-option label="单一登录" value="1"></el-option>-->
        <!--<el-option label="多点登录" value="2"></el-option>-->
        <!--</el-select>-->
        <!--</el-form-item>-->
        <!--<el-form-item label="禁止修改密码">-->
        <!--<el-select placeholder="请选择用户"-->
        <!--multiple-->
        <!--v-model='dialog.set_info.disabled_update_pass'>-->
        <!--&lt;!&ndash; value的值的ID是number，disabled_update_pass的元素中的是字符串，-->
        <!--所以在value上，需要拼装一个空串，来转化-->
        <!--因为elementUI内部用了===-->
        <!--&ndash;&gt;-->
        <!--<el-option-->
        <!--v-for='(user,index) in dialog.set_info.select_users'-->
        <!--:key='index'-->
        <!--:label='user.username'-->
        <!--:value='user.id+""'></el-option>-->
        <!--</el-select>-->
        <!--</el-form-item>-->
        <!--</el-form>-->
        <!--<span slot="footer" class="dialog-footer">-->
        <!--<el-button @click="dialog.show_set = false">取 消</el-button>-->
        <!--<el-button type="primary" @click="onUpdateSetting">确 定</el-button>-->
        <!--</span>-->
        <!--</el-dialog>-->
    </div>
</template>

<script>
    import HeadNavJs from './HeadNav.js';

    export default HeadNavJs;
</script>

<style scoped lang='less'>
    .logo-container {
        height: 73px;
        /*background-color: #0b2650;*/
        text-align: center;
    }

    .icon {
        margin-right: 4px;
        color: #fff;
    }

    .logo {
        height: 50px;
        width: auto;
        margin-left: 10px;
        margin-top: 5px;
    }

    .fa-user {
        position: relative;
        top: -2px;
        margin-right: 4px;
    }

    .el-menu {
        display: inline-block;
        text-align: center;
    }

    .head-nav {
        width: 100%;
        /*height: 60px;*/
        /*background-color: #163b6d !important;*/
        position: fixed;
        top: 0px;
        left: 0px;
        z-index: 1001;
        color: #FFF;
        font-size: 15px;
    }

    .userInfo {
        display: inline-block;
        position: absolute;
        right: 10px;
        /*cursor: pointer;*/
        height: 27px;
        line-height: 27px;
        background: #0f336c;
        border: 2px solid #1c53a7;
        border-radius: 13px;
        color:#00b9ff;
    }

    .userInfo>div{
        position: relative;
        display: inline-block;
    }

    /*border-bottom: 1px solid #1F2D3D;*/

    .logout {
        /*width: 60px;*/
        /*height: 60px;*/
        /*line-height: 60px;*/
        text-align: center;
        cursor: pointer;
        margin-right: 5px;
        color:red;
    }

    .username {
        /*height: 60px;*/
        /*line-height: 60px;*/
        cursor: pointer;
    }

    .el-dropdown {
        color: #FFF;
    }


    .userNameDiv{
        padding: 0 20px 0 17px;
        border-right: 2px solid #1c53a7;
    }
    .logoutDiv{
        cursor: pointer;
        padding: 0 17px 0 20px;
    }

</style>
