<template>
	<div class="body-wrap">
		<!--内容区域-->
		<div class="content" :style="{'right':rightPanelWidth+'px'}">
			<el-row>
				<el-col :span="24" style="text-align: right">
					<span style="margin-right: 14px">默认模式(测试):</span>
					<el-radio-group v-model="model" v-if="model!==''" @change="onModelChange">
						<el-radio-button v-for="item in models" :key="item.value" :label="item.value">{{item.label}}
						</el-radio-button>
					</el-radio-group>

				</el-col>
			</el-row>
			<el-row style="margin-top: 15px;background: #081c42;">
				<el-col :span="24">
					<title-panel :title="tableTitle">
						<el-table id="cityPredictDayTable"
								  ref="pTable"
								  stripe
								  :data="tableData"
								  :height="tableMaxHt"
								  style="width: 100%;margin-top: 25px;font-size: 14px;">

							<el-table-column type="expand">
								<template slot-scope="props">
									<el-table
										ref="cTable"
										stripe
										:data="props.row.otherTableData"
										:show-header=false
										style="width: 100%">
										<el-table-column v-for="item in tableColumns" :prop="item.prop"
														 :label="item.label" :min-width="item.width"
														 :align="item.align" :sortable="item.sortable">

											<template scope="scope">
												<div
													v-if="(scope.column.property.indexOf('aqi')>-1&&scope.column.property!=='aqi_level')"
													:style="styleObject(scope.row[scope.column.property])">
													{{scope.row[scope.column.property]}}
												</div>

												<div v-else-if="scope.column.property==='primary_pollutant'">
													<span v-html="scope.row[scope.column.property]"></span>
												</div>
												<div v-else>
													{{scope.row[scope.column.property]}}
												</div>
											</template>
											<el-table-column v-if="item.children&&item.children.length>0"
															 v-for="child in item.children" :prop="child.prop"
															 :label="child.label"
															 :min-width="child.width"
															 :align="child.align" :sortable="child.sortable">
												<template scope="scope">
													<div
														v-if="(scope.column.property.indexOf('aqi')>-1&&scope.column.property!=='aqi_level')"
														:style="styleObject(scope.row[scope.column.property])">
														{{scope.row[scope.column.property]}}
													</div>

													<div v-else-if="scope.column.property==='primary_pollutant'">
														<span v-html="scope.row[scope.column.property]"></span>
													</div>

													<div v-else>
														{{scope.row[scope.column.property]}}
													</div>
												</template>
											</el-table-column>
										</el-table-column>
									</el-table>
								</template>
							</el-table-column>

							<el-table-column v-for="item in tableColumns" :prop="item.prop" :label="item.label"
											 :min-width="item.width"
											 :align="item.align" :sortable="item.sortable">

								<template scope="scope">
									<div
										v-if="(scope.column.property.indexOf('aqi')>-1&&scope.column.property!=='aqi_level')"
										:style="styleObject(scope.row[scope.column.property])">
										{{scope.row[scope.column.property]}}
									</div>

									<div v-else-if="scope.column.property==='primary_pollutant'">
										<span v-html="scope.row[scope.column.property]"></span>
									</div>

									<div v-else>
										{{scope.row[scope.column.property]}}
									</div>
								</template>

								<el-table-column v-if="item.children&&item.children.length>0"
												 v-for="child in item.children" :prop="child.prop" :label="child.label"
												 :min-width="child.width"
												 :align="child.align" :sortable="child.sortable">

									<template scope="scope">
										<div
											v-if="(scope.column.property.indexOf('aqi')>-1&&scope.column.property!=='aqi_level')"
											:style="styleObject(scope.row[scope.column.property])">
											{{scope.row[scope.column.property]}}
										</div>

										<div v-else-if="scope.column.property==='primary_pollutant'">
											<span v-html="scope.row[scope.column.property]"></span>
										</div>

										<div v-else>
											{{scope.row[scope.column.property]}}
										</div>
									</template>
								</el-table-column>
							</el-table-column>
						</el-table>
					</title-panel>
				</el-col>
			</el-row>
			<el-row style="margin-top: 32px" class="weather-wrapper">
				<el-col :span="24">
					<title-panel :title="weatherTitle">
						<div style="width: 100%;height: 100%">
							<el-row type="flex" class="dt-row" justify="space-around">
								<el-col :span="2">
									<img src="./assets/images/weather.png" width="70" height="70"
										 style="position: absolute;left:-3px;top:-19px" alt="">
								</el-col>
								<el-col :span="wrfData.length===10?2:3" :class="{holiday:isHoliday(item.dateStr)}"
										v-for="item in wrfData">{{item.dateStr}}
								</el-col>
							</el-row>

							<el-row type="flex" class="data-row" justify="space-around">
								<el-col :span="2">
									<weather-pane-title></weather-pane-title>
								</el-col>
								<el-col :span="wrfData.length===10?2:3" v-if="wrfData.length>0"
										v-for="(item,idx) in wrfData" :key="idx">
									<weather-pane :info="item.info"></weather-pane>
								</el-col>
							</el-row>
						</div>
					</title-panel>
				</el-col>
			</el-row>
		</div>
		<!--条件区域-->
		<right-panel :rightPanelWidth="rightPanelWidth" :toggleStatus="toggleStatus" @togglePanel="onTogglePanel">
			<!--<setting-dialog :configJson="config"></setting-dialog>-->
			<div class="condition-wrap">
				<div class="con-div">
					<span class="con-label">-产品时间-</span>
					<div class="con-body">
						<el-date-picker
							style="width:160px"
							v-model="pDate"
							type="date"
							:editable="false"
							:clearable="false"
							:picker-options="pDateOptions"
							@change="onDateChange"
							value-format="yyyy-MM-dd"
							placeholder="选择日期">
						</el-date-picker>

						<el-select style="width:90px" @change="onIntervalChange" v-model="time" placeholder="请选择">
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
						<el-radio-group @change="onRegionChange" v-model="area" v-if="area!==''">
							<el-radio-button v-for="item in areas" :key="item.value" :label="item.value">
								{{item.label}}
							</el-radio-button>
						</el-radio-group>
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

