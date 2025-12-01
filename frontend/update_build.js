import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFilePath = path.join(__dirname, 'src', 'version.json');

try {
    const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));

    // Update build date
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    versionData.buildDate = now.toLocaleDateString('en-US', options);

    // Generate Build ID from timestamp (YYYYMMDD-HHMM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    versionData.buildNumber = `${year}${month}${day}-${hour}${minute}`;

    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));

    console.log(`Build updated: v${versionData.version} (Build ${versionData.buildNumber}) - ${versionData.buildDate}`);
} catch (error) {
    console.error('Error updating build version:', error);
}
