import { WebIO } from '@gltf-transform/core';
import { dedup, prune } from '@gltf-transform/functions';

const io = new WebIO();

export async function compressGLB(file) {
  const arrayBuffer = await file.arrayBuffer();
  const document = await io.readBinary(new Uint8Array(arrayBuffer));

  await document.transform(
    dedup(),
    prune()
  );

  const compressedBuffer = await io.writeBinary(document);
  const compressedBlob = new Blob([compressedBuffer], { type: 'model/gltf-binary' });

  return {
    file: compressedBlob,
    originalSize: file.size,
    compressedSize: compressedBlob.size,
    compressionRatio: ((1 - compressedBlob.size / file.size) * 100).toFixed(1)
  };
}