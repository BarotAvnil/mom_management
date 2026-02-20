
(async () => {
    try {
        const { authenticator } = await import('otplib');
        console.log('Got authenticator singleton? ' + !!authenticator);

        if (authenticator) {
            console.log('Has toURI?', typeof authenticator.toURI === 'function');
            console.log('Has keyuri?', typeof authenticator.keyuri === 'function');

            // Generate secret
            const secret = authenticator.generateSecret();
            console.log('Secret:', secret);

            // Generate token
            const token = authenticator.generate(secret);
            console.log('Token:', token);

            // Verify
            // authenticator (singleton) usually takes object options
            try {
                const valid = authenticator.verify({ token, secret });
                console.log(`Verify({token, secret}): ${valid}`);
            } catch (e) { console.log('Verify({token, secret}) error:', e.message); }

            try {
                const valid2 = authenticator.verify(token, secret);
                console.log(`Verify(token, secret): ${valid2}`);
            } catch (e) { console.log('Verify(token, secret) error:', e.message); }

        }

    } catch (e) {
        console.log(e.message);
    }
})();
