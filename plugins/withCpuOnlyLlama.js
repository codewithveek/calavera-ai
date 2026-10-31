// Calavera AI runs llama.cpp on the CPU only (no GPU offload), but llama.rn
// ships every arm64 phone a Snapdragon Hexagon/OpenCL build (~13 MB of native
// libraries) plus Hexagon HTP blobs (~3 MB of assets it extracts at startup).
// This keeps both out of the APK. llama.rn falls back to its CPU builds when
// the Hexagon library is absent (it catches UnsatisfiedLinkError) and skips
// HTP setup when the assets are missing.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// calavera: cpu-only llama.rn';

const SNIPPET = `
${MARKER}
android.packaging.jniLibs.excludes.add('**/librnllama*_hexagon_opencl.so')
android.androidResources.ignoreAssetsPatterns.add('!<dir>ggml-hexagon')
`;

module.exports = function withCpuOnlyLlama(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language === 'groovy' && !mod.modResults.contents.includes(MARKER)) {
      mod.modResults.contents += SNIPPET;
    }
    return mod;
  });
};
