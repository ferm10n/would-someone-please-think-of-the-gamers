module.exports = {
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/background/background.ts',
      rendererProcessFile: 'src/renderer.ts',
      mainProcessWatch: [
        'src/background**/*.ts',
        'src/store.ts',
        'src/store/main.store.ts',
      ],
      /**
       * @param {import('webpack-chain')} config
       */
      chainWebpackRendererProcess(config) {
        // config.target('electron-renderer');
        // config.resolve.alias.set(
        //   './background/miner',
        //   require.resolve('./src/shim.remote-only.ts')
        // );

        config.resolve.alias.set('electron', require.resolve('electron'));
        config.resolve.alias.set(
          'electron-store',
          require.resolve('electron-store')
        );
        config.resolve.alias.set('vuex', require.resolve('vuex'));
      },
      builderOptions: {
        publish: ['github'],
        productName: 'wsptg',
        generateUpdatesFilesForAllChannels: true,
      },
      nodeIntegration: true,
      // nodeModulesPath: ['./node_modules'],
    },
  },
  configureWebpack: {
    devtool: 'source-map',
  },
};
