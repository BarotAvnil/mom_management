const { TOTP } = require('otplib');
const { createCryptoPlugin } = require('@otplib/core');
const { createHmac, randomBytes } = require('node:crypto');
const { base32 } = require('@otplib/plugin-base32-scure');

console.log('Testing Base32 plugin integration...');

try {
    // Custom Crypto from previous step
    const nodeCrypto = createCryptoPlugin({
        name: 'node-crypto',
        hmac: (algo, key, message) => {
            return createHmac(algo, key).update(message).digest();
        },
        randomBytes: (length) => randomBytes(length)
    });

    console.log('Crypto plugin created');
    console.log('Base32 plugin:', base32);

    const totp = new TOTP({
        period: 30,
        digits: 6,
        crypto: nodeCrypto,
        base32: base32 // Explicitly pass base32 plugin
    });

    console.log('TOTP instance created with crypto and base32');

    // Test generation (requires crypto + base32 for secret encoding/decoding)
    const secret = totp.generateSecret();
    console.log('Secret:', secret);

    // Generate token
    totp.generate({ secret }).then(token => {
        console.log('Token:', token);

        // Verify
        totp.verify({ token, secret }).then(isValid => {
            console.log('Verify Result:', isValid);

            if (isValid && isValid.valid) {
                console.log('✅ SUCCESS: Full TOTP flow working with explicit plugins.');
            } else {
                console.error('❌ FAILURE: Verification failed.');
            }
        });
    });

} catch (e) {
    console.error('Error:', e);
}
