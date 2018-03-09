"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDebug = process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'dev' ||
    process.env.NODE_ENV === 'debug';
if (exports.isDebug) {
    console.log('debug mode');
}
//# sourceMappingURL=env.js.map