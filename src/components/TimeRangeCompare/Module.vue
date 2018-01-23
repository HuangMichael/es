<template>
	<div class="body-wrap">
		<!--内容区域-->
		<div class="content" :style="{'right':rightPanelWidth+'px'}">
			<el-row>
				<el-col :span="24" style="text-align: right">
					<el-radio-group @change="onChangePollutant" v-model="selectedPol" @statusChange="onChangePollutant">
						<el-radio-button v-for="item in pollutants" :label="item.paramName" :key="item.paramName">
							<span v-html="item.displayName"></span>
						</el-radio-button>
					</el-radio-group>


				</el-col>
			</el-row>
			<el-row style="margin-top: 15px;background: #081c42;">
				<el-col :span="24">
					<title-panel :title="chartTitle">
						<div class="title-panelBody" id="timeRangeCompareChart">
							<div class="title-panel-content">
								<div class="charts-body">
									<!--<div class="content-cityimg">-->
										<!--<img :src='getCityImage(currSelectObj.code)' class="citysImage" alt=""/>-->
									<!--</div>-->
									<div class="content-charts">
										<div class="chartsstyle" id="chart" style="height:280px;width: 100%"></div>
									</div>
								</div>
							</div>
						</div>
					</title-panel>
				</el-col>
			</el-row>
			<el-row style="margin-top: 32px" class="weather-wrapper">
				<el-col :span="24">
					<title-panel :title="tableTitle">
						<el-table id="timeRangeCompareTable"
								  ref="pTable"
								  stripe
								  :data="tableData"
								  :height="tableMaxHt"
								  style="width: 100%;margin-top: 25px;font-size: 14px;">
							<el-table-column align="center"
											 prop="monitorDate"
											 label="日期"
											 width="110">
							</el-table-column>
							<el-table-column label="AQI" align="center">
								<el-table-column
									prop="aqi_min"
									label="最小值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="aqi_avg"
									label="平均值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="aqi_max"
									label="最大值"
									width="68">
								</el-table-column>
							</el-table-column>
							<el-table-column label="PM₁₀" align="center">
								<el-table-column
									prop="pm10_min"
									label="最小值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="pm10_avg"
									label="平均值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="pm10_max"
									label="最大值"
									width="68">
								</el-table-column>
							</el-table-column>
							<el-table-column label="PM₂.₅" align="center">
								<el-table-column
									prop="pm25_min"
									label="最小值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="pm25_avg"
									label="平均值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="pm25_max"
									label="最大值"
									width="68">
								</el-table-column>
							</el-table-column>
							<el-table-column label="SO₂" align="center">
								<el-table-column
									prop="pm25_min"
									label="最小值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="pm25_avg"
									label="平均值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="pm25_max"
									label="最大值"
									width="68">
								</el-table-column>
							</el-table-column>


							<el-table-column label="N0₂" align="center">
								<el-table-column
									prop="no2_min"
									label="最小值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="no2_avg"
									label="平均值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="no2_max"
									label="最大值"
									width="68">
								</el-table-column>
							</el-table-column>
							<el-table-column label="CO" align="center">
								<el-table-column
									prop="co_min"
									label="最小值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="co_avg"
									label="平均值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="co_max"
									label="最大值"
									width="68">
								</el-table-column>
							</el-table-column>


							<el-table-column label="O₃" align="center">
								<el-table-column
									prop="o3_min"
									label="最小值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="o3_avg"
									label="平均值"
									width="68">
								</el-table-column>
								<el-table-column
									prop="o3_max"
									label="最大值"
									width="68">
								</el-table-column>
							</el-table-column>

						</el-table>
					</title-panel>
				</el-col>
			</el-row>
		</div>
		<!--条件区域-->
		<right-panel :rightPanelWidth="rightPanelWidth" :toggleStatus="toggleStatus" @togglePanel="onTogglePanel">
			<!--<setting-dialog :configJson="config"></setting-dialog>-->
			<div class="condition-wrap">
				<div class="con-div">
					<span class="con-label">-时段对比-</span>
					<div class="top_menu">
						<el-date-picker
							v-model="timeRange"
							type="daterange"
							align="right"
							unlink-panels
							range-separator="至"
							start-placeholder="开始日期"
							end-placeholder="结束日期"
							@change="onChangeTimeRange"
							:picker-options="pickerOptions">
						</el-date-picker>
					</div>
				</div>
				<div class="con-div">
					<span class="con-label">-城市选择-</span>
					<div class="con-body">
						<el-tree :data="treeData" node-key="code" ref="cityTree" :accordion=true
								 :default-expanded-keys="expandKeys" :expand-on-click-node=false :highlight-current=true
								 :props="defaultProps"
								 @node-click="handleNodeClick" :render-content="renderNodeContent"></el-tree>
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

	.dt-row {
		margin-left: 12px;
		margin-top: 34px;
		background-color: rgb(20, 79, 122);
		text-align: center;
		height: 32px;
		line-height: 32px;
		color: #04e7e1;
		margin-bottom: 8px;
	}


	.condition-wrap {
		padding: 10px 24px 10px 24px;
	}

	.con-div {
		margin-bottom: 20px;

	}

	.con-div > span.con-label {
		color: #fff;
		font-size: 14px;
	}

	.con-body {
		margin-top: 12px;
	}

	.weather-wrapper {
		background: url("./assets/images/wbg.png") no-repeat;;
		background-size: 100% 100%;
	}

</style>

