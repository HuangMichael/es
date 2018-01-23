<template>
           
    <div class="legendPanel">
        <div class="legendUnite" :style="getFontColor()">{{legend.unite}}</div>
        <div class="legendPaneContent" :style="getWdith()">
            <div class="legendItemLabelArray"  :title="legend.name">
                <template v-if="legendTemp.length>0" v-for="(item,index) in legendTemp">
                    <div :style="getlabeWidth(index)" class="legendLabel">
                        <span ref="_lengendLabel">{{getLegendLabels(item.lablename)}}</span>
                    </div>
                </template>

            </div>

            <div class="legendItemArray" :title="legend.name">
                <template v-if="legendTemp.length>0" v-for="(item2,index) in legendTemp">
                    <div v-if="index!=0" class="legendItem" :style="getStyle(item2.colorlevel,index)">{{getLegendContent(index)}}</div>
                </template>
                    <div style="float:left;height:20px;width:10px"></div>
            </div>
        </div>
        <div class="legendName" :style="getHeight()"  v-html="handlePolName(legend.name)"></div>
    </div>

</template>

<script>
    import {utils} from "utils/utils";
    export default {
        components: {},

        props: {
            items: {
                type: Object,
                require: true,
                default: function () {
                    return {}
                }
            }
        },

        data() {
            return {
                
                type:"label",

                legendTemp:[],

                legend:{
                    step:5,
                    class:[],
                    unite:"",
                    name:"",
                    width:420,
                    height:20,
                    _w:0,
                    color:[],
                    fontcolor:"",
                    labels:[]
                }
                
            }
        },

        created() {
            let that = this;

            that.legend = that.items;
            that.legendTemp = [];
            that.convertData();
        },

        mounted() {
            let that = this;

                that.$nextTick(() => {
                let doms = that.$refs._lengendLabel;
                if(doms){
                    for(let i=0;i<doms.length;i++){
                       let dom = doms[i];
                       let offset = dom.offsetWidth/2;
                       dom.style.marginLeft = - parseInt(offset)+"px";
                    }
                }
            });
        },

        watch:{
            items(){
                this.legend = this.items;
                this.convertData();
            }
        },

        methods: {
            handlePolName(name) {
                return utils.addSubToLabel(name)
            },

            getWdith(){
                let that = this;
                return {
                    "width":(that.legend.width)+"px",
                }
            },

            getlabeWidth(index){
                let that = this;
                if(that.legendTemp){
                    if(that.legendTemp.length>=1&&index==(that.legendTemp.length-1)){
                        return {"width":"12px","color":that.legend.fontcolor}
                    }if(that.legendTemp.length>=2&&index==(that.legendTemp.length-2)){
                            return {"width":(that.legend._w)+"px","color":that.legend.fontcolor}
                    }else{
                            return {"width":(that.legend._w)+"px","color":that.legend.fontcolor}
                    }
                }
            },

            getHeight(){
                let that = this;
                return {
                    "height":(that.legend.height)+"px",
                    "line-height":(that.legend.height)+"px",
                    "color":that.legend.fontcolor,
                    "margin-right":-(that.legend._w-20)+"px"
                }
            },

            getFontColor(){
                let that = this;
                return {
                    "color":that.legend.fontcolor
                }
            },

            getLegendLabels(value){
                let that = this;
                if(that.type=="content"){
                    return "";
                }else{
                    return value;
                }
            },

            getLegendContent(index){
                let that = this;
                if(that.type=="content"){
                    return that.legend.labels[index-1];
                }else{
                    return "";
                }
            },

            getStyle(item,index){
                let that = this;
                if(item){
                    if(item!=undefined&& item.charAt(item.length-1)==","){
                        item = item.substr(0,(item.length - 1));
                    }
                    if(index==1){
                        return {
                            "background":'repeating-linear-gradient(to right,'+item+')',
                            "width":that.legend._w+"px",
                            "height":that.legend.height+"px",
                            "line-height":that.legend.height+"px",
                            "border":"1px solid "+that.legend.fontcolor,
                            "border-right":"none",
                            "color":that.legend.fontcolor
                        }
                    }else if(index==(that.legendTemp.length-1)){
                        return {
                            "background":'repeating-linear-gradient(to right,'+item+')',
                            "width":that.legend._w+"px",
                            "height":that.legend.height+"px",
                            "line-height":that.legend.height+"px",
                            "border":"1px solid "+that.legend.fontcolor,
                            "border-left":"none",
                            "color":that.legend.fontcolor
                        }
                    }else{
                        return {
                            "background":'repeating-linear-gradient(to right,'+item+')',
                            "width":that.legend._w+"px",
                            "height":that.legend.height+"px",
                            "line-height":that.legend.height+"px",
                            "border-top":"1px solid "+that.legend.fontcolor,
                            "border-bottom":"1px solid "+that.legend.fontcolor,
                            "color":that.legend.fontcolor
                        }
                    }
                }
                
            },

            convertData(){
                let that = this;

                that.legend.width = that.legend.width||420;
                that.legend.height = that.legend.height||20;
                that.legend.unite = that.legend.unite||"";
                that.legend.name = that.legend.name||"";
                that.legend.fontcolor = that.legend.fontcolor||"#000"
                //that.legend.labels = that.legend.labels||[];
                if(!that.legend.labels){
                    that.legend.labels=[];
                }
                if(that.legend.labels.length>0){
                    that.type="content";
                }else{
                    that.type="label";
                }


                that.legend._w = that.legend.width/(that.legend.class.length);

                that.legendTemp = [];

                let obj = {};

                if(that.legend.class.length>0){
                        obj = {};
                        obj.lablename = that.legend.class[0];
                        //obj.colorlevel = splice [that.legend.color[0],that.legend.color[1],that.legend.color[2],that.legend.color[3]/255];
                        obj.colorlevel="";
                        obj.colorcount=0;
                        that.legendTemp.push(obj);
                }
                for (let i = 1; i < that.legend.class.length; i++) {
                
                    let num = Math.abs(Math.abs(Number(that.legend.class[i]))*1000-Math.abs(Number(that.legend.class[i-1]))*1000)/Number(that.legend.step*1000);
                    if(num){
                        let newNumber = Number(num*4);

                        obj = {};
                        obj.lablename = that.legend.class[i];
                        obj.colorlevel="";

                        if(newNumber==4){
                            let count = that.legendTemp[i-1].colorcount;
                            //把背景颜色为透明全部替换为白色
                            if(that.legend.color[count+3]/255==0){
                                 obj.colorlevel = 
                                  obj.colorlevel+
                                  "rgba(255,255,255,1),rgba(255,255,255,1),";
                            }else{
                                if((count+4)<=that.legend.color.length){
                                    obj.colorlevel = 
                                      obj.colorlevel+
                                      "rgba("+that.legend.color[count]+","+that.legend.color[count+1]+","+that.legend.color[count+2]+","+that.legend.color[count+3]/255+"),"+"rgba("+that.legend.color[count]+","+that.legend.color[count+1]+","+that.legend.color[count+2]+","+that.legend.color[count+3]/255+"),";
                                }
                            }
                        }else{
                            if((newNumber+that.legendTemp[i-1].colorcount)<=that.legend.color.length){
                                for(let j=that.legendTemp[i-1].colorcount;j<newNumber+that.legendTemp[i-1].colorcount;j = j+4){
                                        if(that.legend.color[j+3]/255==0){
                                            obj.colorlevel = obj.colorlevel+"rgba(255,255,255,1),";
                                        }else{
                                            obj.colorlevel = obj.colorlevel+"rgba("+that.legend.color[j]+","+that.legend.color[j+1]+","+that.legend.color[j+2]+","+that.legend.color[j+3]/255+"),";
                                        }
                                    }
                                }
                        }
                        that.legendTemp.push(obj);
                        obj.colorcount = that.legendTemp[i-1].colorcount+newNumber;
                    }
                }
            }

        },

        updated(){
            let that = this;

            let doms = that.$refs._lengendLabel;
            if(doms){
               for(let i=0;i<doms.length;i++){
                   let dom = doms[i];
                   let offset = dom.offsetWidth/2;
                   dom.style.marginLeft = - parseInt(offset)+"px";
                } 
            }
        },
    }

</script>

<style scoped>
    @import url(./assets/style/style.css);

    .legendPanel{
        width:auto;
        height:auto;
        font-size: 12px !important;
        text-shadow:#fff 1px 0 0,#fff 0 1px 0,#fff -1px 0 0,#fff 0 -1px 0;
    }

    .legendPaneContent{
        float:right;
    }

    .legendName{
        width:auto;
        font-weight:bold;
        text-align: left;
        float:right;
        margin-top:15px!important;
        margin-right:5px;
    }

    .legendItemLabelArray{
        widht:100%;
        float:right;
    }

    .legendItemArray{
        widht:100%;
        float:right;
    }

    .legendItem{
        float:left;
        text-align: center;
        text-indent: 3px;
        font-weight: bold;
    }

    .legendLabel{
        float:left;
        height:15px;
        line-height:15px;
        font-weight: bold;
    }

    .legendUnite{
        float:right;
        font-weight: bold;
        width:auto;
        position: relative;
        top:15px;
    }

</style>

