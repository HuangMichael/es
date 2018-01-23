<template>
    <div class="list">
        <el-col :span="24" class='actions-top'>

            <el-form :inline="true" class="demo-form-inline">
                <el-form-item>
                    <el-button type="default" @click='onBtnAddRole'><i class="fa fa-plus-circle" style="padding-right: 5px"></i>新建角色</el-button>
                </el-form-item>
            </el-form>
        </el-col>
        <el-table border style="width: 100%" align='center'
                  :data="role_list">

            <el-table-column
                    prop="name"
                    label="角色名称"
                    align="center"
                    width="150"
                    :sortable="true">
            </el-table-column>

            <el-table-column
                    prop="description"
                    label="说明"
                    align="center"
                    :sortable="false">
            </el-table-column>


            <el-table-column
                    prop="status"
                    label="功能权限"
                    align="left"
                    >
				<template scope="scope">
					<el-tag  v-for="(name,index) in scope.row.access"
						type="primary"
						close-transition
					style="margin: 5px">{{name}}</el-tag>
				</template>
            </el-table-column>

            <el-table-column
                    label="操作"
                    :width="260"
                    :context="_self">
                <template scope='scope'>
                    <el-button
                            type="info"
                            icon='view'
                            size="mini"
                            @click='onSelectRole(scope.row)'></el-button>
                    <el-button
						v-if="scope.row.id!=-1"
                            type="info"
                            icon='edit'
                            size="mini"
                            @click='onEditRole(scope.row)'></el-button>

                    <el-button
						v-if="scope.row.id!=-1"
                            type="primary"
                            size="mini"
                            @click='onBtnSetAccess(scope.row,scope.$index,role_list)'>设置权限
                    </el-button>

                    <el-button v-if="scope.row.id!=-1"
                            type="danger"
                            icon='delete'
                            size="mini"
                            @click='onDeleteRole(scope.row,scope.$index,role_list)'></el-button>

                </template>
            </el-table-column>
        </el-table>

		<el-dialog title="角色信息" v-model="dialog.show" size="tiny">
			<el-form style="margin:20px;width:60%;"
					 label-width="100px"
					 :model="dialog.role_info">
				<el-form-item class='edit-form'
							  label="角色名称:"
							  prop='name'>
					{{dialog.role_info.name}}
				</el-form-item>

				<el-form-item label="角色说明:">
					{{dialog.role_info.description}}
				</el-form-item>


				<el-form-item label="角色权限:" class='edit-form'>
					<el-tree
						class="filter-tree"
						default-expand-all
						node-key="path"
						:data="curr_access"
						:props="defaultProps"
						>
					</el-tree>
				</el-form-item>
			</el-form>
			<span slot="footer" class="dialog-footer">
                <el-button type="primary" @click="dialog.show = false">关 闭</el-button>
            </span>
		</el-dialog>

		<el-dialog title="设置权限" v-model="dialog_access.show" size="tiny">
			<el-form style="margin:20px;width:80%"
					 label-width="100px"
					 :model="dialog_access.roleinfo">
				<el-form-item class='edit-form'
							  label="角色名称"
							  prop='name'>
					{{dialog_access.roleinfo.name}}
				</el-form-item>
				<el-form-item class='edit-form'
							  label="说明"
							  prop='description'>
					{{dialog_access.roleinfo.description}}
				</el-form-item>


				<el-form-item class='edit-form'>
					<el-tree
						class="filter-tree"
						show-checkbox
						default-expand-all
						node-key="access"
						:default-checked-keys="currAccess"
						:data="accesss"
						:props="defaultProps"
						:filter-node-method="filterNode"
						ref="updateAccesss"
						>
					</el-tree>
				</el-form-item>

			</el-form>
			<span slot="footer" class="dialog-footer">
                <el-button @click="dialog_access.show = false">取 消</el-button>
                <el-button type="primary" @click="onResetRoleAccess">确 定</el-button>
            </span>
		</el-dialog>

        <el-dialog :title="isEdit==true?'编辑角色':'新建角色'" v-model="dialog_add.show" size="tiny">
            <el-form style="margin:20px;width:80%;"
                     label-width="100px"
					 ref="roleInfo"
					 :rules="rule_data"
                     :model="dialog_add.role_info">
                <el-form-item class='edit-form'
                              label="角色名称"
                              prop='name'>

					<el-input
						v-model="dialog_add.role_info.name"
						placeholder='角色名称'></el-input>

                </el-form-item>
                <el-form-item class='edit-form'
                              label="说明"
                              prop='description'>

					<el-input
						v-model="dialog_add.role_info.description"
						placeholder='说明'></el-input>

                </el-form-item>



                <el-form-item class='edit-form' v-if="!isEdit">
                    <el-tree
                            class="filter-tree"
                            show-checkbox
                            default-expand-all
                            node-key="path"
                            :data="accesss"
                            :props="defaultProps"
                            :filter-node-method="filterNode"

                            ref="accesss">
                    </el-tree>
                </el-form-item>

            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialog_add.show = false;getList()">取 消</el-button>
                <el-button type="primary" @click="onAddRole">确 定</el-button>
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

	.filter-tree{
		height: 250px;
		overflow-y: auto;
	}
</style>
