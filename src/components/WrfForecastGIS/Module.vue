<template>
	<div class="body-wrap">
		<!--内容区域-->
		<div class="content">

            <div :class="wrfForecast_control_css">
                <div id="wrfForecast_MapDiv"></div>

                <!--左上角的tip面板-->
                <div class="titleWrap">
                    <map-title :cityName="currCityName" :title="mapTitle" :date="mapDate"></map-title>
                </div>

                <!--右上角的菜单面板-->
                <div class="fullScPanel">
                    <div class="fullScPanelBtn" v-show="!isOpenDoubleWindown" icon="el-icon-d-arrow-left" v-on:click="on_fullClick(isOpenDoubleWindown)" round><i class="el-icon-d-arrow-left"></i>&nbsp;&nbsp;对比分析</div>
                    <div class="fullScPanelBtn" v-show="isOpenDoubleWindown" icon="el-icon-d-arrow-right" v-on:click="on_fullClick(isOpenDoubleWindown)" round>全屏展开&nbsp;&nbsp;<i class="el-icon-d-arrow-right"></i></div>
                </div>

                <div class="toggleBtn">
                    <horizon-select  v-if="zoneInfo!=null" :btns="zoneInfo.options"  v-model="zoneInfo.default_zone" @change="on_domainChange"></horizon-select>
                </div>

                <div class="conditionGroup" >
                    <group-select :items="memuOptions" @change="on_Menu_Change" style="width:160px;"></group-select>
                </div>

                <div class="wrfForecast_legend">
                    <legend3clear v-for="legend in legendOption" :items="legend"></legend3clear>
                </div>
            </div>

			<div class="wrfForecast_unfull"  v-show="isOpenDoubleWindown">
                <div id="wrfForecast_Pol_MapDiv"></div>

                <!--左上角的tip面板-->
                <div class="titleWrap">
                    <map-title :cityName="currCityName" :title="p_mapTitle" :date="mapDate"></map-title>
                </div>

                 <!--右上角的菜单面板-->
                <div class="modelBtn">
                    <horizon-select  v-if="models!=null" :btns="models"  v-model="defaultModel" @change="on_modelChange"></horizon-select>
                </div>

                <div class="menuPanel">

                        <div class="pollut_Panel">
                            <group-select :items="memu_Pol_Options" @change="on_Menu_Pol_Change" style="width:160px;"></group-select>

                            <div class="model-group">
                                <el-switch  active-text="风场"
                                  v-model="isOpenWind" @change="on_openCloseWindChange" :width="40"  active-color="#13ce66" inactive-color="rgb(151, 142, 162)">
                                </el-switch>
                            </div>

                        </div>

                        
                </div>

                <div class="wrfForecast_legend">
                    <legend3clear v-for="legend in legendOption_Pol" :items="legend"></legend3clear>
                </div>
            </div>
                

		</div>

        <img width:0 height:0 src="static/mask/d01.png" ref="masking_d01" style="display:none" />
        <img width:0 height:0 src="static/mask/d02.png" ref="masking_d02" style="display:none"/>
        <img width:0 height:0 src="static/mask/d03.png" ref="masking_d03" style="display:none"/>


        <div class="wrfForecast_TimeCondition">
            <!--<div class="wrfforecast_TimeConditionLable">起报时间：</div>-->
            <!--起报时间 时间控件-->
            <el-date-picker
                            style="width:132px;float:left;margin-top:11px;"
                            @change="on_PreTime_Change"
                            v-model="preTime"
                            :picker-options="pickerOptions"
                            type="date"
                            :editable="false"
                            :clearable="false"
                            value-format="yyyy-MM-dd">
            </el-date-picker>

            <!--时次 下拉框控件-->
            <el-select style="width:72px;float:left;margin-left:1px;margin-top:11px;" placeholder="请选择" v-model="default_sc" @change="on_Sc_Change">
                <el-option
                  v-for="item in sc_options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
            </el-select>

            <!--小时、日均切换按钮-->
            <!--<el-radio-group v-model="defaultDateType" @change="on_DateType_Change" v-if="dateType.length>0" style="float:left;margin-left:5px;margin-top:11px;height:30px;">
                    <el-radio-button v-for="item in dateType" :key="item.value" :label="item.value">{{item.label}}
                    </el-radio-button>
            </el-radio-group>-->
        </div>

        <!--时间控件面板-->
        <div id="wrfForecast_TimeControl" style=""></div>
		
	</div>

    

</template>

<script>
	import moduleJs from './Module.js';
	export default moduleJs;
</script>

