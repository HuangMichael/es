<template>
    <div class="groupSelect">
        <div class="groupPanel">
            <ul>
                <li v-for="item in groupItems" class="item"
                    @click="focusValue=item.value" >
                    <span  :class="['itemIcon', {'iconChecked':item.value===openValue},item.icon]"></span>
                    <span
                        :class="['itemLabel', {'checked':item.value===openValue}]">{{item.label}}</span>

                    <div class="panel-wrap">
                        <div class="itemContent" v-show="isShow(item.value)" v-for="(list,idx) in item.listItem">
                            <div class="groupContent">
                                <ul>
                                    <li :class="['contentItem', {'conChecked':con.checked}]" v-for="con in list"
                                        :key="con.value"
                                        @click="onContentItemClick(item,list,con,con.type,con.value,con.checked)">
                                        <!--<span :class="con.icon" class="conIcon"></span>-->
                                        <span>{{con.label}}</span>
                                        <!--<span class="fa fa-check-circle-o checkIcon" v-show="con.checked"></span>-->
                                    </li>
                                </ul>
                            </div>
                            <div class="splitLine" v-if="idx!==item.listItem.length-1">
                            </div>
                        </div>
                    </div>

                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    export default {
        components: {},

        props: {
            items: {
                type: Array,
                require: true,
                default: function () {
                    return []
                }
            }
        },

        data() {
            return {
                groupItems: [],
                focusValue: '',
                openValue: null
            };
        },


        mounted() {

        },

        created() {
            this.groupItems = this.items;
            if (this.groupItems.length > 0)
                this._getCurrCheckInfos();
        },


        watch: {
            items() {
                this.groupItems = this.items;
                this._getCurrCheckInfos();
            }
        },

        methods: {

            _getCurrCheckInfos: function () {
                let currCheckedValues = [];

                this.groupItems.forEach(item => {
                    item.listItem.forEach(list => {
                        list.forEach(l => {
                            if (l.checked) {
                                this.openValue = item.value;
                                let obj = Object.assign({name: item.value, pName: item.label}, l);
                                currCheckedValues.push(obj)
                            }
                        })
                    })
                });

                this.$emit('change', currCheckedValues);
            },

            isShow: function (value) {
                return value === this.focusValue || this.openValue === value;
            },

            onContentItemClick: function (item, list, con, type, value, checked) {
                if (item.value === this.openValue) {
                    if (!checked)//将要选中
                    {
                        list.forEach(d => {
                            if (d.type === type) {
                                d.checked = value === d.value;
                            }
                        });
                    } else {
                        con.checked = false;
                    }
                } else {
                    this.openValue = item.value;
                    this.groupItems.forEach((obj, i) => {
                        console.log(obj);
                        obj.listItem.forEach((list, idx) => {
                            list.forEach((ls, j) => {
                                if (ls.type === type && ls.value === value)
                                    this.$set(this.groupItems[i].listItem[idx][j], 'checked', true);
                                else
                                    this.$set(this.groupItems[i].listItem[idx][j], 'checked', false);
                            });
                        })
                    });
                }


                let currCheckedValues = [];
                this.groupItems.forEach(item => {
                    item.listItem.forEach(list => {
                        list.forEach(l => {
                            if (l.checked) {
                                let obj = Object.assign({name: item.value, pName: item.label}, l);
                                currCheckedValues.push(obj)
                            }
                        })
                    })
                });

                this.$emit('change', currCheckedValues);
            }
        }
    }

</script>

<style scoped>
    @import url(./assets/style/style.css);

    .groupSelect {
        font-size: 0;

    }

    .item {
        color: #fff;
        cursor: pointer;
        margin-bottom: 6px;
    }

    .itemIcon {
        height: 30px;
        width: 30px;
        border-radius: 15px;
        background-color: rgba(0, 0, 0, 0.5);
        font-size: 14px;
        line-height: 30px;
        text-align: center;
        padding: 8px;
    }

    .itemLabel {
        text-align: center;
        font-size: 14px;
        width: 100px;
        height: 30px;
        line-height: 30px;
        background-color:rgba(0, 0, 0, 0.5);
        border-radius: 15px;
        padding: 0 14px 0 14px;
        display: inline-block;
    }



    .checked {
        background-color: #00b8ff;
        color: #fff;
    }



    .iconChecked {
        background-color: #fff;
        border:1px solid #00b8ff;
        color: #00b8ff;
    }

    .groupContent {
        padding: 6px 0 8px 0;
        border-radius: 6px;
        /*margin-top: 12px;*/
    }

    .itemContent {


    }

    .contentItem {
        list-style: none;
        padding: 6px 0 6px 8px;
        margin: 3px 0 3px 0;
    }



    .conChecked {
        color: #fff;
        background-color: #00b8ff;


    }

    .panel-wrap{
        margin-left: 32px;
        width: 128px;
        text-align: center;
        margin-top: 4px;
        border-radius: 6px;
        background-color:  rgba(0, 0, 0, 0.5);
        font-size: 13px;
        /*border:1px solid #00b8ff;*/
    }

    .conIcon {
        margin-right: 2px;
    }

    .checkIcon {
        position: absolute;
        right: 8px;
        margin-top: 3px;
        color: #fff;
    }

    .splitLine {
        height: 1px;
        background-color: #fff;
        margin: 0 3px 0 3px;
    }


    .itemLabel:hover{
        background-color: #00b8ff;
    }

    .contentItem:hover{
        background-color: #00b8ff;
    }

</style>

