export const isDebug =
    process.env.NODE_ENV === 'debug';

export const isDev =
    isDebug ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'dev';

if (isDev) {
    console.log('project-watch: dev mode');
}

if (isDebug) {
    console.log('project-watch: debug mode');
}
