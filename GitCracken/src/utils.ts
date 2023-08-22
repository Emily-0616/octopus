import { PassThrough } from 'stream';

export function reverseBuffer (buffer: any) {
  const reversedBuffer = Buffer.alloc(buffer.length);
  for (let i = 0, j = buffer.length - 1; i < buffer.length; ++i, --j) {
    reversedBuffer[i] = buffer[j];
  }
  return reversedBuffer;
};

export function pipeBuffer (pipeTarget: any, buffer: any) {
  const bufferStream = new PassThrough();
  bufferStream.end(buffer);
  bufferStream.pipe(pipeTarget);
};

// export default {
//   pipeBuffer,
//   reverseBuffer
// };