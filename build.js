const esbuild = require('esbuild');

esbuild.buildSync({
    platform: 'browser',
    globalName: 'c64asm',
    minify: true, // TODO
    target: 'es2020',
    entryPoints: ['src/asm.ts'],
    bundle: true,
    outfile: 'dist/c64asm.min.js',
});
