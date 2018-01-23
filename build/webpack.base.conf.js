var path = require('path')
var utils = require('./utils')
var config = require('../config')
var vueLoaderConfig = require('./vue-loader.conf')
var autoprefixer = require('autoprefixer');

function resolve(dir) {
	return path.join(__dirname, '..', dir)
}

module.exports = {
	entry: {
		app: './src/main.js'
	},
	output: {
		path: config.build.assetsRoot,
		filename: "[name].[hash].js",
		chunkFilename: "[name].[chunkhash].chunk.js",
		publicPath: process.env.NODE_ENV === 'production'
			? config.build.assetsPublicPath
			: config.dev.assetsPublicPath
	},
	resolve: {
		extensions: ['.js', '.vue', '.json'],
		alias: {
			'vue$': 'vue/dist/vue.esm.js',
			'@': resolve('src'),
			'assets': resolve('src/assets'),
			// 'cps'   : resolve('src/components'),
			// 'views'   : resolve('src/components/views'),
			'layout': resolve('src/layout'),
			'config': resolve('src/config'),
			'utils': resolve('src/utils'),
			'store': resolve('src/store'),
			'mixins': resolve('src/mixins'),
			'plugins': resolve('src/plugins'),
			'register': resolve('src/register'),
			'libs': resolve('src/libs'),
			'apis': resolve('src/apis'),
			'router': resolve('src/router'),

			'components': resolve('src/components'),
			'3clear': resolve('src/3ClearLz')
		}
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: vueLoaderConfig
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				include: [resolve('src'), resolve('test')]
			},
			{
				test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 1024000,
					name: utils.assetsPath('img/[name].[hash:7].[ext]')
				}
			},
			 
			{
				test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 80000,
					name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
				}
			}
		]
	}
}
