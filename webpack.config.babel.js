import path from 'path';

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import RemovePlugin from 'remove-files-webpack-plugin';
import TerserJSPlugin from 'terser-webpack-plugin';

// const
const mode = process.env.NODE_ENV ?? 'production';
const isProd = mode === 'production';
const isDev = !isProd;
const port = 3000;

// utils
const arrayFilterEmpty = (array) => array.filter((x) => !!x);
const fileName = (ext) => `[name].[contenthash].${ext}`;

console.log(process.env.REACT_APP_LANDING_URL)

// plugins
const removePlugin = new RemovePlugin({
  before: {
    include: [path.resolve(__dirname, 'build')],
  },
});

const copyPlugin = new CopyPlugin({
  patterns: [
    {
      from: path.resolve(__dirname, 'public/favicon.png'),
      to: path.resolve(__dirname, 'build'),
    },
  ],
});

const forkTsCheckerWebpackPlugin = new ForkTsCheckerWebpackPlugin({
  async: isDev,
  typescript: {
    configFile: path.resolve(__dirname, 'tsconfig.json'),
  },
  eslint: {enabled: true, files: './**/*.{ts,tsx,js,jsx}'},
});
const htmlWebpackPlugin = new HtmlWebpackPlugin({
  filename: 'index.html',
  inject: true,
  template: path.resolve(__dirname, 'public/index.html'),
  minify: {
    removeComments: isProd,
    collapseWhitespace: isProd,
  },
});
const miniCssExtractPlugin = new MiniCssExtractPlugin({
  filename: fileName('css'),
  chunkFilename: fileName('css'),
});
const terserPlugin = new TerserJSPlugin({});
const cssMinimizerPlugin = new CssMinimizerPlugin();
const reactRefreshPlugin = new ReactRefreshWebpackPlugin();

//babel-loader
const babelLoader = {
  loader: 'babel-loader',
  options: {
    configFile: path.resolve(__dirname, '.babelrc.js'),
  },
};

//rules
const cssRule = {
  test: /\.css$/,
  use: [
    {
      loader: isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
      options: {
        esModule: false,
      },
    },
    'css-loader',
    'postcss-loader',
  ],
};
const svgReactComponentRule = {
  test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
  issuer: /\.[jt]sx$/,
  use: [
    babelLoader,
    {
      loader: '@svgr/webpack',
      options: {
        babel: false,
        icon: true,
      },
    },
  ],
};
/**
 * Using file-loader for handling svg files
 * @see https://webpack.js.org/guides/asset-modules/
 */
const svgRule = {
  test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
  issuer: {not: [/\.[jt]sx$/]},
  type: 'asset/inline',
};
/**
 * @see https://webpack.js.org/guides/typescript/#loader
 */
const typescriptRule = {
  test: /\.tsx?$/,
  loader: 'ts-loader',
  options: {
    transpileOnly: true,
  },
  exclude: /node_modules/,
};
/**
 * @see https://webpack.js.org/loaders/babel-loader
 */
const javascriptRule = {
  test: /\.(js|jsx)$/,
  use: [babelLoader],
  exclude: /node_modules/,
};
/**
 * @see https://webpack.js.org/guides/asset-modules/
 */
const imagesRule = {
  test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
  type: 'asset/resource',
};
/**
 * @see https://webpack.js.org/guides/asset-modules/
 */
const fontsRule = {
  test: /\.(woff(2)?|eot|ttf|otf|)$/,
  type: 'asset/resource',
};

export default {
  mode: isProd ? 'production' : 'development',
  target: isProd ? ['web', 'es5'] : 'web',
  context: path.resolve(__dirname, 'src'),
  entry: isProd ? ['./index.tsx'] : [path.resolve(__dirname, './cleanOnHMR.js'), './index.tsx'],
  output: {
    publicPath: '/',
    filename: fileName('js'),
    path: path.resolve(__dirname, 'build'),
  },
  module: {
    rules: [
      javascriptRule,
      typescriptRule,
      imagesRule,
      fontsRule,
      cssRule,
      svgReactComponentRule,
      svgRule,
    ],
  },
  plugins: arrayFilterEmpty([
    htmlWebpackPlugin,
    forkTsCheckerWebpackPlugin,
    copyPlugin,
    removePlugin,
    isDev && reactRefreshPlugin,
    isProd && miniCssExtractPlugin,
  ]),
  resolve: {
    alias: {
      '@images': path.resolve(__dirname, 'src/images'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  optimization: {
    minimize: isProd,
    minimizer: [terserPlugin, cssMinimizerPlugin],
    runtimeChunk: {
      name: 'runtime',
    },
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'initial',
        },
      },
    },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  devtool: isDev ? 'cheap-module-source-map' : false,
  devServer: {
    client: {
      overlay: false,
    },
    headers: {'Access-Control-Allow-Origin': '*'},
    historyApiFallback: true,
    hot: true,
    port,
    static: {
      publicPath: '/',
    },
  },
};
