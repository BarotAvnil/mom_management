
const { TOTP } = require('otplib');

async function testMfa() {
    console.log('--- MFA Test Start ---');

    // 1. Setup
    const authenticator = new TOTP({
        period: 30,
        digits: 6,
        // window: 1 // otplib v13 uses epochTolerance in verify options, or step/window in options? 
        // Let's check what my code does.
    });

    // 2. Generate Secret
    const secret = authenticator.generateSecret();
    console.log('Generated Secret:', secret);

    // 3. Generate Token (simulating App)
    const token = authenticator.generate({ secret });
    console.log('Generated Token (current time):', token);

    // 4. Verify (simulating Server)
    // Replicating verifyMfaToken logic from lib/mfa.ts
    try {
        console.log('Verifying...');
        const isValidObject = await authenticator.verify({ token, secret });
        // NOTE: In the actual code I used: await authenticator.verify(token, { secret, epochTolerance: 30 })
        // Let's test THAT signature because that's what I put in verifyMfaToken.

        console.log('Result using verify({ token, secret }):', isValidObject);

        // Test the signature I put in the code:
        // verify(token: string, options)
        try {
            const result2 = await authenticator.verify({ token, secret: secret });
            console.log('Result using verify({token, secret}):', result2);
        } catch (e) {
            console.log('verify({token, secret}) threw:', e.message);
        }

    } catch (e) {
        console.error('Verification Error:', e);
    }

    console.log('--- MFA Test End ---');
}

testMfa();
