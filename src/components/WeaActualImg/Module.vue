<template>
	<div class="body-wrap WrfActual">
		<!--内容区域-->
		<div class="content" :style="{'right':rightPanelWidth+'px'}">

			<el-row style="height: 100%;">
				<el-col :san="24" style="height: 100%;">
					<div class="imgContent">
					
						<div class="top" @click="selectClick">
							<i class="fa fa-map-marker" aria-hidden="true" style="float: left;line-height: 40px;margin-left: 20px;font-size: 16px;"></i>
							<el-breadcrumb  v-if="breadcrumbArr.length>0" separator-class="el-icon-arrow-right" style="line-height: 40px;float: left;margin-left: 10px;color: #fff;font-size: 16px;">
								
							  <el-breadcrumb-item  v-for="item in breadcrumbArr" >{{item.label}}</el-breadcrumb-item>

							</el-breadcrumb>
							<el-button  type="text" class="selectBtn">选项&nbsp;&nbsp;&nbsp;<i v-show="isUpExpandShow" class="fa fa-chevron-up iconTranistion" aria-hidden="true"></i><i v-show="!isUpExpandShow" class="fa fa-chevron-down iconTranistion" aria-hidden="true"></i></el-button>
						</div>
						 <transition name="el-zoom-in-top">
						<div  class="selectExpand" v-show="isUpExpandShow" >
							<div v-for='item in selecteArr' class="expandDiv">
								<span style="color: #fff;width: 60px;text-align: right;">{{item.cName}}</span>
								<div class="btnGroup">
								<el-radio-group v-model="item.default" v-if="source!=''" @change="setImgObj">
							      <el-radio-button v-for="x in item.data" :label="x.value" :key="x.value" >{{x.label}}</el-radio-button>
							    </el-radio-group>
							    </div>
							</div>
							
						</div>
						</transition>
					
						<div class="imgDiv" id="imgDiv" @click="checklImgCloseExpand">
							
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
					<span class="con-label">-开始时间-</span>
					<div class="con-body">
						<el-date-picker
							style="width:160px"
							v-model="sDate"
							type="date"
							placeholder="选择日期"
							@change="setImgObj"
							:clearable="false"
							default-value="2010-10-01">
						</el-date-picker>

					</div>
				</div>
				<div class="con-div">
					<span class="con-label">-结束时间-</span>
					<div class="con-body">
						<el-date-picker
							style="width:160px"
							v-model="eDate"
							type="date"
							@change="setImgObj"
							placeholder="选择日期"
							:clearable="false"
							default-value="2010-10-01">
						</el-date-picker>

					</div>
				</div>


				<div class="con-div">
					<span class="con-label">-区域选择-</span>
					<div class="con-body tabBtnStyle">
						<el-tabs type="border-card" @tab-click="handleClick" v-model="tabIndexName" >
						    <el-tab-pane label="来源" name="first">
						  		 <el-radio-group v-model="source" v-if="source!=''"  @change="setImgObj" >
							      <el-radio v-for="item in sources" :label="item.value" :key="item.value" border  class="sourceBtn">
							      	<div :class="item.iconName"></div>
							      	<span class="btnText">{{item.label}}</span>
							      	</el-radio>
							    </el-radio-group>
							    
						  </el-tab-pane>
						  <el-tab-pane label="要素" name="second">
						  		 <el-radio-group v-model="basic" @change="setImgObj" v-if="basics.length>0"> 
							      <el-radio v-for="item in basics" :label="item.value" :key="item.value" border  class="sourceBtn">
							      	<div :class="item.iconName"></div>
							      	<span class="btnText">{{item.label}}</span></el-radio>
							    </el-radio-group>
							    
						  </el-tab-pane>
						  <!--<el-tab-pane label="要素"  name="second" style="height: 200px;">
						  	<el-radio-group v-model="basic" v-if="basic!=''">
							      <el-radio v-for="item in basics" :label="item.value"  >{{item.label}}</el-radio>
							 </el-radio-group>
						  </el-tab-pane>-->
						 
						</el-tabs>
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
		margin: 0px;
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
	.imgContent{
		width: calc(100% - 3px);
		height:calc(100% - 6px);	
		
		margin-top: 3px;
	}
		.sourceBtn{
		height: 34px;
		line-height: 32px;
		margin-top: 12px;
		width: 180px;
	}
	.top{
		height:40px;
		background-color: #083E6B;
		line-height: 40px;
		border-bottom:1px solid #04e7e1 ;
		
	}
	.imgDiv{
		
		height: calc(100% - 42px);
		
		z-index: 1;
		position: relative;
	}
	.selectExpand{
		width: calc(100% - 3px);
		padding-top: 12px;
		padding-bottom: 12px;
		background-color: #083E6B;
		z-index: 2;
		position: absolute;

		
	}
	.selectBtn{
		color: #fff;
		position: absolute;
		right: 30px;
		margin-top: 5px;
	}
	.iconTranistion{
		color: #04E7E1;
		
	}
	.expandDiv{
		width: 95%;
		padding-left: 2.5%;
		padding-right: 2.5%;
		min-height: 40px;
		line-height: 40px;
		
	}
	.expandDiv span{
		float: left;
		
	}
	.btnGroup{
		float: left;
		width: calc(100% - 100px);
		margin-left: 12px;
	}
	/*单站*/
	.oneStation{
		background:url(assets/images/单站.png) no-repeat;
	}
	/*中国气象台*/
	.cnStation{
		background: url(assets/images/中央气象台.png);
	}
	/*欧洲中心*/
	.euStation{
		background: url(assets/images/欧洲中心.png);
	}
	/*韩国气象台*/
	.koStation{
		background: url(assets/images/韩国气象台.png);
	}
	/*日本气象台*/
	.jaStation{
		background: url(assets/images/日本气象台.png);
	}
	/*美国NCEP*/
	.usStation{
		
		background: url(assets/images/美国NCEP.png);
	}
	/*香港天文台*/
	.hkStation{
		background: url(assets/images/香港.png);
	}
	/*台湾省气象局*/
	.twStation{
		background: url(assets/images/台湾.png);
	}
	/*英国天气在线*/
	.ukStation{
		background: url(assets/images/英国天气在线.png);
	}
	/*TEMIS*/
	.temisStation{
		background: url(assets/images/temis.png);
	}
	/*Tropical tidbits*/
	.ttStation{
		background: url(assets/images/tropical.png);
	}
	/*风*/
	.windBtnIcon{
		background: url(assets/images/wind-.png);
	}
	/*温度*/
	.temBtnIcon{
		background: url(assets/images/temperature.png);
	}
	/*湿度*/
	.humBtnIcon{
		background: url(assets/images/humidity-.png);
	}
	/*气压*/
	.pressBtnIcon{
		background: url(assets/images/pressure.png);
	}
	/*降水*/
	.rainBtnIcon{
		background: url(assets/images/rain.png);
	}
	/*涡度*/
	.vortBtnIcon{
		background: url(assets/images/涡度.png);
	}
	/*环境气象*/
	.enweaBtnIcon{
		background: url(assets/images/环境气象.png);
	}
	/*其他*/
	.othBtnIcon{
		background: url(assets/images/Other-.png);
	}
	.nasaStation{
		background: url(assets/images/nasa.png);
	}
	.weixingBtnICon{
		background: url(assets/images/卫星.png);
	}
	.weaStation{
		background: url(assets/images/天气分析.png);
	}
	.leidaBtnICon{
		background: url(assets/images/雷达.png);
	}
</style>

