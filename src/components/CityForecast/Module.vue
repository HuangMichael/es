<template>
	<div class="body-wrap" >
		<!--内容区域-->
		<div class="content"  :style="{'right':rightPanelWidth+'px'}">
			<div class="top">

				<span  class="predTitleColor">预报产品：</span>
				<el-radio-group v-model="pol" v-if="pol!==''" class="polStyle" @change="getNowTarget">
							<el-radio-button v-for="item in pols" :key="item.value" :label="item.value" >
								{{item.label}}
							</el-radio-button>
				</el-radio-group>
				<el-radio-group v-model="dataType" v-if="dataType!==''" class="dataTypeStyle" @change="getNowTarget" v-show="false">
							<el-radio-button v-for="item in dataTypes" :key="item.value" :label="item.value">
								{{item.label}}
							</el-radio-button>
				</el-radio-group>
			</div>
			<el-row style="margin-top: 12px;">
				<el-col :san="24">

					<title-panel :title="contentTitle+'各预报产品预报统计图'" style="background:rgba(18,44,81,1);">
						<div style="padding-top: 20px;">
							<div class="firstChart" :id="firstchartId.id" v-if="firstchartId" >

							</div>
						</div>
					</title-panel>

				</el-col>
			</el-row>
			<el-row style="height: calc(100% - 400px);width: 100%;">
				<el-col :san="24" style='margin-top: 12px;height: calc(100%);background-color: rgba(18,44,81,1);'  id="manyChart">
				<div style="min-height: 320px;height: 100%;" >
						<div class="chartStyle" v-for="(item,index) in othChartId"  :id="item.id">

						</div>
				</div>
				</el-col>
			</el-row>
		</div>
		<!--条件区域-->
		<right-panel :rightPanelWidth="rightPanelWidth" :toggleStatus="toggleStatus" @togglePanel="onTogglePanel">
			<!--习惯配置-->
			<!--<setting-dialog :configJson="config"></setting-dialog>-->

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
							:clearable="false"
							@change="changePreDate"
							default-value="2010-10-01">
						</el-date-picker>

						<el-select style="width:100px" v-model="time" placeholder="请选择" @change="timeChange">
							<el-option
								v-for="item in timeOptions"
								:key="item.value"
								:label="item.label"
								:disabled="item.disabled"
								:value="item.value">
							</el-option>
						</el-select>
					</div>
				</div>


				<div class="con-div">
					<span class="con-label">-模式选择-</span>
					<div class="con-body">

						<el-radio-group v-model="model" v-if="model!==''" @change="getNowTarget">
							<el-radio-button v-for="item in models" :key="item.value" :label="item.value">
								{{item.label}}
							</el-radio-button>
						</el-radio-group>
					</div>
				</div>
				<div class="con-div">
					<span class="con-label">-区域选择-</span>
					<div class="con-body">
						<el-radio-group v-model="area" v-if="area!==''" @change="getNowTarget">
							<el-radio-button v-for="item in areas" :key="item.value" :label="item.value">
								{{item.label}}
							</el-radio-button>
						</el-radio-group>
					</div>
				</div>


				<div class="con-div">
					<span class="con-label">-城市选择-</span>

					<div class="con-body">
						<div class="breadcrumbStyle">
							<span >当前选择：</span>
							<el-breadcrumb v-if="breadcrumbArr.length>0" separator-class="el-icon-arrow-right" style="line-height: 30px;">

							  <el-breadcrumb-item v-for="(item,index) in breadcrumbArr" >{{item.label}}</el-breadcrumb-item>

							</el-breadcrumb>
						</div>

							<el-tree accordion :render-content="renderNodeContent"   :default-expanded-keys="defaultExpanded" ref="tree" :data="treeData" :props="defaultProps" @node-click="handleNodeClick" highlight-current node-key='code' ></el-tree>

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

	.breadcrumbStyle{

		min-height: 30px;
		line-height: 30px;
		background-color: #083e6b;
	}
	.breadcrumbStyle span{
		padding-left: 12px;
		float: left;
	}
	.top{
		width: 100%;
		text-align: right;
	}
	.polStyle{
		margin-right: 0px;
	}
	.dataTypeStyle{
		margin-right: 20px;
	}
	.predTitleColor{
		color: #ffffff;
	}
	.firstChart{
		height: 320px;
		width: 100%;
	}
	.chartStyle{
		width: 100%;
		height: 320px;
		background-color: rgba(18,44,81,1);
		
	}
</style>

