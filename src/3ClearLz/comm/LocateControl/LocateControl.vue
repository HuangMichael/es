<template>
    <div class="locateControl" :value="value" @mouseover="show=true" @mouseout="show=false">
        <div class="locations" v-show="show">
            <ul>
                <li v-for="(bt,idx) in locations.locate" :class="['li-item', {'checked':bt.label===currCheckedValue}]"
                    @click="handleClick(bt)">
                    {{bt.label}}
                </li>
            </ul>
        </div>

        <div class="locateBtn">
            <div class="titleLabel">
                <i :class="['fa', {'fa-angle-left':!show,'fa-angle-right':show },'arrow']"></i>{{locations.label}}
            </div>
        </div>


    </div>
</template>

<script>

    import {utils} from "utils/utils";

    export default {
        components: {},

        props: {
            locations: {
                type: Object,
                require: true
            },

            value: {},
        },

        data() {
            return {
                show: false,
                currCheckedValue: this.value
            };
        },


        mounted() {
            if (this.value) {
                this.currCheckedValue = this.value;
            }
        },

        watch: {
            value(val) {
                this.currCheckedValue = val;
            },


            currCheckedValue(val) {
                this.$emit('input', val);
                let currExtent = this.locations.locate.filter(locate => {
                    return locate.label === val;
                });
                if (currExtent.length > 0)
                    this.$emit('change', currExtent[0].value);
            }
        },

        methods: {
            handleClick(newValue) {
                this.currCheckedValue = newValue.label;
            }
        }
    }
</script>

<style scoped>
    @import url(./assets/style/style.css);

    .locateControl {
        font-size: 0;
        color: #04e7e1;
    }

    .locateBtn {
        display: inline-block;
        color: #fff;
        font-size: 14px;
        background-color: rgba(7, 30, 73,1);

        padding: 8px 12px 8px 12px;
        cursor: pointer;
    }

    .locations {

        font-size: 14px;
        display: inline-block;
        background-color: rgba(9, 29, 68, 0.78);
        padding: 8px 0 8px 0;
    }

    .arrow {
        margin-right: 5px;
    }

    .titleLabel {
        color: #fff;
        font-size: 14px;
        text-align: center;
    }

    .locations .li-item {
        display: inline-block;
        list-style: none;
        text-align: center;
        padding: 0 8px 0 8px;
        border-right: 1px solid #fff;
        cursor: pointer;
    }

    .locations:last-child {
        border-right: none;
    }

    .locations .checked {
        color: #fff;
    }

    .locations .li-item:hover{
        color: #fff;
    }


</style>

