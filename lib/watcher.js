"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var chokidar = require("chokidar");
var event_emitter_1 = require("./event-emitter");
var logger_1 = require("./logger");
exports.WatcherEventNames = [
    'newDir',
    'newFile',
    'renameFile',
    'renameDir',
    'removeDir',
    'removeFile',
    'changeFile',
];
/**
 * FileSystem watcher
 *
 * Use `on`/`once`/`addListener`/`removeListener`.
 */
var Watcher = /** @class */ (function (_super) {
    __extends(Watcher, _super);
    function Watcher(path, opts, logger) {
        if (logger === void 0) { logger = logger_1.DefaultLogger.instance; }
        var _this = _super.call(this) || this;
        _this.eventTimeoutMS = 50;
        _this.renameDirTimeoutMS = 50;
        _this.renameFileTimeoutMS = 50;
        _this.setupIterationTimeoutMS = 100;
        /** stop listening and close fs watcher */
        _this.dispose = function () {
            _this.stopListening();
            _this.watcher.close();
        };
        _this.handleNewDir = function (path) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stopListening();
                        this.logger.log(logger_1.LogLevel.log, 'handleNewDir');
                        return [4 /*yield*/, this.emitWait(this.eventTimeoutMS, 'newDir', path)];
                    case 1:
                        _a.sent();
                        setTimeout(this.listen, this.setupIterationTimeoutMS);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleDirRename = function (oldPath, newPath) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stopListening();
                        this.logger.log(logger_1.LogLevel.log, 'handleDirRename');
                        return [4 /*yield*/, this.emitWait(this.eventTimeoutMS, 'renameDir', oldPath, newPath)];
                    case 1:
                        _a.sent();
                        setTimeout(this.listen, this.setupIterationTimeoutMS);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleRemoveDir = function (path) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stopListening();
                        this.logger.log(logger_1.LogLevel.log, 'handleRemoveDir');
                        return [4 /*yield*/, this.emitWait(this.eventTimeoutMS, 'removeDir', path)];
                    case 1:
                        _a.sent();
                        setTimeout(this.listen, this.setupIterationTimeoutMS);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleUnlinkDir = function (unlinkPath) { return __awaiter(_this, void 0, void 0, function () {
            var timer;
            var _this = this;
            return __generator(this, function (_a) {
                this.stopListening();
                this.logger.log(logger_1.LogLevel.log, 'handleUnlinkDir');
                this.watcher.addListener('addDir', function (newPath) {
                    clearTimeout(timer);
                    _this.handleDirRename(unlinkPath, newPath);
                });
                timer = setTimeout(function () {
                    _this.stopListening();
                    _this.handleRemoveDir(unlinkPath);
                }, this.renameDirTimeoutMS);
                return [2 /*return*/];
            });
        }); };
        _this.handleFileChange = function (path) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stopListening();
                        this.logger.log(logger_1.LogLevel.log, 'handleFileChange');
                        return [4 /*yield*/, this.emitWait(this.eventTimeoutMS, 'changeFile', path)];
                    case 1:
                        _a.sent();
                        setTimeout(this.listen, this.setupIterationTimeoutMS);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleFileRename = function (oldPath, newPath) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stopListening();
                        this.logger.log(logger_1.LogLevel.log, 'renameFile');
                        return [4 /*yield*/, this.emitWait(this.eventTimeoutMS, 'renameFile', oldPath, newPath)];
                    case 1:
                        _a.sent();
                        setTimeout(this.listen, this.setupIterationTimeoutMS);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleNewFile = function (addPath) {
            _this.stopListening();
            _this.logger.log(logger_1.LogLevel.log, 'handleNewFile');
            _this.watcher.addListener('unlink', function (oldPath) {
                clearTimeout(timer);
                _this.handleFileRename(oldPath, addPath);
            });
            var timer = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log(logger_1.LogLevel.log, 'emit newFile, cancel handleFileRename');
                            this.stopListening();
                            return [4 /*yield*/, this.emitWait(this.eventTimeoutMS, 'newFile', addPath)];
                        case 1:
                            _a.sent();
                            setTimeout(this.listen, this.setupIterationTimeoutMS);
                            return [2 /*return*/];
                    }
                });
            }); }, _this.renameFileTimeoutMS);
        };
        _this.handleFileRemove = function (path) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stopListening();
                        this.logger.log(logger_1.LogLevel.log, 'handleFileRemove');
                        return [4 /*yield*/, this.emitWait(this.eventTimeoutMS, 'removeFile', path)];
                    case 1:
                        _a.sent();
                        setTimeout(this.listen, this.setupIterationTimeoutMS);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.listen = function () {
            _this.logger.log(logger_1.LogLevel.log, 'setup listen events');
            _this.stopListening();
            _this.watcher.addListener('addDir', _this.handleNewDir);
            _this.watcher.addListener('change', _this.handleFileChange);
            _this.watcher.addListener('add', _this.handleNewFile);
            _this.watcher.addListener('unlinkDir', _this.handleUnlinkDir);
            _this.watcher.addListener('unlink', _this.handleFileRemove);
        };
        _this.stopListening = function () {
            _this.watcher.removeAllListeners();
        };
        _this.logger = logger;
        var options = __assign({ persistent: true, atomic: true }, opts);
        _this.watcher = chokidar.watch(path, options).on('ready', _this.listen);
        return _this;
    }
    return Watcher;
}(event_emitter_1.EventEmitter));
exports.Watcher = Watcher;
//# sourceMappingURL=watcher.js.map