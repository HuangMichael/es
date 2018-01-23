<template>
    <div class="form">
        <el-form style="margin:20px;width:60%;min-width:600px;"
            label-width="100px"
            :model="user_data"
            :rules="user_rules"
            ref='user_data'>

			<el-form-item class='edit-form'
						  label="用户名称"
						  prop='name'>

				<el-input
					v-model="user_data.name"
					placeholder='用户名'></el-input>
			</el-form-item>

            <el-form-item class='edit-form'
                label="邮箱"
                prop='email'>
                <el-input
                        v-model="user_data.email" placeholder='常用邮箱'></el-input>
            </el-form-item>

			<el-form-item class='edit-form'
						  label="电话:"
						  prop='mobile'>
				<el-input
					v-model="user_data.mobile"
					placeholder='联系电话'></el-input>
			</el-form-item>


			<el-form-item class='edit-form'
						  label="单位:"
						  prop='department'>

				<el-input
					v-model="user_data.department"
					placeholder='所属单位'></el-input>
			</el-form-item>

			<el-form-item class='edit-form'
						  label="关注区域:"
						  prop='modearea'>

				<el-select v-model="user_data.modearea" placeholder="关注的预报区域" style="width: 400px;">
					<el-option
						v-for='(item,key) in model.area'
						:value='item.value'
						:key="key"
						:label='item.label'></el-option>
				</el-select>


			</el-form-item>

			<el-form-item class='edit-form' label="功能菜单">
				<!-- :filter-node-method="filterNode" -->
				<el-tree
					class="filter-tree"
					show-checkbox
					node-key="access"
					:data="datas.web_routers"
					:props="props.web_routers"
					@check-change='checkChangeWebRouters'
					ref="webRouters">
				</el-tree>
			</el-form-item>

			<el-form-item class='edit-form' label="默认页面">
				<el-select v-model="user_data.default_page" placeholder="登录系统后默认显示的页面" style="width: 400px;">
					<el-option
						v-for='(value,key) in checkeds.web_routers'
						:value='key'
						:key="key"
						:label='value'></el-option>
				</el-select>
			</el-form-item>


            <el-form-item>
                <el-button type="primary" @click='save_user("user_data")'>修改</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
    import ModuleJs from './Module.js';
    export default ModuleJs;
</script>
<style scoped>
    .edit-form{
        width:500px;
    }

	.form{
		margin: 20px;
	}
</style>
