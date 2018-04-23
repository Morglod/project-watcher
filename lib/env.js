"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDebug = process.env.NODE_ENV === 'debug';
exports.isDev = exports.isDebug ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'dev';
if (exports.isDev) {
    console.log('project-watch: dev mode');
}
if (exports.isDebug) {
    console.log('project-watch: debug mode');
}
//# sourceMappingURL=env.js.map