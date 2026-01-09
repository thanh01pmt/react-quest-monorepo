
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');
const OUTPUT_FILE = path.resolve(__dirname, '../src/bundled-templates.ts');

function extractParameters(code) {
    const rawParams = new Map();
    const regex = /(?:var|const|let)\s+(_[A-Z0-9_]+_)\s*=\s*(random\s*\(\s*[^)]+\s*\)|\d+|true|false|"[^"]*"|'[^']*');?/g;

    let match;
    while ((match = regex.exec(code)) !== null) {
        const name = match[1];
        const rawValue = match[2];

        let type = 'number';
        let defaultValue;
        let min;
        let max;
        let minRef;
        let maxRef;

        if (rawValue.startsWith('random')) {
            const randomMatch = rawValue.match(/random\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
            if (randomMatch) {
                const arg1 = randomMatch[1].trim();
                const arg2 = randomMatch[2].trim();

                type = 'int';

                // Check if args are numbers or references
                if (/^\d+$/.test(arg1)) {
                    min = parseInt(arg1, 10);
                } else {
                    minRef = arg1;
                }

                if (/^\d+$/.test(arg2)) {
                    max = parseInt(arg2, 10);
                } else {
                    maxRef = arg2;
                }

                if (min !== undefined) defaultValue = min;
            }
        } else if (rawValue === 'true' || rawValue === 'false') {
            type = 'boolean';
            defaultValue = rawValue === 'true';
        } else if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
            type = 'string';
            defaultValue = rawValue.slice(1, -1);
        } else {
            type = 'number';
            defaultValue = parseInt(rawValue, 10);
        }

        const config = {
            name,
            type,
            defaultValue
        };

        if (min !== undefined) config.min = min;
        if (max !== undefined) config.max = max;
        if (minRef !== undefined) config.minRef = minRef;
        if (maxRef !== undefined) config.maxRef = maxRef;

        rawParams.set(name, config);
    }

    // Process params
    const params = [];

    for (const [name, config] of rawParams.entries()) {
        const displayName = name
            .replace(/^_/, '')
            .replace(/_$/, '')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        const param = {
            name,
            displayName,
            type: config.type,
            defaultValue: config.defaultValue,
        };

        if (config.min !== undefined) param.min = config.min;
        if (config.max !== undefined) param.max = config.max;
        if (config.minRef !== undefined) param.minRef = config.minRef;
        if (config.maxRef !== undefined) param.maxRef = config.maxRef;

        // If this param mimics another (minRef/maxRef), maybe hide it? 
        // Or keep it visible? User wants Min/Max visible.
        // The one using random(_MIN_, _MAX_) is the one computed.
        // User didn't show computed one in text, but likely accepts it being hidden or visible-readonly.
        // For now, emit everything.

        params.push(param);
    }

    return params;
}

function extractCodeBlocks(content) {
    const codeBlockRegex = /```(?:js|javascript)\n([\s\S]*?)```/g;
    const blocks = [];

    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        blocks.push(match[1].trim());
    }

    if (blocks.length >= 2) {
        return {
            parameterCode: blocks[0],
            solutionCode: blocks[1],
        };
    } else if (blocks.length === 1) {
        return {
            parameterCode: blocks[0],
            solutionCode: blocks[0],
        };
    }

    return {
        parameterCode: '',
        solutionCode: '',
    };
}

/**
 * Extract hints from template markdown content
 * Parses title (# heading), description paragraph, and Academic Concept/Learning Goals section
 */
function extractHints(markdownContent) {
    const hints = {
        title: '',
        description: '',
        learningGoals: undefined,  // Standardized field name
        goalDetails: []            // Bullet points from the section
    };

    // Remove code blocks first
    const contentWithoutCode = markdownContent.replace(/```[\s\S]*?```/g, '');

    // Extract title (first # heading)
    const titleMatch = contentWithoutCode.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        hints.title = titleMatch[1].trim();
    }

    // Extract description (paragraph after title, before next ## heading)
    const descMatch = contentWithoutCode.match(/^#\s+.+\n\n([\s\S]*?)(?=\n##|\n$)/m);
    if (descMatch) {
        hints.description = descMatch[1].trim();
    }

    // Try to extract "Academic Concept" section first
    let goalMatch = contentWithoutCode.match(/##\s+Academic\s+Concept[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##|\n$)/i);

    // If not found, try "Learning Goals"
    if (!goalMatch) {
        goalMatch = contentWithoutCode.match(/##\s+Learning\s+Goals?[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##|\n$)/i);
    }

    // If still not found, try "Learning Objective"
    if (!goalMatch) {
        goalMatch = contentWithoutCode.match(/##\s+Learning\s+Objectives?[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##|\n$)/i);
    }

    if (goalMatch) {
        hints.learningGoals = goalMatch[1].trim() || undefined;

        // Extract bullet points
        const bullets = goalMatch[2].match(/^[-*]\s+(.+)$/gm);
        if (bullets) {
            hints.goalDetails = bullets.map(b => b.replace(/^[-*]\s+/, '').trim());
        }

        // If no inline title but has bullets, use first bullet as title
        if (!hints.learningGoals && hints.goalDetails.length > 0) {
            hints.learningGoals = hints.goalDetails[0];
            hints.goalDetails = hints.goalDetails.slice(1);
        }
    }

    return hints;
}

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

function generate() {
    console.log('Generating bundled templates...');

    if (!fs.existsSync(TEMPLATES_DIR)) {
        console.error(`Templates directory not found: ${TEMPLATES_DIR}`);
        process.exit(1);
    }

    const files = getAllFiles(TEMPLATES_DIR);
    console.log(`Found ${files.length} template files.`);

    const templates = [];

    for (const file of files) {
        const rawContent = fs.readFileSync(file, 'utf-8');
        const { data, content } = matter(rawContent);

        const { solutionCode, parameterCode } = extractCodeBlocks(content);
        const parameters = extractParameters(parameterCode || solutionCode);
        const descriptionMarkdown = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/##\s*Parameters[\s\S]*?(?=##|$)/i, '')
            .replace(/##\s*Solution Code[\s\S]*?(?=##|$)/i, '')
            .trim();

        const templateConfig = {
            metadata: {
                id: data.id || 'unknown',
                name: data.name || 'Untitled Template',
                category: data.category || 'sequential',
                concepts: data.concepts || [data.category || 'sequential'],
                difficulty: typeof data.difficulty === 'number' ? data.difficulty : 5,
                tags: Array.isArray(data.tags) ? data.tags : [],
                author: data.author || 'system',
                version: typeof data.version === 'number' ? data.version : 1,
                description: data.description,
            },
            parameters,
            solutionCode,
            descriptionMarkdown,
            rawContent,
            hints: extractHints(content)
        };

        templates.push(templateConfig);
    }

    const outputContent = `/**
 * Auto-generated file. Do not edit directly.
 * Generated from templates/*.md
 */
import type { TemplateConfig } from './types';

export const BUNDLED_TEMPLATES: TemplateConfig[] = ${JSON.stringify(templates, null, 2)};
`;

    fs.writeFileSync(OUTPUT_FILE, outputContent);
    console.log(`Wrote ${files.length} templates to ${OUTPUT_FILE}`);
}

generate();
