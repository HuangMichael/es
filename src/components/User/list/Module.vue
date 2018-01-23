<template>
    <div class="list">

		<el-col :span="24" class='actions-top'>

			<el-form :inline="true" class="demo-form-inline">
				<el-form-item>
					<el-button type="default" @click='onBtnAddUserEvt'><i class="fa fa-plus-circle" style="padding-right: 5px"></i>新建用户</el-button>
				</el-form-item>
			</el-form>
		</el-col>

        <el-table border style="width: 100%" align='center'
                  :data="user_list"
                  >
            <el-table-column
                    prop="name"
                    label="姓名"
                    align="center"
                    :sortable="true">
            </el-table-column>
            <el-table-column
                    prop="email"
                    label="邮箱"
                    align="center"
                    :sortable="true">
            </el-table-column>

			<el-table-column
				prop="mobile"
				label="电话"
				align="center"
				:sortable="true">
			</el-table-column>

            <el-table-column
                    prop="department"
                    label="单位"
                    align="center"
                    >
            </el-table-column>
            <el-table-column
                    prop="rolename"
                    label="角色"
                    align="center"
                    :sortable="true"

                    >
            </el-table-column>

            <el-table-column
                    label="操作"
                    :width="$store.state.user.userinfo.pid==0 ? 280 : 260"
                    :context="_self">
                <template scope='scope'>
                    <el-button
                            type="info"
                            icon='view'
                            size="mini"
                            @click='onSelectUser(scope.row)'></el-button>
                    <el-button
                            type="info"
                            icon='edit'
                            size="mini"
                            @click='onEditUser(scope.row)'></el-button>

                    <el-button
                            type="danger"
                            icon='delete'
                            size="mini"
                            @click='onDeleteUser(scope.row)'></el-button>

					<el-button
						type="danger"
						icon='setting'
						size="mini"
						@click='onResetPw(scope.row)'></el-button>

                </template>
            </el-table-column>
        </el-table>

        <el-dialog title="用户信息" v-model="dialog.show" size="tiny">
            <el-form style="margin:20px;width:80%"
                     label-width="100px"
                     :model="dialog.user_info">

				<el-form-item class='edit-form'
							  label="用户名称:"
							  prop='username'>
					{{dialog.user_info.name}}
				</el-form-item>

                <el-form-item class='edit-form'
                              label="邮箱:"
                              prop='email'>
                    {{dialog.user_info.email}}
                </el-form-item>


                <el-form-item label="电话:">
                    {{dialog.user_info.mobile}}
                </el-form-item>

				<el-form-item label="角色:">
					{{dialog.user_info.rolename}}
				</el-form-item>

				<el-form-item label="单位:">
					{{dialog.user_info.department}}
				</el-form-item>

            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialog.show = false">取 消</el-button>
                <el-button type="primary" @click="dialog.show = false">确 定</el-button>
            </span>
        </el-dialog>


        <el-dialog :title="isEdit==true?'编辑用户':'新建用户'" :visible="dialog_add.show" size="tiny">
            <el-form style="margin:20px;width:80%"
                     label-width="100px"
					 ref="userinfo"
					 :rules="rule_data"
                     :model="dialog_add.userinfo">

				<el-form-item class='edit-form'
							  label="用户名称:"
							  prop='name'>

					<el-input
						v-model="dialog_add.userinfo.name"
						placeholder='用户名称'></el-input>

				</el-form-item>

                <el-form-item class='edit-form'
                              label="邮箱:"
                              prop='email'>
					<el-input
						v-model="dialog_add.userinfo.email"
						placeholder='邮箱地址'></el-input>
                </el-form-item>

				<el-form-item class='edit-form'
							  label="电话:"
							  prop='mobile'>
					<el-input
						v-model="dialog_add.userinfo.mobile"
						placeholder='联系电话'></el-input>
				</el-form-item>


				<el-form-item class='edit-form'
							  label="单位:"
							  prop='department'>

					<el-input
						v-model="dialog_add.userinfo.department"
						placeholder='所属单位'></el-input>
				</el-form-item>


				<el-form-item label="角色:" prop="role_id">
					<el-select v-model="dialog_add.userinfo.role_id" placeholder="请选择用户角色">

						<el-option v-for="r in role_list" :label="r.name" :value="r.id"></el-option>
					</el-select>
				</el-form-item>

				<el-form-item label="密码:" v-if="!isEdit">
					创建成功的初始密码为<strong>1234556</strong>
				</el-form-item>

            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialog_add.show = false;getList()">取 消</el-button>
                <el-button type="primary" @click="onAddUser">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
	import ModuleJs from './Module.js';
	export default ModuleJs;
</script>
<style scoped lang='less'>
	.list{
		margin: 20px;
	}
    .demo-form-inline {
        display: inline-block;
        float: right;
    }

    .btm-action {
        text-align: center;
    }

    .actions-top {
		margin-top: 8px;
        height: 46px;
    }

    .pagination {
        display: inline-block;
    }
</style>
