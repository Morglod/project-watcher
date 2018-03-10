"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var watcher = new index_1.ProjectWatcher(require('path').resolve('./'), {
    watcher: {},
    paths: {
        "blocks/*": {
            autoIndex: 'ts',
            newDirTemplate: './templates/block',
            newFileTemplate: './templates/block.tsx',
        }
    }
});
//# sourceMappingURL=example.js.map