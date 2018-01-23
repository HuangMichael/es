<template>
	<div class="WeatherAnalysis">
		<div :class="topContainer_Full">
			<div :class="weatherMapCSS">
				<div class="WeatherAnalysisMapTitle">
					<map-title :cityName="currCityName" :title="mapWeatherTitle" :date="mapDate"></map-title>
				</div>
				<div class="expandAndClose" v-show="!echartOpenStatus">
					<el-button class="expandAndCloseButton" v-show="winOpenStatus" icon="el-icon-d-arrow-left" v-on:click="ExpandMapClick" round>对比分析</el-button>
					<el-button class="expandAndCloseButton" v-show="!winOpenStatus" icon="el-icon-d-arrow-right" v-on:click="ExpandMapClick" round>全屏展开</el-button>
				</div>
				<div :class=" echartOpenStatus === true ?'mapLayersChoose_weather_open':'mapLayersChoose_weather'">
					<div class="LayersChoose">	
						<el-switch
						:width="38"
						active-color="#13ce66"
						inactive-color="rgb(84, 112, 162)"
						v-model="stationMapLayer"
						@change="stationMapLayerchange"
						active-text="站点图">
						</el-switch>					
					</div>
					<div class="LayersChoose"> 
						<el-switch
						:width="38"
						active-color="#13ce66"
						inactive-color="rgb(84, 112, 162)"
						v-model="DistrMapLayer"
						@change="DistrMapLayerchange"
						active-text="分布图">
						</el-switch>						
					</div>
				</div>
				<div class="weatherCondition" v-if="Wea_options.length !== 0">
                  	<group-select :items="Wea_options" @change="weaTarget_changeClick" style="width:160px;"></group-select>
				</div>
				<div id="WeatherAnalysis_weatherMap"></div>
				<div class="mapLenged" v-show="(isSLPShow || stationMapLayer)"><legend3clear v-if="weaLegendeOption" :items="weaLegendeOption"></legend3clear></div>
			</div>  
			<div class="MapContainer_pollutionMap" v-show="(!winOpenStatus)&&(!echartOpenStatus)">
				<div class="WeatherAnalysisMapTitle">
					<map-title :cityName="currCityName" :title="mapPolluTitle" :date="mapDate"></map-title>
				</div>
				<div class="mapLayersChoose_polution">
					<div class="LayersChoose">	
						<el-switch
						:width="38"
						active-color="#13ce66"
						inactive-color="rgb(84, 112, 162)"						
						v-model="pollu_stationMapLayer"
						@change="pollu_stationMapLayerchange"
						active-text="站点图">
						</el-switch>					
					</div>
					<div class="LayersChoose"> 
						<el-switch
						:width="38"
						active-color="#13ce66"
						inactive-color="rgb(84, 112, 162)"						
						v-model="pollu_DistrMapLayer"
						@change="pollu_DistrMapLayerchange"
						active-text="分布图">
						</el-switch>						
					</div>
				</div>
				<div class="pollutionCondition" v-if="pollutionOption.length !== 0">
					<group-select style="width:160px;" :items="pollutionOption" @change="pollutTarget_changeClick"></group-select>
				</div>
				<div id="WeatherAnalysis_pollutionMap"></div>
				<div class="mapLenged" v-show="pollu_DistrMapLayer"><legend3clear v-if="polluLegendeOption" :items="polluLegendeOption"></legend3clear></div>
			</div>
			<div class="MapContainer_EchartForMap" id="WeatherAnalysis_markercharts" v-show="echartOpenStatus">
				<div class="MapContainer_Echart_close">
					<el-button size="medium" class="MapContainer_Echart_close_button" v-on:click="CloseEcharts"><i class="el-icon-close"></i></el-button>
				</div>
				<div class="MapContainer_Echart_Title">{{currtStationName}}</div>
				<div class="MapContainer_Echart_Container">
					<div v-for="chartId in mrak_echarts" :id="chartsDivId + chartId" :class="chartId==='Windy'?'weatherConditionFirst_echarts':'weatherCondition_echarts'">
					</div>
				</div>
			</div>
		</div>
		<div class="bottomContainer" v-show="timesliderShow">
			<div id="WeatherAnalysis_timeControl"></div>
		</div>
		<img src="static/mask/js.png" ref="jsMask" style="display:none"/>
		<img src="static/mask/js.png" ref="jspolluMask" style="display:none"/>
	</div>
