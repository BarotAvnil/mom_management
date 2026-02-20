const { TOTP } = require('otplib');
const { NobleCryptoPlugin } = require('@otplib/plugin-crypto-noble');

console.log('NobleCryptoPlugin is:', NobleCryptoPlugin);

try {
    const crypto = new NobleCryptoPlugin();
    console.log('Crypto plugin instance created');

    const totp = new TOTP({
        period: 30,
        digits: 6,
        crypto: crypto
    });

    console.log('TOTP instance created with explicit crypto');

    const secret = totp.generateSecret();
    console.log('Generated Secret:', secret);

    const token = totp.generate({ secret });
    console.log('Generated Token:', token);

    const isValid = totp.verify({ token, secret });
    console.log('Verification Result:', isValid);

} catch (e) {
    console.error('Error in debug_noble:', e);
}
