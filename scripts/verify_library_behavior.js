const { TOTP, verifySync, generateSecret } = require('otplib');

console.log('Verifying otplib verifySync behavior...');

// 1. Setup
const secret = generateSecret();
console.log('Secret:', secret);

// Create TOTP instance with defaults (same as lib/mfa.ts)
const totp = new TOTP({
    period: 30,
    digits: 6
});

// 2. Generate Token
const token = totp.generate({ secret });
console.log('Token:', token);

// 3. Verify using verifySync (as implemented in fix)
console.log('Testing verifySync with valid token...');
try {
    const result = verifySync({
        token,
        secret,
        epochTolerance: 30 // lib/mfa.ts uses this
    });

    console.log('verifySync Result:', result);

    if (result && result.valid === true) {
        console.log('✅ SUCCESS: verifySync correctly validated the token.');
    } else {
        console.error('❌ FAILURE: verifySync failed to validate the token.');
        console.log('Result details:', JSON.stringify(result, null, 2));
    }

} catch (e) {
    console.error('❌ ERROR during verifySync:', e);
}

// 4. Verify Invalid Token
console.log('Testing verifySync with invalid token...');
try {
    const invalidToken = '000000';
    const resultInvalid = verifySync({
        token: invalidToken,
        secret,
        epochTolerance: 30
    });

    console.log('verifySync Invalid Result:', resultInvalid);

    if (resultInvalid && resultInvalid.valid === false) {
        console.log('✅ SUCCESS: verifySync correctly rejected index invalid token.');
    } else {
        console.error('❌ FAILURE: verifySync accepted invalid token!');
    }
} catch (e) {
    console.error('❌ ERROR during verifySync invalid:', e);
}
