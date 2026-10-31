// Windows has a 260-character path limit. React Native's generated C++
// (codegen for safe-area-context, screens, reanimated) produces object paths
// far beyond it, and the NDK default CMake 3.22.1 bundles ninja 1.10, which
// cannot use Windows long paths even when the OS allows them.
//
// On Windows hosts only, every Android module is pinned to SDK CMake 3.31.6
// (bundles ninja 1.12.1; install it with the SDK Manager: `cmake;3.31.6`) and
// CMake staging directories move to a short folder at the drive root for extra
// headroom. Requires Windows long paths (LongPathsEnabled=1).
//
// The hook lives in settings.gradle (`gradle.beforeProject`) because Android
// Gradle Plugin freezes these values once a module is evaluated, and some
// modules are evaluated before the root build script runs.
const { withSettingsGradle } = require('expo/config-plugins');

const MARKER = '// calavera: windows native build';
const CMAKE_VERSION = '3.31.6';

const SNIPPET = `
${MARKER}
if (System.getProperty('os.name').toLowerCase().contains('windows')) {
  def shortRoot = (System.getenv('SystemDrive') ?: 'C:') + '/rncxx'
  gradle.beforeProject { project ->
    ['com.android.application', 'com.android.library'].each { pluginId ->
      project.plugins.withId(pluginId) {
        def cmake = project.android.externalNativeBuild.cmake
        cmake.version = '${CMAKE_VERSION}'
        cmake.buildStagingDirectory = new File(shortRoot, Integer.toHexString(project.path.hashCode()))
      }
    }
  }
}
`;

module.exports = function withWindowsNativeBuild(config) {
  return withSettingsGradle(config, (mod) => {
    if (mod.modResults.language === 'groovy' && !mod.modResults.contents.includes(MARKER)) {
      mod.modResults.contents += SNIPPET;
    }
    return mod;
  });
};