<style scoped>
	@import url(./assets/style/style.css);

    .body-wrap {
        color: #fff;
        width: 100%;
        height: 100%;
        font-size: 14px;
    }

    .content {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
    }

    .map-row {
        height: 100%;
    }

    .condition-wrap {

    }

     .titleWrap {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 998;
    }

    #wrfForecast_MapDiv {
        width: 100%;
        height: 100%;
    }

    .wrfForecast_TimeCondition{
        position: absolute;
        left: 0;
        width:210px;
        height:53px;
        background-color: rgba(46,46,46,0.7);
        border-right: 1px solid #8B8E8E;
        bottom: 0;
        outline: 0;
        padding: 0;
        margin: 0;
        z-index: 1000
    }

    .wrfforecast_TimeConditionLable{
        float:left;
        text-align: center;
        height: 53px;
        width:100px;
        line-height:53px;
        color: #fff;
        text-indent: 10px;
    }

    #wrfForecast_TimeControl {
        position: absolute;
        left: 210px;
        height:37px;
        right: 0;
        bottom: 0;
        border: 0;
        outline: 0;
        padding: 0;
        margin: 0;
        z-index: 1000;
    }

    .toggleBtn{
        position: absolute;
        right:154px;
        top:12px;
        z-index:999
    }

    .conditionGroup {
        position: absolute;
        right: 12px;
        top: 50px;
        z-index: 999
    }

    .wrfForecast_legend{
        position: absolute;
        bottom: 60px;
        right:12px;
        z-index: 400;
        width:auto;
        height:auto;
    }


    #wrfForecast_Pol_MapDiv{
        width:100%;
        height:100%;
    }

    .modelBtn{
        position: absolute;
        right:12px;
        top:10px;
        z-index:999
    }

    .menuPanel{
        position: absolute;
        top:50px;
        right: 12px;
        width:100px;
        z-index:400;
    }

    .pollut_Panel{
        position: absolute;
        right: 0px;
        top: 0px;
        z-index: 999;
        text-align: center;
    }

    .model-group {
        display: inline-block;
        width: 104px;
        height: 30px;
        line-height: 30px;
        background: rgba(7, 28, 66, 0.5);
        margin-left:32px; 
        border-radius: 15px;
    }

    .model-group .li-item {
        list-style: none;
        text-align: center;
        line-height: 24px;
        height: 24px;
        /*padding: 0 2px 0 2px;*/
        margin-top: 5px;
        font-size: 12px;
        cursor: pointer;
    }

    .model-group .checked {
        color: #fff;
        background-color: #029fde;
        background: -moz-linear-gradient(left, #029fde, #0264dc) !important; /*Mozilla*/
        background: -webkit-gradient(linear, 0 50%, 100% 50%, from(#029fde), to(#0264dc)) !important; /*Old gradient for webkit*/
        background: -webkit-linear-gradient(left, #029fde, #0264dc) !important; /*new gradient for Webkit*/
        background: -o-linear-gradient(left, #029fde, #0264dc) !important; /*Opera11*/
        filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#029fde', endColorstr='#0264dc', GradientType=1);
    }

    .fullScPanel{
        position: absolute;
        right: 12px;
        top: 12px;
        z-index: 1000;
    }

    .fullScPanelBtn{
        width: 130px;
        height:30px;
        line-height:30px;
        background-color: rgba(5, 19, 41, 0.8);
        color: #f4f5f7;
        margin:0px !important;
        border-radius: 20px;
        text-align: center;
        cursor: pointer;
    }

    .wrfForecast_unfull{
        position: absolute;
        top: 0px;
        right: 0px;
        height: 100%;
        width:-moz-calc(50% - 1px); 
        width:-webkit-calc(50% - 1px); 
        width: calc(50% - 1px); 
        border-left:1px solid #0b0205;
    }

    .wrfForecast_full{
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
    }

    .wrfForecast_close{
        position: absolute;
        top: 0px;
        left: 0px;
        width:50%; 
        height: 100%;
        z-index: 100;
        box-sizing: border-box;
        animation:wrfForecast_close_expand 0.8s;
        -moz-animation:wrfForecast_close_expand 0.8s; /* Firefox */
        -webkit-animation:wrfForecast_close_expand 0.8s; /* Safari and Chrome */
        -o-animation:wrfForecast_close_expand 0.8s; /* Opera */
    }
    .wrfForecast_open{
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
        padding: 0px;
        margin: 0px;
        z-index: 100;
        box-sizing: border-box;
        animation:wrfForecast_open_expand 0.8s;
        -moz-animation:wrfForecast_open_expand 0.8s; /* Firefox */
        -webkit-animation:wrfForecast_open_expand 0.8s; /* Safari and Chrome */
        -o-animation:wrfForecast_open_expand 0.8s; /* Opera */
    }

    @keyframes wrfForecast_close_expand
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
    @-moz-keyframes wrfForecast_close_expand
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
    @-webkit-keyframes wrfForecast_close_expand
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
    @-o-keyframes wrfForecast_close_expand
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


    @keyframes wrfForecast_open_expand
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

    @-moz-keyframes wrfForecast_open_expand
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

    @-webkit-keyframes wrfForecast_open_expand
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

    @-o-keyframes wrfForecast_open_expand
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
</style>

