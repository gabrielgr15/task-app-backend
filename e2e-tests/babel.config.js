module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current', // This tells Babel to compile for the version of Node you are currently running.
                },
            },
        ],
    ],
  };