
const otplib = require('otplib');

// Simulate what lib/mfa.ts is doing
const { verify, generateSecret, authenticator } = otplib;

console.log('Type of verify:', typeof verify);
if (typeof verify === 'function') {
    const secret = authenticator.generateSecret();
    const token = authenticator.generate(secret);
    const split = secret.split('');
    const invalidToken = '000000';

    console.log('Secret:', secret);
    console.log('Valid Token:', token);

    // Testing verify function
    try {
        const resultValid = verify({ token, secret, algorithm: 'SHA1', digits: 6, period: 30 });
        console.log('verify(valid) result:', resultValid);

        const resultInvalid = verify({ token: invalidToken, secret, algorithm: 'SHA1', digits: 6, period: 30 });
        console.log('verify(invalid) result:', resultInvalid);
    } catch (e) {
        console.log('verify threw error:', e.message);
    }
} else {
    console.log('verify is not a function on otplib export');
}
