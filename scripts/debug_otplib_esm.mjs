import { TOTP } from 'otplib';

// Create instance exactly like in lib/mfa.ts
const authenticator = new TOTP({
    period: 30,
    digits: 6
});

const secret = authenticator.generateSecret();
const token = await authenticator.generate({ secret });

console.log('Secret:', secret);
console.log('Token:', token);

// Test 1: verify(token, { secret }) - as in original code
try {
    const result = await authenticator.verify(token, { secret, epochTolerance: 30 });
    console.log('Use verify(token, options):', result);
    console.log('Type of result:', typeof result);
    if (typeof result === 'object') {
        console.log('result.valid:', result.valid);
    }
} catch (e) {
    console.error('verify(token, options) failed:', e);
}

// Test 2: verify({ token, secret }) - as proposed fix
try {
    // @ts-ignore
    const result2 = await authenticator.verify({ token, secret });
    console.log('Use verify({ token, secret }):', result2);
} catch (e) {
    console.error('verify({ token, secret }) failed:', e);
}

// Test 3: verify with INVALID token
try {
    const invalidToken = '000000';
    const result3 = await authenticator.verify(invalidToken, { secret });
    console.log('Use verify(invalidToken, options):', result3);
} catch (e) {
    console.error('verify(invalidToken) failed:', e);
}
