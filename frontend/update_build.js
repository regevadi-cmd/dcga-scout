import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFilePath = path.join(__dirname, 'src', 'version.json');

try {
    const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));

    // Increment build number
    versionData.buildNumber = (versionData.buildNumber || 0) + 1;

    // Update build date
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    versionData.buildDate = now.toLocaleDateString('en-US', options);

    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));

    console.log(`Build updated: v${versionData.version} (Build ${versionData.buildNumber}) - ${versionData.buildDate}`);
} catch (error) {
    console.error('Error updating build version:', error);
}
