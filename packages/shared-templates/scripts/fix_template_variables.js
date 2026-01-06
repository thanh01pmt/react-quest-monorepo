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

    // Find all var declarations that need fixing
    // Pattern: var MIN_NAME or var MAX_NAME (without leading/trailing underscores)
    // But NOT already _MIN_NAME_ or _MAX_NAME_

    // Step 1: Fix MIN_ declarations (var MIN_X = ...)
    // Match: MIN_WORD but not _MIN_WORD_ 
    const minDeclRegex = /var\s+(MIN_[A-Z][A-Z0-9_]*)\s*=/g;
    let match;
    const minReplacements = new Map();

    while ((match = minDeclRegex.exec(content)) !== null) {
        const oldName = match[1]; // e.g., MIN_DIST
        if (!oldName.startsWith('_')) {
            const newName = `_${oldName}_`; // e.g., _MIN_DIST_
            minReplacements.set(oldName, newName);
        }
    }

    // Step 2: Fix MAX_ declarations (var MAX_X = ...)
    const maxDeclRegex = /var\s+(MAX_[A-Z][A-Z0-9_]*)\s*=/g;
    const maxReplacements = new Map();

    while ((match = maxDeclRegex.exec(content)) !== null) {
        const oldName = match[1]; // e.g., MAX_DIST
        if (!oldName.startsWith('_')) {
            const newName = `_${oldName}_`; // e.g., _MAX_DIST_
            maxReplacements.set(oldName, newName);
        }
    }

    const allReplacements = new Map([...minReplacements, ...maxReplacements]);

    if (allReplacements.size > 0) {
        console.log(`Fixing ${path.basename(file)}: found ${allReplacements.size} vars to update.`);

        allReplacements.forEach((newName, oldName) => {
            // Replace all occurrences, but be careful not to match partial words
            // Use word boundary \b but account for underscore being part of word
            const usageRegex = new RegExp(`\\b${oldName}\\b`, 'g');
            content = content.replace(usageRegex, newName);
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            fixedCount++;
            console.log(`  -> Updated: ${Array.from(allReplacements.keys()).join(', ')}`);
        }
    }
});

console.log(`\nFixed ${fixedCount} files.`);
