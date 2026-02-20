
import { authenticator } from 'otplib';

try {
    console.log('Test Import:', authenticator);
    if (authenticator) {
        authenticator.options = { step: 30, window: 1 };
        console.log('Secret:', authenticator.generateSecret());
    }
} catch (e) {
    console.error('Import failed:', e);
}

// Check default
import otplib from 'otplib';
console.log('Default Import:', otplib);
