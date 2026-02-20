
(async () => {
    try {
        const { authenticator } = await import('otplib');
        console.log('Got authenticator singleton? ' + !!authenticator);

        if (authenticator) {
            console.log('authenticator methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(authenticator)));
            console.log('Has keyuri?', typeof authenticator.keyuri === 'function');
            console.log('Has toURI?', typeof authenticator.toURI === 'function');
            console.log('Has verify?', typeof authenticator.verify === 'function');

            // Generate secret
            const secret = authenticator.generateSecret();
            console.log('Secret:', secret);

            // Generate token
            const token = authenticator.generate(secret);
            // Note: authenticator.generate signature might be (secret) or ({secret}) depending on version/class.
            // Authenticator class usually extends OTPLib's logic.
            // Let's try both if one fails.
            console.log('Token generation...');
            let t1;
            try { t1 = authenticator.generate(secret); } catch (e) { console.log('generate(secret) failed:', e.message); }

            if (!t1) {
                try { t1 = await authenticator.generate({ secret }); } catch (e) { console.log('generate({secret}) failed:', e.message); }
            }

            console.log('Token:', t1);

            if (t1) {
                // Verify
                // authenticator.verify({ token, secret }) usually works for singleton
                const valid = await authenticator.verify({ token: t1, secret });
                console.log(`Verify result: ${JSON.stringify(valid)}`);
                console.log(`Verify boolean check: ${valid === true || (valid && valid.valid)}`);
            }
        }

    } catch (e) {
        console.log(e.message);
    }
})();
