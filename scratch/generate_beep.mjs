import fs from 'fs';

function createBeepWav() {
    const sampleRate = 44100;
    const duration = 0.5; // seconds
    const frequency = 440; // Hz (A4)
    const numSamples = sampleRate * duration;
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // chunk size
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
    buffer.writeUInt16LE(2, 32); // block align
    buffer.writeUInt16LE(16, 34); // bits per sample

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    for (let i = 0; i < numSamples; i++) {
        const value = Math.sin(2 * Math.PI * frequency * i / sampleRate);
        buffer.writeInt16LE(value * 32767, 44 + i * 2);
    }

    return buffer;
}

const wavBuffer = createBeepWav();
fs.writeFileSync('public/sounds/notification.mp3', wavBuffer); // Save as .mp3 even if it's WAV, browsers handle it or we rename
console.log('Generated a 0.5s beep at public/sounds/notification.mp3 (WAV format)');
