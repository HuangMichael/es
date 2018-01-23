<template>
    <div class="vTable" :value="value">
        <div v-for="(tab,idx) in tabs" :key="tab.value" :style="{'z-index':(10-idx) }" @click="handleClick(tab.value)"
             :class="['tabItem', {'selected':tab.value===currCheckedValue}]">
            {{tab.label}}
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            tabs: {
                type: Array,
                required: true,
                default: function () {
                    return [
                    ]
                }
            },
            value: {
                type: String
            },
        },

        data() {
            return {
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
            }
        },

        methods: {
            handleClick(newValue) {
                let oldValue = this.currCheckedValue;
                this.currCheckedValue = newValue;
                this.$emit('input', newValue);
                this.$emit('change', {oldValue,newValue});
            },
        }
    }
</script>

<style scoped lang="css">
    .vTable {
        font-size: 0;
        color: #04e7e1;
    }

    .tabItem {
        height: 117px;
        width: 32px;
        background: url("assets/images/NonSelected.png") no-repeat;
        margin-bottom: -32px;
        text-transform: uppercase;
        writing-mode: tb-rl;
        vertical-align: top;
        line-height: 32px;
        text-align: center;
        word-wrap: break-word;
        overflow: hidden;
        outline: 0;
        cursor: pointer;
        position: relative;
        font-size: 14px;
    }

    .tabItem.selected {
        color: #fff !important;
        z-index: 99;
        background: url("assets/images/Selected.png") no-repeat;
    }

    .tabItem:hover{
        color:#fff;
    }

</style>

