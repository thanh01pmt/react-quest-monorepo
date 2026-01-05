/**
 * Practice Generator Service
 * 
 * Generates exercises from templates based on user configuration.
 * Supports deterministic random generation via seed.
 */

import type {
  PracticeConfig,
  TopicConfig,
  TemplateConfig,
  GeneratedExercise,
  PracticeSession,
  DifficultyLevel,
} from '@repo/shared-templates';

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear congruential generator
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2147483648;
    return this.seed / 2147483648;
  }

  // Random integer in range [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Shuffle array in place
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Pick random element
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

// Difficulty level to range mapping
const DIFFICULTY_RANGES: Record<DifficultyLevel, [number, number]> = {
  very_easy: [1, 2],
  easy: [3, 4],
  medium: [5, 6],
  hard: [7, 8],
  very_hard: [9, 10],
};

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Practice Generator class
 */
export class PracticeGenerator {
  private rng: SeededRandom;
  private templates: TemplateConfig[];

  constructor(seed: number, templates: TemplateConfig[]) {
    this.rng = new SeededRandom(seed);
    this.templates = templates;
  }

  /**
   * Generate exercises for a practice session
   */
  generateSession(config: PracticeConfig): PracticeSession {
    const exercises: GeneratedExercise[] = [];

    for (const topicConfig of config.topics) {
      if (!topicConfig.enabled) continue;

      const topicExercises = this.generateForTopic(topicConfig);
      exercises.push(...topicExercises);
    }

    // Shuffle all exercises for variety
    const shuffledExercises = this.rng.shuffle(exercises);

    return {
      id: `session_${Date.now()}`,
      config,
      exercises: shuffledExercises,
      currentIndex: 0,
      results: [],
      startedAt: new Date(),
    };
  }

  /**
   * Generate exercises for a single topic
   */
  private generateForTopic(topicConfig: TopicConfig): GeneratedExercise[] {
    const { category, questionCount, difficultyLevel } = topicConfig;
    const [minDiff, maxDiff] = DIFFICULTY_RANGES[difficultyLevel];

    // Filter templates by category and difficulty
    const matchingTemplates = this.templates.filter(t => 
      t.metadata.category === category &&
      t.metadata.difficulty >= minDiff &&
      t.metadata.difficulty <= maxDiff
    );

    // If no exact matches, relax the difficulty requirement
    const availableTemplates = matchingTemplates.length > 0 
      ? matchingTemplates 
      : this.templates.filter(t => t.metadata.category === category);

    if (availableTemplates.length === 0) {
      console.warn(`[PracticeGenerator] No templates found for category: ${category}`);
      return [];
    }

    const exercises: GeneratedExercise[] = [];

    for (let i = 0; i < questionCount; i++) {
      const template = this.rng.pick(availableTemplates);
      const exercise = this.generateExercise(template);
      exercises.push(exercise);
    }

    return exercises;
  }

  /**
   * Generate a single exercise from a template
   */
  private generateExercise(template: TemplateConfig): GeneratedExercise {
    // Randomize parameters based on template definitions
    const parameters: Record<string, number | boolean | string> = {};

    for (const param of template.parameters) {
      if (param.type === 'number') {
        const min = param.min ?? (param.defaultValue as number) - 2;
        const max = param.max ?? (param.defaultValue as number) + 2;
        parameters[param.name] = this.rng.nextInt(min, max);
      } else if (param.type === 'boolean') {
        parameters[param.name] = this.rng.next() > 0.5;
      } else {
        parameters[param.name] = param.defaultValue;
      }
    }

    // Get primary concept from template
    const primaryConcept = template.metadata.concepts[0] || template.metadata.category;

    return {
      id: generateId(),
      templateId: template.metadata.id,
      concept: primaryConcept,
      difficulty: template.metadata.difficulty,
      parameters,
      mapData: null, // Will be generated when exercise is played
      hints: this.generateHints(template),
    };
  }

  /**
   * Generate hints for an exercise
   */
  private generateHints(template: TemplateConfig): string[] {
    const hints: string[] = [];

    // Hint 1: General category hint
    hints.push(`Bài này thuộc chủ đề: ${template.metadata.category}`);

    // Hint 2: Concept hint
    if (template.metadata.concepts.length > 0) {
      hints.push(`Khái niệm cần dùng: ${template.metadata.concepts.join(', ')}`);
    }

    // Hint 3: Description hint
    if (template.metadata.description) {
      hints.push(template.metadata.description);
    }

    return hints;
  }
}

/**
 * Create a practice generator with given config
 */
export function createPracticeGenerator(
  config: PracticeConfig,
  templates: TemplateConfig[]
): PracticeGenerator {
  const seed = config.seed ?? Date.now();
  return new PracticeGenerator(seed, templates);
}
