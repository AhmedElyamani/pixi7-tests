const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		entry: './src/index.ts',

		output: {
			filename: isProduction ? '[name].[contenthash].js' : '[name].js',
			path: path.resolve(__dirname, 'build'),
			clean: true,
		},

		resolve: {
			extensions: ['.ts', '.js'],
			alias: {
				'@': path.resolve(__dirname, 'src'),
				'@assets': path.resolve(__dirname, 'assets'),
			},
		},

		module: {
			rules: [
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.css$/i,
					use: ['style-loader', 'css-loader'],
				},
				{
					test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'assets/images/[name].[hash][ext]',
					},
				},
			],
		},

		plugins: [
			new HtmlWebpackPlugin({
				template: './src/index.html',
				title: 'Pixi.js V7 Game Demo',
				minify: isProduction,
			}),
			new CopyWebpackPlugin({
				patterns: [
					{
						from: 'assets',
						to: 'assets',
					},
				],
			}),
		],

		devServer: {
			static: {
				directory: path.join(__dirname, 'build'),
				publicPath: '/',
			},
			compress: true,
			port: 3000,
			hot: true,
			open: true,
			historyApiFallback: true,
		},

		devtool: isProduction ? 'source-map' : 'eval-source-map',

		optimization: {
			splitChunks: isProduction ? {
				chunks: 'all',
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
						chunks: 'all',
					},
				},
			} : false,
		},

		performance: {
			maxEntrypointSize: isProduction ? 250000 : 5000000,
			maxAssetSize: isProduction ? 250000 : 5000000,
		},
	};
};