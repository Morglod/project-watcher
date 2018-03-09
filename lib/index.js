"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var minimatch = require("minimatch");
var path_1 = require("path");
var watcher_1 = require("./watcher");
/** Uses https://github.com/isaacs/minimatch for path rules */
var ProjectWatcher = /** @class */ (function () {
    function ProjectWatcher(path, opts) {
        var _this = this;
        this.close = function () {
            _this.watcher.watcher.close();
        };
        this.paths = Object.entries(opts.paths).map(function (_a) {
            var ruleStr = _a[0], pathOpts = _a[1];
            return ({
                rule: new minimatch.Minimatch(ruleStr),
                opts: pathOpts
            });
        });
        this.watcher = new watcher_1.Watcher(path, opts.watcher);
        ['newDir', 'renameDir', 'removeDir', 'newFile', 'renameFile', 'removeFile'].forEach(function (event) {
            _this.watcher.on(event, function (path) {
                _this.paths.forEach(function (_a) {
                    var rule = _a.rule, opts = _a.opts;
                    if (rule.match(path)) {
                        if (opts.autoIndex)
                            updateIndexFile(path, opts);
                    }
                });
            });
        });
        ['newDir', 'newFile'].forEach(function (event) {
            _this.watcher.on(event, function (path) {
                _this.paths.forEach(function (_a) {
                    var rule = _a.rule, opts = _a.opts;
                    if (rule.match(path)) {
                        if (opts.newDirTemplate)
                            copyDirTemplate(path, opts.newDirTemplate);
                        if (opts.newFileTemplate)
                            copyFileTemplate(path, opts.newFileTemplate);
                    }
                });
            });
        });
        watcher_1.EventNames.forEach(function (eventName) {
            _this.watcher.on(eventName, function (path) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                _this.paths.forEach(function (_a) {
                    var rule = _a.rule, opts = _a.opts;
                    if (opts[eventName] && rule.match(path)) {
                        opts[eventName].apply(opts, [path].concat(args));
                    }
                });
            });
        });
    }
    return ProjectWatcher;
}());
exports.ProjectWatcher = ProjectWatcher;
function updateIndexFile(path, opts) {
    // TODO: if file exists & no 'auto generated' comment
    var parent = path_1.basename(path);
    var ext = opts.autoIndex === 'ts' ? '.ts' : '.js';
    var parentIndex = path_1.join(parent, './index' + ext);
    if (!fs.existsSync(parentIndex) && opts.dontCreateIndex)
        return;
    var entries = fs.readdirSync(parent).filter(function (x) { return !x.startsWith('index.'); });
    var content = '// Auto generated\n\n' + entries.map(function (x) { return "export * from './" + x + "';"; }).join('\n');
    fs.writeFileSync(parentIndex, content, 'utf8');
}
exports.updateIndexFile = updateIndexFile;
function copyDirTemplate(dst, from) {
    copyDir(dst, from);
}
exports.copyDirTemplate = copyDirTemplate;
function copyDir(dst, from) {
    if (!fs.existsSync(dst))
        fs.mkdirSync(dst);
    var entries = fs.readdirSync(from);
    entries.forEach(function (x) {
        if (fs.statSync(x).isDirectory)
            copyDir(path_1.join(dst, x), path_1.join(from, x));
        else
            copyFile(path_1.join(dst, x), path_1.join(from, x));
    });
}
exports.copyDir = copyDir;
function copyFileTemplate(dst, from) {
    fs.copyFileSync(dst, from);
}
exports.copyFileTemplate = copyFileTemplate;
function copyFile(dst, from) {
    fs.writeFileSync(dst, fs.readFileSync(from));
}
exports.copyFile = copyFile;
//# sourceMappingURL=index.js.map