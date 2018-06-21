[![npm package](https://img.shields.io/npm/v/project-watcher.svg?style=flat-square)](https://www.npmjs.org/package/project-watcher)

# Project watcher

Watch on project files and filesystem events.  
Easily automate some routines.

Use case:
* Use template when creating new react block. [video](https://www.youtube.com/watch?v=0rPhA59vyoI)
* Auto update exports in index file. [video](https://www.youtube.com/watch?v=JYQUEFFQoII)

TypeScript support.

## Integration

Install

```
npm i project-watch
```

Create watcher script

```js
const path = require('path');
const { ProjectWatcher } = require('project-watcher');

// project paths
const projectSource = path.join(__dirname, '../src');
const projectBlockTemplate = path.join(__dirname, '../templates/block');
const projectBlockFileTemplate = path.join(__dirname, '../templates/block.tsx');

new ProjectWatcher(projectSource, {
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

Every time you create folder in any `blocks/` folder, it will be filled with template.  
Every time you create file in `blocks/`, it will be filled with template from file.  
Every time you create/delete/rename something in `blocks/`, `index.ts` file will be auto-updated.
