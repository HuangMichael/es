<template>
	<div class="body-wrap">
		<!--内容区域-->
		<div class="content" :style="{'right':rightPanelWidth+'px'}">

			<el-row style="margin-top: 12px">
				<el-col :span="24">
					<title-panel :title="contentTitle">
						<div style="padding: 20px">
							<h1>It's Body Content!</h1>
						</div>
					</title-panel>
				</el-col>
			</el-row>

		</div>
		<!--条件区域-->
		<right-panel :rightPanelWidth="rightPanelWidth" :toggleStatus="toggleStatus" @togglePanel="onTogglePanel">
			<!--习惯配置-->
			<setting-dialog :configJson="config"></setting-dialog>

			<!--模块条件区域-->
			<div class="condition-wrap">

				<div class="con-div">
					<span class="con-label">-产品时间-</span>
					<div class="con-body">
						<el-date-picker
							style="width:160px"
							v-model="pDate"
							type="date"
							placeholder="选择日期"
							default-value="2010-10-01">
						</el-date-picker>

						<el-select style="width:100px" v-model="time" placeholder="请选择">
							<el-option
								v-for="item in timeOptions"
								:key="item.value"
								:label="item.label"
								:value="item.value">
							</el-option>
						</el-select>
					</div>
				</div>


				<div class="con-div">
					<span class="con-label">-区域选择-</span>
					<div class="con-body">

					</div>
				</div>


				<div class="con-div">
					<span class="con-label">-城市选择-</span>
					<div class="con-body">
					</div>
				</div>
			</div>

		</right-panel>
	</div>
</template>

<script>
	import moduleJs from './Module.js';

	export default moduleJs;
</script>

<style scoped>
	@import url(./assets/style/style.css);

	.body-wrap {
		color: #49d9fe;
		width: 100%;
		height: 100%;
		font-size: 14px;
	}

	.content {
		position: absolute;
		margin: 12px;
		left: 0;
		top: 0;
		bottom: 0;
	}

	.condition-wrap {
		padding: 10px 24px 10px 24px;
	}

	.con-div {
		margin-bottom: 20px;

	}

	.con-div > span.con-label {
		color: #fff;
	}

	.con-body {
		margin-top: 12px;
	}
</style>

