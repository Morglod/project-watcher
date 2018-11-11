"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LogLevel;
(function (LogLevel) {
    /** Everything */
    LogLevel["log"] = "log";
    /** Important info */
    LogLevel["info"] = "info";
    /** Errors */
    LogLevel["error"] = "error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var DefaultLogger = /** @class */ (function () {
    function DefaultLogger() {
    }
    Object.defineProperty(DefaultLogger, "instance", {
        get: function () {
            if (this._instance)
                return this._instance;
            return this._instance = new DefaultLogger;
        },
        enumerable: true,
        configurable: true
    });
    DefaultLogger.prototype.log = function (level, message) {
        var optionalParams = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            optionalParams[_i - 2] = arguments[_i];
        }
        switch (level) {
            case LogLevel.error:
                console.error(message, optionalParams);
                break;
            case LogLevel.info:
            case LogLevel.log:
                console.log(message, optionalParams);
                break;
        }
    };
    return DefaultLogger;
}());
exports.DefaultLogger = DefaultLogger;
//# sourceMappingURL=logger.js.map