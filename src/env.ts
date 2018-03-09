export const isDebug =
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'dev' ||
    process.env.NODE_ENV === 'debug';

if (isDebug) {
    console.log('debug mode');
}