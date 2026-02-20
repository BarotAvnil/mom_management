
const { TOTP } = require('otplib');

const instance = new TOTP({
    step: 30,
    digits: 6,
    window: 1
});

console.log('TOTP Instance Direct Keys:', Object.keys(instance));
console.log('TOTP Prototype Keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));

const secret = instance.generateSecret();
const token = instance.generate(secret);

console.log('Generated token:', token);

// Check methods
if (instance.check) console.log('check() exists');
if (instance.verify) console.log('verify() exists');

// Verify token using verify()
try {
    const isValid = instance.verify({ token, secret });
    console.log('verify({ token, secret }) result:', isValid);
} catch (e) {
    console.log('verify({ token, secret }) failed:', e.message);
}

// Verify token using check()
try {
    if (instance.check) {
        const isValid = instance.check(token, secret);
        console.log('check(token, secret) result:', isValid);
    }
} catch (e) {
    console.log('check(token, secret) failed:', e.message);
}
