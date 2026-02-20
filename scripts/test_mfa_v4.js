
(async () => {
    try {
        console.log('Loading otplib...');
        const otplib = await import('otplib');
        console.log('Loaded otplib keys:', Object.keys(otplib));

        const TOTP = otplib.TOTP;
        if (!TOTP) throw new Error('TOTP missing');

        const totp = new TOTP({ period: 30, digits: 6 });
        const secret = totp.generateSecret();
        console.log(`Secret: ${secret}`);

        const token = await totp.generate({ secret });
        console.log(`Token: ${token}`);

        // Test 1: verify(token, options) - This assumes class signature
        try {
            const result = await totp.verify(token, { secret });
            console.log('Verify(token, {secret}) result:', JSON.stringify(result));
        } catch (e) {
            console.log('Verify(token, {secret}) error:', e.message);
        }

        // Test 2: verify({ token, secret }) - This assumes functional signature or older API
        try {
            const result = await totp.verify({ token, secret });
            console.log('Verify({token, secret}) result:', JSON.stringify(result));
        } catch (e) {
            console.log('Verify({token, secret}) error:', e.message);
        }

    } catch (e) {
        console.error('Fatal Error:', e);
    }
})();
