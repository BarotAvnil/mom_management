
const otplib = require('otplib');
console.log('otplib keys:', Object.keys(otplib));
console.log('otplib.authenticator:', otplib.authenticator);
console.log('otplib.totp:', otplib.totp);
console.log('otplib.default:', otplib.default);

try {
    const { authenticator } = require('otplib');
    console.log('Destructured authenticator:', authenticator);
} catch (e) {
    console.log('Destructure failed:', e.message);
}
