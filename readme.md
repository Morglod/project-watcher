# project-watcher

Currently wip.

Watch on project's files and automate some routines.

eg:
* Use template when creating new react block.
* Update exports in index file.

## Integration

Install

```
npm i project-watch
```

Create watcher script

```js
const path = require('path');

// project paths
const projectSource = path.join(__dirname, '../src');
const projectBlockTemplate = path.join(__dirname, '../templates/block');
const projectBlockFileTemplate = path.join(__dirname, '../templates/block.tsx');

new require('project-watch').ProjectWatcher(projectSource, {
    watcher: {},
    paths: {
        "**/blocks/*": {
            autoIndex: 'ts',
            excludeIndex: [ '*.scss', '*.scss.d.ts' ],
            newDirTemplate: projectBlockTemplate,
        },
        "**/blocks/*.tsx": {
            newFileTemplate: projectBlockFileTemplate,
        }
    }
});
```

Now run watcher script with development environment.

Every time you create folder in `blocks/`, it will be filled with template.  
Every time you create file in `blocks/`, it will be filled with template from file.  
Every time you create/delete/rename something in `blocks/`, `index.ts` file will be auto-updated.