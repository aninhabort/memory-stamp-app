import * as ExpoCrypto from 'expo-crypto';

const algoMap: Record<string, ExpoCrypto.CryptoDigestAlgorithm> = {
  'SHA-1':   ExpoCrypto.CryptoDigestAlgorithm.SHA1,
  'SHA-256': ExpoCrypto.CryptoDigestAlgorithm.SHA256,
  'SHA-384': ExpoCrypto.CryptoDigestAlgorithm.SHA384,
  'SHA-512': ExpoCrypto.CryptoDigestAlgorithm.SHA512,
};

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Polyfill crypto.subtle.digest for Supabase PKCE (SHA-256 code challenge).
// The PKCE verifier is always ASCII (base64url), so TextDecoder round-trip is lossless.
if (typeof (global as any).crypto !== 'object') {
  (global as any).crypto = {};
}

if (!(global as any).crypto.getRandomValues) {
  (global as any).crypto.getRandomValues = <T extends ArrayBufferView>(typedArray: T): T =>
    ExpoCrypto.getRandomValues(typedArray as any) as unknown as T;
}

if (!(global as any).crypto.subtle) {
  (global as any).crypto.subtle = {
    digest: async (algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> => {
      const algo = algoMap[algorithm] ?? ExpoCrypto.CryptoDigestAlgorithm.SHA256;
      const str = new TextDecoder().decode(data);
      const hex = await ExpoCrypto.digestStringAsync(algo, str, {
        encoding: ExpoCrypto.CryptoEncoding.HEX,
      });
      return hexToArrayBuffer(hex);
    },
  };
}
