
(async () => {
    try {
        const { TOTP } = await import('otplib');
        const totp = new TOTP({ period: 30, digits: 6 });
        const secret = totp.generateSecret();
        const token = await totp.generate({ secret });

        console.log('Testing verify(token, {secret})...');
        try {
            const res = await totp.verify(token, { secret });
            console.log(`v13 verify: ${res && res.valid}`);
        } catch (e) { console.log(`v13 error: ${e.message}`); }

        console.log('Testing verify({token, secret})...');
        try {
            const res2 = await totp.verify({ token, secret });
            console.log(`v12 verify: ${res2 && res2.valid}`);
        } catch (e) { console.log(`v12 error: ${e.message}`); }

    } catch (e) {
        console.log(e.message);
    }
})();
