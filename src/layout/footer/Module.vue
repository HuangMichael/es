<template>
	<div class="footer" :style="{'height':footerHt+'px','line-height':footerHt+'px'}">技术支持：中科院大气物理研究所&nbsp;&nbsp;&nbsp;中科三清科技有限公司</div>
</template>

<script>
    import moduleJs from './Module.js';
    export default moduleJs;
</script>

<style scoped>
	.footer{
		width: 100%;
		text-align: center;
		font-size: 14px;
		color: #fff;
		background-color: #0a1c34;
		position: fixed;
		z-index: 1001;
		bottom:0;
	}
</style>

