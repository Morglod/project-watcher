"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var minimatch = require("minimatch");
var path_1 = require("path");
var watcher_1 = require("./watcher");
var logger_1 = require("./logger");
/**
 * Core
 *
 * Uses https://github.com/isaacs/minimatch for path rules
 */
var ProjectWatcher = /** @class */ (function () {
    function ProjectWatcher(rootPath, opts, logger) {
        if (logger === void 0) { logger = logger_1.DefaultLogger.instance; }
        var _this = this;
        this.close = function () {
            _this.watcher.watcher.close();
        };
        this.logger = logger;
        this.paths = Object.entries(opts.paths).map(function (_a) {
            var ruleStr = _a[0], pathOpts = _a[1];
            return ({
                rule: new minimatch.Minimatch(ruleStr),
                opts: pathOpts
            });
        });
        rootPath = Array.isArray(rootPath) ? rootPath : [rootPath];
        rootPath = rootPath.map(function (x) { return path_1.resolve(x).replace(/\\/g, '/'); });
        this.watcher = new watcher_1.Watcher(rootPath, opts.watcher);
        // update index file
        ['newDir', 'renameDir', 'removeDir', 'newFile', 'renameFile', 'removeFile'].forEach(function (event) {
            _this.watcher.on(event, function (path) {
                var localPath = takeLocalPath(rootPath, path, _this.logger);
                _this.paths.some(function (_a) {
                    var rule = _a.rule, opts = _a.opts;
                    _this.logger.log(logger_1.LogLevel.log, "[" + event + "] try match '" + localPath + "' with " + rule.pattern);
                    if (rule.match(localPath)) {
                        _this.logger.log(logger_1.LogLevel.log, "[" + event + "] matched '" + localPath + "' with " + rule.pattern);
                        if (opts.autoIndex)
                            updateIndexFile(path, opts, logger);
                        if (opts.break)
                            return true;
                    }
                    return false;
                });
            });
        });
        // newDir/newFile template options
        ['newDir', 'newFile'].forEach(function (event) {
            _this.watcher.on(event, function (path) {
                _this.logger.log(logger_1.LogLevel.log, "[" + event + "] for '" + path + "'");
                var localPath = takeLocalPath(rootPath, path, _this.logger);
                // only empty entities
                var fileStat = fs.statSync(path);
                if (fileStat.isDirectory() && fs.readdirSync(path).length !== 0) {
                    _this.logger.log(logger_1.LogLevel.log, "[" + event + "] for '" + path + "' fileStat.isDirectory() && fs.readdirSync(path).length !== 0");
                    return;
                }
                if (fileStat.isFile() && fileStat.size !== 0) {
                    _this.logger.log(logger_1.LogLevel.log, "[" + event + "] for '" + path + "' fileStat.size !== 0; fileStat.size=" + fileStat.size);
                    return;
                }
                _this.paths.some(function (_a) {
                    var rule = _a.rule, opts = _a.opts;
                    _this.logger.log(logger_1.LogLevel.log, "[" + event + "] try match '" + localPath + "' with " + rule.pattern);
                    if (rule.match(localPath)) {
                        _this.logger.log(logger_1.LogLevel.log, "[" + event + "] matched '" + localPath + "' with " + rule.pattern);
                        if (event === 'newDir' && opts.newDirTemplate)
                            copyDirTemplate(path, opts.newDirTemplate, opts.replace, opts.replaceFileName, _this.logger);
                        if (event === 'newFile' && opts.newFileTemplate)
                            copyFileTemplate(path, opts.newFileTemplate, opts.replace, _this.logger);
                        if (opts.break)
                            return true;
                    }
                    return false;
                });
            });
        });
        // custom event handlers
        watcher_1.WatcherEventNames.forEach(function (eventName) {
            _this.watcher.on(eventName, function (path) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var localPath = takeLocalPath(rootPath, path, _this.logger);
                _this.paths.some(function (_a) {
                    var rule = _a.rule, opts = _a.opts;
                    _this.logger.log(logger_1.LogLevel.log, "[" + eventName + "] try match '" + localPath + "' with " + rule.pattern);
                    if (opts[eventName] && rule.match(localPath)) {
                        _this.logger.log(logger_1.LogLevel.log, "[" + eventName + "] matched '" + localPath + "' with " + rule.pattern);
                        opts[eventName].apply(opts, [path].concat(args));
                        if (opts.breakCustomEvents)
                            return true;
                    }
                    return false;
                });
            });
        });
    }
    return ProjectWatcher;
}());
exports.ProjectWatcher = ProjectWatcher;
function updateIndexFile(path, opts, logger) {
    // TODO: if file exists & no 'auto generated' comment
    var parent = path_1.dirname(path);
    var ext = opts.autoIndex === 'ts' ? '.ts' : '.js';
    var parentIndex = path_1.join(parent, './index' + ext);
    if (!fs.existsSync(parentIndex) && opts.dontCreateIndex)
        return;
    var entries = fs.readdirSync(parent).filter(function (x) {
        if (x.startsWith('index.'))
            return false;
        if (opts.excludeIndex && opts.excludeIndex.some(function (pathRule) { return minimatch(x, pathRule); }))
            return false;
        return true;
    });
    var content = '// Auto generated\n\n' + entries.map(function (x) {
        var ext = path_1.extname(x);
        var codeExt = ['.js', '.jsx', '.ts', '.tsx', ''];
        if (codeExt.includes(ext))
            return "export * from './" + path_1.basename(x, ext) + "';";
        var nameParts = x.split('.');
        var name = "" + nameParts[0] + nameParts[1].toUpperCase();
        return "export const " + name + " = require('./" + x + "');";
    }).join('\n');
    fs.writeFileSync(parentIndex, content, 'utf8');
}
exports.updateIndexFile = updateIndexFile;
function copyDirTemplate(dst, from, replacements, replaceFileName, logger) {
    if (logger)
        logger.log(logger_1.LogLevel.log, "copyDirTemplate from '" + from + "' to '" + dst + "'");
    var targetDirName = path_1.basename(dst);
    copyDir(dst, from, targetDirName, replacements, replaceFileName, logger);
}
exports.copyDirTemplate = copyDirTemplate;
function copyDir(dst, from, targetDirName, replacements, replaceFileName, logger) {
    if (logger)
        logger.log(logger_1.LogLevel.log, "copyDir from '" + from + "' to '" + dst + "'");
    if (!fs.existsSync(dst))
        fs.mkdirSync(dst);
    var entries = fs.readdirSync(from);
    entries.forEach(function (x) {
        if (fs.statSync(path_1.join(from, x)).isDirectory())
            copyDir(path_1.join(dst, x), path_1.join(from, x), targetDirName, replacements, replaceFileName, logger);
        else
            copyFile(path_1.join(dst, x), path_1.join(from, x), targetDirName, replacements, replaceFileName, logger);
    });
}
exports.copyDir = copyDir;
function copyFileTemplate(dst, from, replacements, logger) {
    if (logger)
        logger.log(logger_1.LogLevel.log, "copyFileTemplate from '" + from + "' to '" + dst + "'");
    var targetDirName = path_1.basename(dst);
    copyFile(dst, from, targetDirName, replacements, undefined, logger);
}
exports.copyFileTemplate = copyFileTemplate;
function copyFile(dst, from, targetDirName, replacements, replaceFileName, logger) {
    if (logger)
        logger.log(logger_1.LogLevel.log, "copyFile from '" + from + "' to '" + dst + "'");
    if (replaceFileName) {
        var dstFileExt = path_1.extname(dst);
        var dstFileName = path_1.basename(dst, dstFileExt);
        fnameReplaceLoop: for (var _i = 0, _a = Object.entries(replaceFileName); _i < _a.length; _i++) {
            var _b = _a[_i], replaceFrom = _b[0], replaceTo = _b[1];
            if (replaceFrom === dstFileName) {
                var replaceResult = void 0;
                if (typeof replaceTo === 'function') {
                    replaceResult = replaceTo({
                        filePath: dst,
                        fileName: dstFileName,
                        fileExt: dstFileExt,
                        targetDirName: targetDirName,
                    });
                }
                else {
                    replaceResult = replaceTo;
                }
                dst = path_1.join(path_1.dirname(dst), replaceResult);
                break fnameReplaceLoop;
            }
        }
    }
    if (replacements) {
        var fileContent = fs.readFileSync(from, 'utf8');
        var dstFileExt = path_1.extname(dst);
        var dstFileName = path_1.basename(dst, dstFileExt);
        for (var _c = 0, _d = Object.entries(replacements); _c < _d.length; _c++) {
            var _e = _d[_c], replaceFrom = _e[0], replaceTo = _e[1];
            var replaceResult = void 0;
            if (typeof replaceTo === 'function') {
                replaceResult = replaceTo({
                    filePath: dst,
                    fileName: dstFileName,
                    fileExt: dstFileExt,
                    targetDirName: targetDirName,
                });
            }
            else {
                replaceResult = replaceTo;
            }
            fileContent = fileContent.split(replaceFrom).join(replaceResult);
        }
        fs.writeFileSync(dst, fileContent);
    }
    else {
        fs.writeFileSync(dst, fs.readFileSync(from));
    }
}
exports.copyFile = copyFile;
function normalizePath(normalizedRootPaths, path, logger) {
    path = path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (logger)
        logger.log(logger_1.LogLevel.log, "normalizePath [" + normalizedRootPaths.join(', ') + "] " + path);
    var rootPath = normalizedRootPaths.find(function (x) { return path.startsWith(x); });
    if (!rootPath)
        return path;
    if (logger)
        logger.log(logger_1.LogLevel.log, "normalizePath " + rootPath + " " + path);
    return path; // path.substr(rootPath.length + 1);
}
exports.normalizePath = normalizePath;
function takeLocalPath(normalizedRootPaths, path, logger) {
    path = path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (logger)
        logger.log(logger_1.LogLevel.log, "normalizePath [" + normalizedRootPaths.join(', ') + "] " + path);
    var rootPath = normalizedRootPaths.find(function (x) { return path.startsWith(x); });
    if (!rootPath)
        return path;
    if (logger)
        logger.log(logger_1.LogLevel.log, "normalizePath " + rootPath + " " + path);
    return path.substr(rootPath.length + 1);
}
exports.takeLocalPath = takeLocalPath;
function normalizePathSlash(path) {
    return path.replace(/\\/g, '/');
}
exports.normalizePathSlash = normalizePathSlash;
//# sourceMappingURL=index.js.map