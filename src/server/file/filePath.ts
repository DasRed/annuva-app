import path from 'node:path';
import getConfig from '@/server/config/getConfig';

/**
 * Location of a stored file: data/files/ab/cd/<sha256>. Two levels of sub-directories keep every
 * directory small, even with many files.
 */
export default function filePath(sha256: string): string {
    return path.join(getConfig().dataDir, 'files', sha256.slice(0, 2), sha256.slice(2, 4), sha256);
}
