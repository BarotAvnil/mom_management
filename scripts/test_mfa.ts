
const { generateMfaSecret, verifyMfaToken } = require('../lib/mfa');

async function testMfa() {
    console.log('Testing MFA Validation Logic...');

    // 1. Generate a secret
    const secret = generateMfaSecret();
    console.log('Generated Secret:', secret);

    // 2. Test with a clearly wrong token
    const wrongToken = '000000';
    console.log(`Testing with wrong token "${wrongToken}"...`);

    try {
        const isValid = verifyMfaToken(wrongToken, secret);
        console.log(`Result for wrong token: ${isValid}`);

        if (isValid) {
            console.error('CRITICAL FAILURE: Wrong token was accepted!');
        } else {
            console.log('SUCCESS: Wrong token was rejected.');
        }
    } catch (error) {
        console.error('Error during verification:', error);
    }

    // 3. Test with a potentially valid-format but random token
    const randomToken = '123456';
    console.log(`Testing with random token "${randomToken}"...`);
    const isValidRandom = verifyMfaToken(randomToken, secret);
    console.log(`Result for random token: ${isValidRandom}`);
}

testMfa();
