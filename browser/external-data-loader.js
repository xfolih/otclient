/**
 * Load init.lua, data, mods, modules from server at runtime (same origin).
 * Uses synchronous XHR to ensure ALL files are in VFS before main() runs.
 * Requires manifest.json next to otclient.html.
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
        if (!FS.analyzePath(current).exists) FS.mkdir(current);
      } catch (e) {}
    }
  }

  function syncFetch(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.responseType = 'arraybuffer';
    xhr.send();
    if (xhr.status !== 200) throw new Error(url + ': ' + xhr.status);
    return xhr.response;
  }

  function loadExternalData() {
    if (typeof addRunDependency !== 'function' || typeof removeRunDependency !== 'function') return;
    addRunDependency('externalData');
    try {
      var baseURL = getBaseURL();
      var manifestURL = baseURL + 'manifest.json';
      var log = function(msg) { try { if (typeof Module !== 'undefined' && Module.printErr) Module.printErr(msg); } catch (_) {} };
      log('external-data: loading ' + manifestURL);
      var manifestBuf = syncFetch(manifestURL);
      var manifest = JSON.parse(new TextDecoder().decode(manifestBuf));
      var files = manifest.files || manifest;
      if (!Array.isArray(files) || files.length === 0) {
        log('external-data: manifest has no files');
        return;
      }
      log('external-data: writing ' + files.length + ' files');
      for (var i = 0; i < files.length; i++) {
        var rel = files[i];
        var url = baseURL + rel;
        var vfsPath = rel.startsWith('/') ? rel : '/' + rel;
        try {
          var buf = syncFetch(url);
          ensureDir(vfsPath);
          FS.writeFile(vfsPath, new Uint8Array(buf));
        } catch (e) {
          log('external-data: ' + vfsPath + ' ' + e);
        }
      }
      log('external-data: done');
    } catch (e) {
      try { (typeof Module !== 'undefined' && Module.printErr && Module.printErr('external-data: ' + e)); } catch (_) {}
    } finally {
      removeRunDependency('externalData');
    }
  }

  var Module = typeof Module !== 'undefined' ? Module : {};
  Module.preRun = Module.preRun || [];
  Module.preRun.push(loadExternalData);
})();
