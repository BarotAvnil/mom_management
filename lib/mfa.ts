import { TOTP } from 'otplib';
import { createHmac, randomBytes } from 'node:crypto';
import { createCryptoPlugin } from '@otplib/core';
import { base32 } from '@otplib/plugin-base32-scure';

// Create a custom crypto plugin using Node.js native crypto
// This fixes the 'CryptoPluginMissingError' by explicitly providing a working implementation
const nodeCrypto = createCryptoPlugin({
    name: 'node-crypto',
    // @ts-ignore - Buffer is compatible with Uint8Array for our needs
    hmac: (algo, key, message) => {
        return createHmac(algo, key).update(message).digest();
    },
    // @ts-ignore
    randomBytes: (length) => randomBytes(length)
});

// Create a new instance for Google Authenticator compatibility
// Google Authenticator uses SHA1, 30s step, 6 digits (default for TOTP)
const authenticator = new TOTP({
    period: 30,
    digits: 6,
    crypto: nodeCrypto,
    base32: base32
});

export function generateMfaSecret() {
    return authenticator.generateSecret();
}

export function generateMfaQrCode(email: string, secret: string) {
    return authenticator.toURI({
        label: email,
        issuer: 'MOM Management',
        secret
    });
}

export async function verifyMfaToken(token: string, secret: string): Promise<boolean> {
    try {
        const result: any = await authenticator.verify(token, {
            secret,
            epochTolerance: 30 // +/- 1 window of 30s
        });

        // Handle both return types (boolean or VerifyResult object)
        if (typeof result === 'boolean') {
            return result;
        }
        return result?.valid === true;
    } catch (e) {
        console.error("MFA Verify Error", e);
        return false;
    }
}
