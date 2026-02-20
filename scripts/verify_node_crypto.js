const { TOTP } = require('otplib');
const { createCryptoPlugin } = require('@otplib/core');
const { createHmac, randomBytes } = require('node:crypto');

console.log('Testing custom Node Crypto plugin...');

try {
    const nodeCrypto = createCryptoPlugin({
        name: 'node-crypto',
        hmac: (algo, key, message) => {
            return createHmac(algo, key).update(message).digest();
        },
        randomBytes: (length) => randomBytes(length)
    });

    console.log('Custom crypto plugin created');

    const totp = new TOTP({
        period: 30,
        digits: 6,
        crypto: nodeCrypto
    });

    console.log('TOTP instance created with custom crypto');

    // Test generation
    const secret = totp.generateSecret();
    console.log('Secret:', secret);

    const token = totp.generate({ secret }); // async by default!
    // generate returns Promise if not using sync
    // Wait, generate() is async in v13? 
    // TOTP class has generate() returning Promise<string>.
    // generateSync() returns string.

    token.then(t => {
        console.log('Token (async):', t);

        // Test verify matches
        totp.verify({ token: t, secret }).then(isValid => {
            console.log('Verify Result (async):', isValid);
        });
    });

    // Test Sync
    const tokenSync = totp.generateSync({ secret });
    console.log('Token (sync):', tokenSync);

    // Verify does NOT have verifySync on the instance??
    // TOTP class has verifySync? 
    // Types say yes: verifySync(options).

    // But verify() returns Promise<VerifyResult>
    // My previous fix in lib/mfa.ts uses `await verify`.

} catch (e) {
    console.error('Error:', e);
}
