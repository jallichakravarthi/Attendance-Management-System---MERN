const webpack = require('webpack');

module.exports = function override(config) {
    // Add fallbacks for Node.js core modules
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        "path": require.resolve("path-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser")
    });
    config.resolve.fallback = fallback;
    
    // Add plugins
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG || '')
        })
    ]);
    
    // Add resolve configuration
    config.resolve = {
        ...config.resolve,
        fallback: {
            ...config.resolve.fallback,
            "path": require.resolve("path-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer/"),
            "process": require.resolve("process/browser")
        }
    };
    
    return config;
}
