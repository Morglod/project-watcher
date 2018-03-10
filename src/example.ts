import { ProjectWatcher } from './index';

const watcher = new ProjectWatcher(require('path').resolve('./'), {
    watcher: {},
    paths: {
        "blocks/*": {
            autoIndex: 'ts',
            newDirTemplate: './templates/block',
            newFileTemplate: './templates/block.tsx',
        }
    }
});