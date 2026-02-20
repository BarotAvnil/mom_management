
try {
    const otplibClass = require('otplib/class'); // Trying to require via package name if node resolves it, or path
    // Since we are in the project root, require('otplib/class') should use package.json exports if using modern node, but let's see.
    // If that fails, we might need to point to dist/class.js directly if commonjs doesn't respect exports map without type:module or similar, though usually it does.

    console.log('otplib/class exports:', Object.keys(otplibClass));

    if (otplibClass.Authenticator) {
        console.log('Authenticator class found in otplib/class');
    } else {
        console.log('Authenticator class NOT found in otplib/class');
    }

} catch (e) {
    console.error('Error requiring otplib/class:', e.message);
    // Fallback: try loading the file directly if we can guess the path
    try {
        const path = require('path');
        const directPath = path.resolve('node_modules/otplib/dist/class.cjs');
        const otplibClassDirect = require(directPath);
        console.log('Direct load exports:', Object.keys(otplibClassDirect));
    } catch (e2) {
        console.error('Direct load failed:', e2.message);
    }
}
