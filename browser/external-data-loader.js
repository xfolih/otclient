/**
 * Load init.lua, data, mods, modules from the server at runtime (same origin).
 * Used when WASM_EXTERNAL_DATA=ON so private files are not baked into the build.
 * Requires manifest.json next to otclient.html listing all files to fetch.
 */
(function() {
  function getBaseURL() {
    var pathname = typeof location !== 'undefined' && location.pathname ? location.pathname : '/';
    var origin = typeof location !== 'undefined' ? location.origin : '';
    if (!pathname || pathname === '/') return origin + '/';
    var dir;
    if (pathname.endsWith('/')) {
      dir = pathname;
    } else if (pathname.lastIndexOf('.') > pathname.lastIndexOf('/')) {
      dir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    } else {
      dir = pathname + '/';
    }
    return origin + dir;
  }

  function ensureDir(path) {
    var parts = path.split('/').filter(Boolean);
    var current = '';
    for (var i = 0; i < parts.length - 1; i++) {
      current += (current ? '/' : '') + parts[i];
      try {
        if (!FS.analyzePath(current).exists) {
          FS.mkdir(current);
        }
      } catch (e) {
        // ignore if exists
      }
    }
  }

  function loadExternalData() {
    if (typeof addRunDependency !== 'function' || typeof removeRunDependency !== 'function') return;
    addRunDependency('externalData');
    var baseURL = getBaseURL();
    var manifestURL = baseURL + 'manifest.json';
    if (typeof Module !== 'undefined' && Module.printErr) Module.printErr('external-data: fetching manifest ' + manifestURL);
    fetch(manifestURL)
      .then(function(res) {
        if (!res.ok) throw new Error('manifest.json failed: ' + res.status);
        return res.json();
      })
      .then(function(manifest) {
        var files = manifest.files || manifest;
        if (!Array.isArray(files) || files.length === 0) {
          if (typeof Module !== 'undefined' && Module.printErr) Module.printErr('external-data: no files in manifest');
          removeRunDependency('externalData');
          return;
        }
        if (typeof Module !== 'undefined' && Module.printErr) Module.printErr('external-data: loading ' + files.length + ' files');
        var pending = files.length;
        function done() {
          pending--;
          if (pending <= 0) {
            if (typeof Module !== 'undefined' && Module.printErr) Module.printErr('external-data: all files loaded');
            removeRunDependency('externalData');
          }
        }
        files.forEach(function(relativePath) {
          var url = baseURL + relativePath;
          var vfsPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
          fetch(url)
            .then(function(res) {
              if (!res.ok) { done(); return; }
              return res.arrayBuffer();
            })
            .then(function(buf) {
              if (!buf) { done(); return; }
              try {
                ensureDir(vfsPath);
                FS.writeFile(vfsPath, new Uint8Array(buf));
              } catch (e) {
                if (typeof Module !== 'undefined' && Module.printErr) Module.printErr('external-data: write ' + vfsPath + ': ' + e);
              }
              done();
            })
            .catch(function(err) {
              if (typeof Module !== 'undefined' && Module.printErr) Module.printErr('external-data: fetch ' + url + ': ' + err);
              done();
            });
        });
      })
      .catch(function(err) {
        if (typeof Module !== 'undefined' && Module.printErr) Module.printErr('external-data: ' + err);
        removeRunDependency('externalData');
      });
  }

  var Module = typeof Module !== 'undefined' ? Module : {};
  Module.preRun = Module.preRun || [];
  Module.preRun.push(loadExternalData);
})();
