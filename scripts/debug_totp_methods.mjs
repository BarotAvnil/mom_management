
import { TOTP } from 'otplib';

console.log('TOTP imported:', TOTP);

try {
    const instance = new TOTP({
        step: 30,
        digits: 6,
        window: 1
    });

    console.log('Instance created');
    console.log('Instance keys:', Object.keys(instance));
    console.log('Prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));

    const secret = instance.generateSecret();
    const token = instance.generate(secret);
    console.log('Detailed Token:', token);

    if (instance.check) console.log('Has check()');
    if (instance.verify) console.log('Has verify()');

} catch (e) {
    console.error('Error:', e);
}
