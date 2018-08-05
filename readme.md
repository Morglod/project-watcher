[![npm package](https://img.shields.io/npm/v/project-watcher.svg?style=flat-square)](https://www.npmjs.org/package/project-watcher)

# Project watcher

Watch on project files and filesystem events.  
Easily automate some routines.

Use case:
* Use template when creating new react block. [video](https://www.youtube.com/watch?v=0rPhA59vyoI)
* Auto update exports in index file. [video](https://www.youtube.com/watch?v=JYQUEFFQoII)

Full TypeScript support.

Uses `chokidar` for fs observing.  
For all path rules `minimatch` used.

While still in development, use `--save-exact` to prevent updating with breaking changes.

## Integration

Install

```
npm i project-watcher --save-exact
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

## API

### `ProjectWatcher`


<details>
<summary>
constructor
</summary>

```ts
constructor(rootPath: string | string[], opts: ProjectWatcherOptions, logger: ILogger = DefaultLogger.instance);
```

* `rootPath` - Path or paths to project's root directories that will be watched.
* `opts` - Configuration (see below).
* `logger` - ILogger instance that will be used for all log messages.

</details>

<details>
<summary>
ProjectWatcherOptions
</summary>

```ts
type ProjectWatcherOptions = {
    watcher?: WatcherOptions,
    paths: { [pathRule: string]: ProjectWatcherPathOptions },
}
```

* `watcher` - Chokidar watch options (`chokidar.WatchOptions`).
* `paths` - Map of paths & it's processing options.

`ProjectWatcherOptions` is

```ts
type ProjectWatcherOptions = {

    // FileSystem events custom handlers

    newDir?: (path: string) => any,
    newFile?: (path: string) => any,
    renameFile?: (oldPath: string, newPath: string) => any,
    renameDir?: (oldPath: string, newPath: string) => any,
    removeDir?: (path: string) => any,
    removeFile?: (path: string) => any,
    changeFile?: (path: string) => any,

    // Automation

    break?: boolean,
    breakCustomEvents?: boolean,
    autoIndex?: boolean|'js'|'ts',
    dontCreateIndex?: boolean,
    excludeIndex?: string[],
    newDirTemplate?: string,
    newFileTemplate?: string,
    replace?: ReplacementMap,
    replaceFileName?: ReplacementMap,
}
```

You can observe any of filesystem events.  
Callbacks are async and if you return `Promise` from it, project-watcher will wait until promise will be resolved.

* `break` - Will stop event propogation for other similar paths (doesnt effect custom handlers).
* `breakCustomEvents` - Will stop event propogation for custom handlers.
* `autoIndex` - Auto update exports in index files. Use `js` or `ts` to specify index's extension. (`ts` by default).
* `dontCreateIndex` - If `autoIndex=true` dont create index file if it is not exists.
* `excludeIndex` - Excludes some paths or file names from indexing in `autoIndex`.
* `newDirTemplate` - Path to directory with template code. If new dir is created on matched path, it will be populated with this template. Use `replace` & `replaceFileName` to tweak this template.
* `newFileTemplate` - Path to file with template code. If new dir is created on matched path, it will be populated with this template. Use `replace` & `replaceFileName` to tweak this template.
* `replace` - Replace text in templates (see more info below).
* `replaceFileName` - Rename files of directory template (see more info below).

</details>


<details>
<summary>
ProjectWatcherOptions.replaceFileName
</summary>

Replacement map for template's files.  
Applied before `ProjectWatcherOptions.replace`.

```ts
type ReplacementMap = {
    [from: string]: 
        string|
        ((info: {
            // full path to dst file name
            // eg '/c/project/a.ts'
            filePath: string,

            // file's base name (without path & extension)
            // eg 'a'
            fileName: string,

            // file's extension
            // eg '.ts'
            fileExt: string,

            // path to dst file
            // eg '/c/project'
            targetDirName: string
        }) => string)
}
```

'from' is matching filenames in templates directory (when populating new directory with template code).

#### Example

When creating dir like 'blocks/myBlock'  
And template file copied from 'template/NAME.js'  

with:
```ts
replaceFileName: {
    NAME: ({ targetDirName }) => `${targetDirName}.js`,
}
```

File will be copied as 'blocks/myBlock/myBlock.js'

</details>

<details>
<summary>
ProjectWatcherOptions.replace
</summary>

Replacement map to text in templates.  
Applied after `ProjectWatcherOptions.replaceFileName`.

```ts
type ReplacementMap = {
    [from: string]: 
        string|
        ((info: {
            // full path to dst file name
            // eg '/c/project/a.ts'
            filePath: string,

            // file's base name (without path & extension)
            // eg 'a'
            fileName: string,

            // file's extension
            // eg '.ts'
            fileExt: string,

            // path to dst file
            // eg '/c/project'
            targetDirName: string
        }) => string)
}
```

When from is matched, replaces to string or 'transformer' func.

!! `replace` used after `replaceFileName`, so filePath & fileName may be transformed. !!


#### Example

```ts
new ProjectWatcher(projectSource, {
    watcher: {},
    paths: {
        "**/blocks/*": {
            autoIndex: 'ts',
            excludeIndex: [ '*.scss', '*.scss.d.ts' ],
            newDirTemplate: projectBlockTemplate,
            replace: {
                'COMPONENT_NAME': ({ targetDirName }) => path.basename(targetDirName),
            },
        },
        "**/blocks/*.tsx": {
            newFileTemplate: projectBlockFileTemplate,
            replace: {
                'COMPONENT_NAME': ({ fileName }) => fileName,
            },
        }
    }
});
```

Now when you create new `.tsx` file or new directory in `blocks`,  
Exports will be auto-updated, and in all file `COMPONENT_NAME` will be replaced to file name or directory name.


</details>