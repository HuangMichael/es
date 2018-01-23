<template>
	<div class="titlePanel">
		<div class="titlePanel-title">
			<div class="left-corner"></div>
			<div class="title">{{title}}</div>
			<div class="right-corner"></div>
		</div>
		<span class="corner left-top"></span>
		<span class="corner right-top"></span>
		<span class="corner left-bottom"></span>
		<span class="corner right-bottom"></span>
		<div class="titlePanel-body">
			<slot>
			</slot>
		</div>

	</div>
</template>

<script>
	export default {
		components: {},

		props: {
			title: {
				type: String,
				default: ''
			}
		},

		data() {
			return {}
		},

		mounted() {
		},

		methods: {}
	}
</script>

<style scoped>
	@import url(./assets/style/style.css);

	.titlePanel {
		border: 2px solid #265678;
		min-height: 50px;
	}

	.titlePanel-title {
		font-size: 0;
		position: absolute;
		left: 10px;
		top: -21px;
	}

	.titlePanel-title > div {
		display: inline-block;
	}

	.corner {
		position: absolute;
		width: 10px;
		height: 10px;
	}

	.left-corner {
		background-image: url("./assets/images/title-left.png");
		width: 130px;
		height: 42px;
	}

	.title {
		background-image: url("./assets/images/title-bg.png");
		height: 42px;
		line-height: 42px;
		vertical-align: top;
		font-size: 15px;
		color:#fff;
	}

	.titlePanel-body {
		/*margin-top: 25px;*/
	}

	.right-corner {
		background-image: url("./assets/images/title-right.png");
		width: 130px;
		height: 42px;
	}

	.left-top {
		left: 0;
		top: 0;
		background: url("./assets/images/left-top.png") no-repeat;
	}

	.right-top {
		right: 0;
		top: 0;
		background: url("./assets/images/right-top.png") no-repeat;
	}

	.left-bottom {
		left: 0;
		bottom: 0;
		background: url("./assets/images/left-bottom.png") no-repeat;
	}

	.right-bottom {
		right: 0;
		bottom: 0;
		background: url("./assets/images/right-bottom.png") no-repeat;
	}


</style>

