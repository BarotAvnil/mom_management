
import { authenticator, totp } from 'otplib';

// Replicating the logic from lib/mfa.ts
// In lib/mfa.ts: import { generateSecret, generateURI, verify } from 'otplib';

// Let's see what verify actually does when imported from 'otplib'
// Since we can't easily see the internal structure of the library in runtime without running it,
// we will assume the User's claim is true and try to verify it.

// Note: In typical otplib usage, one uses `authenticator.check(token, secret)` for Google Authenticator.
// `verify` might be lower level.

const secret = authenticator.generateSecret();
console.log('Secret:', secret);

const token1 = authenticator.generate(secret);
console.log('Valid Token:', token1);

const invalidToken = '000000';
console.log('Invalid Token:', invalidToken);

// Test 1: Using authenticator (The standard way)
try {
    const isValidAuth = authenticator.check(token1, secret);
    console.log(`authenticator.check(valid): ${isValidAuth}`);

    const isValidAuthInvalid = authenticator.check(invalidToken, secret);
    console.log(`authenticator.check(invalid): ${isValidAuthInvalid}`);
} catch (e) {
    console.log('Error with authenticator:', e);
}

// Test 2: Using the logic from lib/mfa.ts
// We need to verify what 'verify' imported from 'otplib' actually IS.
// Based on otplib docs, `import { verify } from 'otplib'` is NOT the standard way.
// It is usually `import { authenticator } from 'otplib'` or `import { totp } from 'otplib'`.
// If `verify` is exported, it might be an alias or the underlying function.

// Let's try to verify if the previous implementation was flawed.
try {
    // Simulating the function in lib/mfa.ts
    // We can't import 'verify' easily if it's not a named export we recognize, 
    // but we can try to use totp.verify which signature matches.

    const isValidTotp = totp.verify({
        token: token1,
        secret: secret,
        algorithm: 'SHA1',
        digits: 6,
        period: 30
    });
    console.log(`totp.verify(valid): ${isValidTotp}`);

    const isValidTotpInvalid = totp.verify({
        token: invalidToken,
        secret: secret,
        algorithm: 'SHA1',
        digits: 6,
        period: 30
    });
    console.log(`totp.verify(invalid): ${isValidTotpInvalid}`);

    if (isValidTotpInvalid) {
        console.error('FAILURE: totp.verify accepted invalid token!');
    }
} catch (e) {
    console.log('Error with totp.verify:', e);
}
