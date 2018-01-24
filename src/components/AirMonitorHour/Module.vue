<template>
	<div class="body-wrap">
		<!--内容区域-->
		<div class="content" :style="{'right':rightPanelWidth+'px'}">
			<el-row>
				<el-col :span="24" style="text-align: right">
					<!--<span style="margin-right: 14px">污染物:</span>-->
					<el-radio-group v-model="polType" @change="onPolTypeChange">
						<!--// v-if="model!==''" @change="onModelChange"-->
						<el-radio-button v-for="item in polTypes" :key="item.value" :label="item.value">{{item.label}}
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
						<el-table id="DataRangeContrastTable"
								  ref="pTable"
								  stripe
								  :data="tableData"
								  :height="tableMaxHt"
								  style="width: 100%;margin-top: 25px;font-size: 14px;">
							<el-table-column v-for="item in tableColumns" :prop="item.prop" :label="item.label"
											 :min-width="item.width"
											 :align="item.align" :sortable="item.sortable">
								<template scope="scope">
									<div>
										{{scope.row[scope.column.property]}}
									</div>
								</template>
								<el-table-column
									v-for="child in item.children" :prop="child.prop" :label="child.label"
									:min-width="child.width"
									:align="child.align" :sortable="child.sortable">
									<template scope="scope">
										<div  :style="scope.row">
											{{scope.row[scope.column.property]}}
										</div>
									</template>
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
					<span class="con-label">-时段选择-</span>
					<div class="con-body">
						<el-date-picker
							v-model="timeRange"
							type="daterange"
							align="right"
							unlink-panels
							range-separator="至"
							start-placeholder="开始日期"
							end-placeholder="结束日期"
							@change="onChangeDateRange"
							:picker-options="pickerOptions">
						</el-date-picker>


						<!--<el-select style="width:90px" @change="onIntervalChange" v-model="time" placeholder="请选择">-->
						<!--<el-option-->
						<!--v-for="item in timeOptions"-->
						<!--:key="item.value"-->
						<!--:label="item.label"-->
						<!--:value="item.value">-->
						<!--</el-option>-->
						<!--</el-select>-->
					</div>
				</div>

				<!--<div class="con-div">-->
				<!--<span class="con-label">-区域选择-</span>-->
				<!--<div class="con-body">-->
				<!--<el-radio-group @change="onRegionChange" v-model="area" v-if="area!==''">-->
				<!--<el-radio-button v-for="item in areas" :key="item.value" :label="item.value">-->
				<!--{{item.label}}-->
				<!--</el-radio-button>-->
				<!--</el-radio-group>-->
				<!--</div>-->
				<!--</div>-->

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

	.holiday {
		color: #16e7a1;
	}

	.data-row {
		/*margin-top: 20px;*/
		margin-bottom: 8px;
		margin-left: 12px;

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

