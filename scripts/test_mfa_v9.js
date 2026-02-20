
(async () => {
    try {
        const { TOTP, NobleCryptoPlugin, ScureBase32Plugin } = await import('otplib');

        console.log('Plugins loaded.');

        const authenticator = new TOTP({
            period: 30,
            digits: 6,
            crypto: new NobleCryptoPlugin(),
            base32: new ScureBase32Plugin()
        });

        // Generate Secret
        const secret = authenticator.generateSecret();
        console.log('Secret:', secret);

        // Generate Token
        const token = await authenticator.generate({ secret });
        console.log('Token:', token);

        // Verify
        try {
            // verify(token, options)
            const result = await authenticator.verify(token, {
                secret,
                epochTolerance: 30
            });
            console.log(`Verify result: ${JSON.stringify(result)}`);
            console.log(`Is Valid: ${result && result.valid}`);
        } catch (e) {
            console.log('Verify error:', e.message);
        }

    } catch (e) {
        console.log('Fatal:', e);
    }
})();
