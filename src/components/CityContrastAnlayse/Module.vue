<template>
	<div class="CityContrastAnalyse">
		<!--内容区域-->
		<div class="content" ref="el_content" :style="{'right':rightPanelWidth+'px'}">
			<div ref="el_menu" class="el_menu_content">
				<div class="top_menu">						
					<el-checkbox-group :min="1" v-if="modelCeecked.length !== 0"  v-model="modelCeecked">
						<el-checkbox @change="(value)=>{modelchange(value, item)}" v-for="item in modelCObj.options" :label="item.value" :key="item.value" border>
							<span v-html="item.label"></span>
						</el-checkbox>
					</el-checkbox-group>
				</div>
				<div class="top_menu">
				    <el-date-picker
				      v-model="timeDuring"
				      @change="changeRefresh_Time"
				      type="daterange"
				      align="right"
				      unlink-panels
				      :clearable="false"
				      range-separator="至"
				      start-placeholder="开始日期"
				      end-placeholder="结束日期"
				      :picker-options="pickerOptions">
				    </el-date-picker>
				</div>
				<div class="top_menu dateTypeDiv">						
					<el-radio-group v-if="dateType !== '' " @change="changeRefresh" v-model="dateType">
						<el-radio-button v-for="item in dateTypeObj.options" :label="item.value" :key="item.value">
							<span v-html="item.label"></span>
						</el-radio-button>
					</el-radio-group>
				</div>
				<div class="top_menu" v-show="false"><el-button @click="exportExcel('导出Excel')" type="primary" icon="el-icon-document">导出Excel</el-button></div>
			</div>
			<div class="el_row_content" ref="el_row_panelContent">
				<title-panel :title="contentTitle" class="title-panelCOM">
					<div class="title-panelBody" id="CityContrastAnalyse_charts">
						<div class="title-panel-content">
							<div class="charts-body" v-for="item in cityChecked" :key="item">
								<div class = "content-cityimg">
									<img :src="getCityImage(item)" class="citysImage" alt="" />
								</div>
								<div class="content-charts">
									<div :id="chartsIdRe + item"  class="chartsstyle"></div>
								</div>
							</div>
						</div>
					</div>
				</title-panel>
			</div>
		</div>
		<!--条件区域-->
		<right-panel :rightPanelWidth="rightPanelWidth" :toggleStatus="toggleStatus" @togglePanel="onTogglePanel">
			<!--模块条件区域-->
			<div class="condition-wrap">
				<div class="con-div">
					<span class="con-label">-{{pollutionTitle}}-</span>
					<div class="con-body">
						<el-radio-group @change="changeRefresh" v-if="pollution !== '' " v-model="pollution">
							<el-radio-button v-for="item in polRObj.options" :label="item.value" :key="item.value">
								<span v-html="item.label"></span>
							</el-radio-button>
						</el-radio-group>
					</div>
				</div>

				<div class="con-div">
					<span class="con-label">-{{chartStableTitle}}-</span>
					<div class="con-body">
						<el-radio-group @change="stableChange" v-if="chartStable !== '' " v-model="chartStable">
							<el-radio-button  v-for="item in chartStableObj.options" :label="item.value" :key="item.value">
								<span v-html="item.label"></span>
							</el-radio-button>
						</el-radio-group>
					</div>
				</div>

				<div class="con-div">
					<span class="con-label">-{{cityCObjTitle}}-</span>
					<div class="con-body">
						<el-checkbox-group :min="1" v-if="cityChecked.length !== 0" v-model="cityChecked">
							<div v-for="item in cityCObj.options" :key="item.value" class="cityCheckDiv">
								<el-checkbox @change="(value)=>{cityCheck(value, item)}"  :label="item.value" border>
									<span v-html="item.label"></span>
								</el-checkbox>
							</div>
						</el-checkbox-group>
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
	.CityContrastAnalyse {
		position: relative;
		color: #49d9fe;
		width: 100%;
		height: 100%;
		font-size: 14px;
	}
	.CityContrastAnalyse .content {
		position: absolute;
		margin: 12px;
		margin-top: 0px;
		left: 0;
		top: 0;
		bottom: 0;
	}
	.CityContrastAnalyse .condition-wrap {
		padding: 10px 24px 10px 24px;
	}
	.CityContrastAnalyse .con-div {
		margin-bottom: 20px;
	}
	.CityContrastAnalyse .con-div > span.con-label {
		color: #fff;
	}
	.CityContrastAnalyse .con-body {
		margin-top: 12px;
	}
	.CityContrastAnalyse .cityCheckDiv{
		margin-top: 12px;
		text-align: center;
	}
	/*顶部菜单的css*/
	.CityContrastAnalyse .el_menu_content{
		position: relative;
		margin: 0px;
		padding: 0px;
		width: 100%;
		text-align:right;
	}
	.CityContrastAnalyse .top_menu{
		position: relative;
		margin-top:12px;
		margin-right: 12px;
		display: inline-block;
	}
	.CityContrastAnalyse .dateTypeDiv{
		margin-right: 0px;
	}
	.CityContrastAnalyse .el_row_content{
		position: relative;
		margin: 0px;
		padding: 0px;
		/*title-panel top:-20;*/
		margin-top: 26px;
	}
	.CityContrastAnalyse .title-panelCOM{
		/*整个组件的背景颜色*/
	    position: relative;
    	height: 100%;
		background-color: rgba(18,44,81,1);
	}
	.CityContrastAnalyse .title-panelBody{
		position: absolute;
		width: 100%;
		height: 100%;
		overflow-y: auto;
	}
	.CityContrastAnalyse .title-panel-content{
		position: relative;
		width: 100%;
		max-height:100%;
		padding: 20px 0px 10px 0px;
		box-sizing: border-box;
	}
	.CityContrastAnalyse .charts-body{
		position: relative;
		width: 100%;
		height: 328px;
		border-bottom: 1px dashed #104f84;
	}
	.CityContrastAnalyse .content-cityimg{
		position: relative;
		display: inline-block;
		float: left;
		width: 140px;
		height: 328px;
        vertical-align: middle;
        text-align: center;
	}
	.CityContrastAnalyse .citysImage{
        position: absolute;
        width: 140px;
        height: 140px;
        display: inline-block;
        background-repeat:no-repeat;
        top: 50%;
        left: 50%;
        margin-top: -70px; /* 高度的一半 */
        margin-left: -70px; /* 宽度的一半 */
	}
	.CityContrastAnalyse .content-charts{
		float: right;
		display: inline-block;
        width:-moz-calc(100% - 140px); 
        width:-webkit-calc(100% - 140px); 
        width: calc(100% - 140px); 
		height: 328px;
	}
	.CityContrastAnalyse .chartsstyle{
		position:relative;
		height:100%;
		width: 100%;
	}
</style>

