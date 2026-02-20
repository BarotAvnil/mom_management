
const otplib = require('otplib');
console.log('otplib exports:', Object.keys(otplib));
if (otplib.verify) {
    console.log('otplib.verify is a:', typeof otplib.verify);
} else {
    console.log('otplib.verify is UNDEFINED');
}

if (otplib.authenticator) {
    console.log('otplib.authenticator exists');
    console.log('otplib.authenticator exports:', Object.keys(otplib.authenticator));
}
