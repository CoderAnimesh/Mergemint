const fs = require("node:fs");
const fsPromises = require("node:fs/promises");

// On Windows exFAT/virtualized drives, fs.readlink on a regular file returns EISDIR
// instead of EINVAL, which causes Webpack / Next.js file tracing to fail.
if (process.platform === "win32") {
  const origReadlink = fs.readlink.bind(fs);
  fs.readlink = function patchedReadlink(path, options, callback) {
    const cb = typeof options === "function" ? options : callback;
    const opts = typeof options === "function" ? undefined : options;
    const wrapped = (err, linkString) => {
      if (err && err.code === "EISDIR") {
        err.code = "EINVAL";
      }
      cb(err, linkString);
    };
    return opts ? origReadlink(path, opts, wrapped) : origReadlink(path, wrapped);
  };

  const origReadlinkSync = fs.readlinkSync.bind(fs);
  fs.readlinkSync = function patchedReadlinkSync(path, options) {
    try {
      return origReadlinkSync(path, options);
    } catch (err) {
      if (err && err.code === "EISDIR") {
        err.code = "EINVAL";
      }
      throw err;
    }
  };

  const origPromisesReadlink = fsPromises.readlink.bind(fsPromises);
  fsPromises.readlink = async function patchedPromisesReadlink(path, options) {
    try {
      return await origPromisesReadlink(path, options);
    } catch (err) {
      if (err && err.code === "EISDIR") {
        err.code = "EINVAL";
      }
      throw err;
    }
  };
}
