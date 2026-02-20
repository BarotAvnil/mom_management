
try {
    const otplib = require('otplib');
    console.log('Exports:', Object.keys(otplib));

    if (otplib.Authenticator) {
        console.log('Authenticator class found');
        const instance = new otplib.Authenticator();
        console.log('Authenticator instance has keyuri:', typeof instance.keyuri === 'function');
    } else {
        console.log('Authenticator class NOT found in exports');
    }

    if (otplib.TOTP) {
        console.log('TOTP class found');
        const instance = new otplib.TOTP();
        console.log('TOTP instance has keyuri:', typeof instance.keyuri === 'function');
    }

} catch (e) {
    console.error(e);
}
