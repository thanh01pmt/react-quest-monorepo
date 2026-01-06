import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

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
    let originalContent = content;

    // Regex for var _NAME_ = ...
    // We want to revert _NAME_ to NAME
    const varDeclRegex = /var\s+_([A-Z][A-Z0-9_]*)_\s*=/g;
    let match;
    const replacements = new Map();

    while ((match = varDeclRegex.exec(content)) !== null) {
        const cleanName = match[1];
        // Revert: _NAME_ -> NAME
        const oldName = `_${cleanName}_`;
        replacements.set(oldName, cleanName);
    }

    if (replacements.size > 0) {
        console.log(`Reverting ${path.basename(file)}: found ${replacements.size} vars to restore.`);

        replacements.forEach((newName, oldName) => {
            const usageRegex = new RegExp(`\\b${oldName}\\b`, 'g');
            content = content.replace(usageRegex, newName);
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            fixedCount++;
        }
    }
});

console.log(`Fixed ${fixedCount} files.`);
