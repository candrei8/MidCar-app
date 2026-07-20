// Escribe public/version.txt con el commit desplegado para poder verificar
// desde fuera (curl https://midcar-crm.netlify.app/version.txt) que un deploy
// concreto está vivo. En Netlify el commit llega en COMMIT_REF; en local se
// resuelve con git.
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let commit = process.env.COMMIT_REF || '';
if (!commit) {
    try {
        commit = execSync('git rev-parse HEAD', { cwd: root }).toString().trim();
    } catch {
        commit = 'unknown';
    }
}

const dest = join(root, 'public', 'version.txt');
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, `${commit}\n`);
console.log(`[write-version] public/version.txt → ${commit.slice(0, 12)}`);
