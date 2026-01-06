import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// Helper function definition to add
const TURN_AROUND_FUNC = `// Helper function
function turnAround() {
  turnRight();
  turnRight();
}

`;

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.md')) {
            arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
}

const files = getAllFiles(TEMPLATES_DIR);
let fixedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');

    // Check if uses turnAround() but doesn't define it
    if (content.includes('turnAround()') && !content.includes('function turnAround()')) {
        console.log(`Fixing ${path.basename(file)}: adding turnAround() function`);

        // Find the // Solution line and insert before it
        const solutionMatch = content.match(/\/\/ Solution\n/);
        if (solutionMatch) {
            content = content.replace(/\/\/ Solution\n/, TURN_AROUND_FUNC + '// Solution\n');
            fs.writeFileSync(file, content);
            fixedCount++;
        }
    }
});

console.log(`\nFixed ${fixedCount} files.`);