</template>

<script>
	import moduleJs from './Module.js';

	export default moduleJs;
</script>

<style scoped>
	@import url(./assets/style/style.css);
	.WeatherAnalysis {
		position: relative;
		width: 100%;
		height: 100%;
	}
	.WeatherAnalysis .topContainer{
		position: relative;
		width: 100%;
        height:-moz-calc(100% - 50px); 
        height:-webkit-calc(100% - 50px); 
        height: calc(100% - 50px); 
        overflow-y: auto;
	}
	.WeatherAnalysis .topContainer_Full{
		position: relative;
		width: 100%;
        height: 100%;
        overflow-y: auto;
	}
	.WeatherAnalysis .bottomContainer{
		position: relative;
		width: 100%;
		height: 50px;
	}
	.WeatherAnalysis #WeatherAnalysis_timeControl{
		position: absolute;
		width: 100%;
		height: 100%;
	}
	/*双视窗口的展开和关闭*/
	@keyframes mapexpand
	{
	    from {
	        width:50%;
	        height:100%;
	    }
	    to {
	        width:100%; 
	        height:100%;
	    }
	}

	@-moz-keyframes mapexpand
	{
	    from {
	        width:50%;
	        height:100%;
	    }
	    to {
	        width:100%; 
	        height:100%;
	    }
	}

	@-webkit-keyframes mapexpand
	{
	    from {
	        width:50%;
	        height:100%;
	    }
	    to {
	        width:100%; 
	        height:100%;
	    }
	}

	@-o-keyframes mapexpand
	{
	    from {
	        width:50%;
	        height:100%;
	    }
	    to {
	        width:100%; 
	        height:100%;
	    }
	}
	@keyframes mapcloseExpand
	{
	    from {
	        width:100%; 
	        height:100%;
	    }
	    to {
	        width:50%;
	        height:100%;
	    }
	}
	@-moz-keyframes mapcloseExpand
	{
	    from {
	        width:100%; 
	        height:100%;
	    }
	    to {
	        width:50%;
	        height:100%;
	    }
	}
	@-webkit-keyframes mapcloseExpand
	{
	    from {
	        width:100%; 
	        height:100%;
	    }
	    to {
	        width:50%;
	        height:100%;
	    }
	}
	@-o-keyframes mapcloseExpand
	{
	    from {
	        width:100%; 
	        height:100%;
	    }
	    to {
	        width:50%;
	        height:100%;
	    }
	}

	/*半屏的时候echarts窗口的展开*/
	@keyframes expandCharts
	{
	    from {
	        width:50%;
	        height:100%;
	    }
	    to {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	}

	@-moz-keyframes expandCharts
	{
	    from {
	        width:50%;
	        height:100%;
	    }
	    to {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	}

	@-webkit-keyframes expandCharts
	{
	    from {
	        width:50%;
	        height:100%;
	    }
	    to {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	}

	@-o-keyframes expandCharts
	{
	    from {
	        width:50%;
	        height:100%;
	    }
	    to {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	}
	/*全屏的时候echarts窗口的展开*/
	@keyframes expandChartsFull
	{
	    from {
	        width:100%;
	        height:100%;
	    }
	    to {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	}

	@-moz-keyframes expandChartsFull
	{
	    from {
	        width:100%;
	        height:100%;
	    }
	    to {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	}

	@-webkit-keyframes expandChartsFull
	{
	    from {
	        width:100%;
	        height:100%;
	    }
	    to {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	}

	@-o-keyframes expandChartsFull
	{
	    from {
	        width:100%;
	        height:100%;
	    }
	    to {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	}
	/*echarts窗口的关闭*/
	@keyframes closeExpandCharts
	{
	    from {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	    to {
	        width:100%;
	        height:100%;
	    }
	}

	@-moz-keyframes closeExpandCharts
	{
	    from {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	    to {
	        width:100%;
	        height:100%;
	    }
	}

	@-webkit-keyframes closeExpandCharts
	{
	    from {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	    to {
	        width:100%;
	        height:100%;
	    }
	}

	@-o-keyframes closeExpandCharts
	{
	    from {
	        width:-moz-calc(100% - 760px); 
	        width:-webkit-calc(100% - 760px); 
	        width: calc(100% - 760px); 
	        height:100%;
	    }
	    to {
	        width:100%;
	        height:100%;
	    }
	}
	.WeatherAnalysis .MapContainer_weatherMap{
    	position: absolute;
    	top: 0px;
    	left: 0px;
	    width:-moz-calc(100% - 760px); 
	    width:-webkit-calc(100% - 760px); 
	    width: calc(100% - 760px); 
		height: 100%;
		padding: 0px;
		margin: 0px;
	    border-right: solid 1px #0b0205;
	    box-sizing: border-box;
	}
	.WeatherAnalysis .MapContainer_weatherMap_close{
    	position: absolute;
    	top: 0px;
    	left: 0px;
		width: 50%;
		height: 100%;
		padding: 0px;
		margin: 0px;
		z-index: 100;
	    border-right: solid 1px #0b0205;
	    box-sizing: border-box;
	    animation:mapcloseExpand 0.8s;
	    -moz-animation:mapcloseExpand 0.8s; /* Firefox */
	    -webkit-animation:mapcloseExpand 0.8s; /* Safari and Chrome */
	    -o-animation:mapcloseExpand 0.8s; /* Opera */
	}
	.WeatherAnalysis .MapContainer_weatherMap_open{
    	position: absolute;
    	top: 0px;
    	left: 0px;
		width: 100%;
		height: 100%;
		padding: 0px;
		margin: 0px;
		z-index: 100;
	    border-right: solid 1px #0b0205;
	    box-sizing: border-box;
	    animation:mapexpand 0.8s;
	    -moz-animation:mapexpand 0.8s; /* Firefox */
	    -webkit-animation:mapexpand 0.8s; /* Safari and Chrome */
	    -o-animation:mapexpand 0.8s; /* Opera */
	}
	.WeatherAnalysis .MapContainer_weatherEcharts_close{
    	position: absolute;
    	top: 0px;
    	left: 0px;
		width: 100%;
		height: 100%;
		padding: 0px;
		margin: 0px;
		z-index: 100;
	    border-right: solid 1px #0b0205;
	    box-sizing: border-box;
	    animation: closeExpandCharts 0.5s;
	    -moz-animation: closeExpandCharts 0.5s; /* Firefox */
	    -webkit-animation: closeExpandCharts 0.5s; /* Safari and Chrome */
	    -o-animation: closeExpandCharts 0.5s; /* Opera */
	}
	.WeatherAnalysis .MapContainer_weatherEcharts_open{
    	position: absolute;
    	top: 0px;
    	left: 0px;
	    width:-moz-calc(100% - 760px); 
	    width:-webkit-calc(100% - 760px); 
	    width: calc(100% - 760px); 
		height: 100%;
		padding: 0px;
		margin: 0px;
		z-index: 100;
	    border-right: solid 1px #0b0205;
	    box-sizing: border-box;
	    animation: expandCharts 0.5s;
	    -moz-animation: expandCharts 0.5s; /* Firefox */
	    -webkit-animation: expandCharts 0.5s; /* Safari and Chrome */
	    -o-animation: expandCharts 0.5s; /* Opera */
	}
	.WeatherAnalysis .MapContainer_weatherEcharts_openFull{
    	position: absolute;
    	top: 0px;
    	left: 0px;
	    width:-moz-calc(100% - 760px); 
	    width:-webkit-calc(100% - 760px); 
	    width: calc(100% - 760px); 
		height: 100%;
		padding: 0px;
		margin: 0px;
		z-index: 100;
	    border-right: solid 1px #0b0205;
	    box-sizing: border-box;
	    animation: expandChartsFull 0.5s;
	    -moz-animation: expandChartsFull 0.5s; /* Firefox */
	    -webkit-animation: expandChartsFull 0.5s; /* Safari and Chrome */
	    -o-animation: expandChartsFull 0.5s; /* Opera */
	}
	.WeatherAnalysis .MapContainer_pollutionMap{
    	position: absolute;
    	top: 0px;
    	right:0px;
		width: 50%;
		height: 100%;
		padding: 0px;
		margin: 0px;
		z-index: 10;
	    border-left: solid 1px #0b0205;
	    box-sizing: border-box;
	}
	.WeatherAnalysis .MapContainer_EchartForMap{
    	position: absolute;
    	top: 0px;
    	right:0px;
    	z-index: 10;
		width: 760px;
		height: 100%;
		background-color: #072655;
		padding:5px 5px;
	    border-left: solid 1px #0b0205;
	    overflow-y: auto;
	    box-sizing: border-box;
	}
	.WeatherAnalysis .MapContainer_Echart_Container{
	    top: 40px;
	    width: 100%;
	    padding-top: 40px;
	}
	.WeatherAnalysis .weatherCondition_echarts{
		position: relative;
		width: 750px;
		height: 200px;
		min-height: 200px;
	}
	.WeatherAnalysis .weatherConditionFirst_echarts{
		position: relative;
		width: 750px;
		height: 250px;
		min-height: 250px;		
	}
	.WeatherAnalysis .MapContainer_Echart_close{
	    position: absolute;
	    top: 0px;
	    left: 0px;
		z-index: 1000;
	}
	.WeatherAnalysis .MapContainer_Echart_close_button{
		margin: 0px;
	    padding: 0px;
	    font-size: 30px;
	    font-weight: bold;
	    border: none;
	    color: #0292de;
		background: rgba(255,255,255,0);
	}
	.WeatherAnalysis .MapContainer_Echart_close_button:hover{
		margin: 0px;
	    padding: 0px;
	    font-size: 32px;
	    font-weight: bold;
	    border: none;
	    color: #fff;
		background: rgba(255,255,255,0);		
	}
	.WeatherAnalysis .MapContainer_Echart_Title{
		position: absolute;
		top: 0px;
    	width: 730px;
		text-align: left;
		padding-left: 40px;		
	    color: #fff;
	    font-size: 14px;
	    font-weight: bold;
		height: 42px;
		line-height: 42px;
		z-index: 100;
	}
	.WeatherAnalysis .mapLenged{
	    position: absolute;
	    right: 12px;
	    bottom: 12px;
	    z-index: 1000;
	}
	.WeatherAnalysis .mapLayersChoose_weather{
    	position: absolute;
	    top: 12px;
	    right: 142px;
		z-index: 1000;
	}
	.WeatherAnalysis .mapLayersChoose_weather_open{
    	position: absolute;
    	right: 0px;
	    top: 12px;
		z-index: 1000;
	}
	.WeatherAnalysis .mapLayersChoose_polution{
    	position: absolute;
	    top: 12px;
	    right: 171px;
		z-index: 1000;	
	}
	.WeatherAnalysis .LayersChoose{
		position: relative;
		display: inline-block;
		width: 104px;
		height: 30px;
		line-height: 30px;
		background: #0a74de;
		border-radius: 15px;
		margin-right: 12px;
	}
	.WeatherAnalysis .weatherCondition{
		position: absolute;
		top: 54px;
		right: 12px;
		z-index: 1000;
	}
	.WeatherAnalysis .pollutionCondition{
		position: absolute;
		top: 12px;
		right: 12px;
		z-index: 999;
	}
	.WeatherAnalysis .WeatherAnalysisMapTitle{
		position: absolute;
        top: 12px;
        left: 12px;
		z-index: 1000;
	}
	.WeatherAnalysis .expandAndClose{
		position: absolute;
		right: 12px;
		top: 12px;
		z-index: 1000;
	}
	.WeatherAnalysis .expandAndCloseButton{
	    width: 128px;
        padding-top: 8px;
	    border: 1px solid rgb(255, 255, 255);
	    background-color: rgba(255, 255, 255, 0);
	    color: #fff;
	    font-size: 14px;
	    box-sizing: border-box;
	    height: 30px;
	}
	.WeatherAnalysis .expandAndCloseButton:hover
	{ 
	    width: 128px;
	    border: 1px solid rgb(11, 108, 204);
	    box-sizing: border-box;
	    height: 30px;
	    color: #f4f5f7;
	    font-size: 14px;
		background: rgb(10, 116, 222);
	}
	.WeatherAnalysis #WeatherAnalysis_weatherMap{
	    position: absolute;
	    top: 0px;
	    left: 0px;
		width: 100%;
		height: 100%;
		background-size:100% 100%;
		background-position: center;
		background-image: url('./assets/images/background.png');
	}
	.WeatherAnalysis #WeatherAnalysis_pollutionMap{
		position: relative;
		width: 100%;
		height: 100%;
		background-size:100% 100%;
		background-position: center;
		background-image: url('./assets/images/background.png');
	}
</style>

