
import * as otplib from 'otplib';

console.log('--- MFA Test Start (ESM Debug) ---');
console.log('otplib keys:', Object.keys(otplib));
console.log('otplib default keys:', otplib.default ? Object.keys(otplib.default) : 'No default');

try {
    const TOTP = otplib.TOTP || (otplib.default && otplib.default.TOTP);

    if (!TOTP) {
        throw new Error('TOTP class not found in exports');
    }

    console.log('TOTP found. Creating instance...');

    // 1. Setup
    const authenticator = new TOTP({
        period: 30,
        digits: 6
    });

    // 2. Generate Secret
    const secret = authenticator.generateSecret();
    console.log('Generated Secret:', secret);

    // 3. Generate Token (simulating App)
    console.log('Generating token...');
    // wait, generate might be async in v13? index.d.ts said generate returns Promise<string>
    const token = await authenticator.generate({ secret });
    console.log('Generated Token (current time):', token);

    // 4. Verify
    console.log('Verifying...');

    const result = await authenticator.verify(token, {
        secret,
        epochTolerance: 30
    });

    console.log('Result:', result);
    console.log('Is valid?', result?.valid);

} catch (e) {
    console.error('Test Error:', e);
}

console.log('--- MFA Test End (ESM Debug) ---');
