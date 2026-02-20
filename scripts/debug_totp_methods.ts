// @ts-nocheck
import { TOTP } from 'otplib';

const instance = new TOTP({
    // @ts-ignore
    step: 30,
    digits: 6,
    window: 1
});

console.log('TOTP Instance Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
console.log('TOTP Instance Keys:', Object.keys(instance));

// Test verify
try {
    const secret = instance.generateSecret();
    const token = instance.generate(secret);
    console.log('Generated:', token);

    // Check if verify exists and how it works
    if (typeof instance.check === 'function') {
        console.log('check() exists');
    } else {
        console.log('check() does NOT exist');
    }

    if (typeof instance.verify === 'function') {
        console.log('verify() exists');
        // Try verifying
        const isValid = instance.verify({ token, secret });
        console.log('verify() result:', isValid);
    }
} catch (e) {
    console.error('Error:', e);
}
