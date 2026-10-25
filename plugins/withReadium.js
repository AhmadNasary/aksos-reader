/**
 * Expo config plugin for react-native-readium (v5+).
 *
 * Expo regenerates ios/ and android/ on every `expo prebuild`, so the manual
 * steps from the Readium README are applied here instead of by hand:
 *   iOS     – Readium podspec source, `readium_pods`, `readium_post_install(installer)`
 *   Android – Java core library desugaring (java.time.* on older Android)
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withAppBuildGradle } = require('expo/config-plugins');

const MARK = '# [aksos] readium';

/** Find the Ruby file inside the package that defines `readium_pods`, if any. */
function findReadiumHelper(projectRoot) {
  let pkgDir;
  try {
    pkgDir = path.dirname(
      require.resolve('react-native-readium/package.json', { paths: [projectRoot] })
    );
  } catch {
    return null;
  }
  const stack = [{ dir: pkgDir, depth: 0 }];
  while (stack.length) {
    const { dir, depth } = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && depth < 3 && e.name !== 'node_modules') {
        stack.push({ dir: full, depth: depth + 1 });
      } else if (e.isFile() && e.name.endsWith('.rb')) {
        const src = fs.readFileSync(full, 'utf8');
        if (/def\s+readium_pods\b/.test(src)) return full;
      }
    }
  }
  return null;
}

function patchPodfile(podfile, helperPath, iosDir) {
  if (podfile.includes(MARK)) return podfile;

  let header = `${MARK}\nsource 'https://github.com/readium/podspecs'\nsource 'https://cdn.cocoapods.org/'\n`;
  if (helperPath) {
    const rel = path.relative(iosDir, helperPath).split(path.sep).join('/');
    header += `require_relative '${rel}'\n`;
  }
  podfile = header + '\n' + podfile;

  // readium_pods inside the app target, right after autolinking
  podfile = podfile.replace(
    /(\n(\s*)config = use_native_modules!.*\n)/,
    (m, line, indent) => `${line}${indent}readium_pods\n`
  );

  // readium_post_install after react_native_post_install(...)
  podfile = podfile.replace(
    /(\n(\s*)react_native_post_install\([\s\S]*?\n\s*\)\n)/,
    (m, block, indent) => `${block}${indent}readium_post_install(installer)\n`
  );

  return podfile;
}

const withReadiumIos = (config) =>
  withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iosDir = cfg.modRequest.platformProjectRoot;
      const podfilePath = path.join(iosDir, 'Podfile');
      const helper = findReadiumHelper(cfg.modRequest.projectRoot);
      const src = fs.readFileSync(podfilePath, 'utf8');
      const out = patchPodfile(src, helper, iosDir);
      if (!out.includes('readium_pods\n') || !out.includes('readium_post_install(installer)')) {
        console.warn(
          '[withReadium] Could not place readium_pods / readium_post_install automatically. ' +
            'Open ios/Podfile and add them as described in the react-native-readium README.'
        );
      }
      fs.writeFileSync(podfilePath, out);
      return cfg;
    },
  ]);

const withReadiumAndroid = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (!gradle.includes('coreLibraryDesugaringEnabled')) {
      gradle = gradle.replace(
        /android\s*\{/,
        `android {\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n    }`
      );
    }
    if (!gradle.includes('desugar_jdk_libs')) {
      gradle = gradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n    coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.1.2"`
      );
    }
    cfg.modResults.contents = gradle;
    return cfg;
  });

module.exports = (config) => withReadiumAndroid(withReadiumIos(config));
