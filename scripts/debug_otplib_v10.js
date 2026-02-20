const { TOTP } = require('otplib');

const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
const authenticator = new TOTP({
    period: 30,
    digits: 6
});

const token = authenticator.generate(secret);
console.log('Secret:', secret);
console.log('Token:', token);

try {
    const resultDetails = authenticator.verify({ token, secret });
    console.log('verify({ token, secret }):', resultDetails);
} catch (e) {
    console.error('verify({ token, secret }) failed:', e.message);
}

try {
    const resultArgs = authenticator.verify(token, secret);
    console.log('verify(token, secret):', resultArgs);
} catch (e) {
    console.error('verify(token, secret) failed:', e.message);
}

console.log('TOTP prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(authenticator)));
