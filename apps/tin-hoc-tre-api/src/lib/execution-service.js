/**
 * apps/tin-hoc-tre-api/src/lib/execution-service.js
 * 
 * Provides basic isolation and execution for JavaScript and Python tasks.
 * Measures execution time and captures standard output.
 */

'use strict';

const { Worker } = require('worker_threads');
const { spawn } = require('child_process');
const path = require('path');

const DEFAULT_TIME_LIMIT   = parseInt(process.env.JUDGE_TIME_LIMIT_MS || '2000');
const DEFAULT_MEMORY_LIMIT = parseInt(process.env.JUDGE_MEMORY_MB     || '256');

class ExecutionService {
  /**
   * Execute code using Piston API (Python, C, C++, etc.)
   */
  static async executeWithPiston(language, code, stdin = '', timeoutMs = DEFAULT_TIME_LIMIT) {
    const PISTON_URL = process.env.PISTON_URL || 'https://piston.orchable.xyz/api/v2';
    const start = Date.now();
    
    // Map languages to Piston identifiers and versions
    const languageMap = {
      'python': { language: 'python', version: '3.12.0' },
      'py':     { language: 'python', version: '3.12.0' },
      'c':      { language: 'c',      version: '10.2.0' },
      'cpp':    { language: 'c++',    version: '10.2.0' },
      'c++':    { language: 'c++',    version: '10.2.0' }
    };

    const config = languageMap[language.toLowerCase()] || { language, version: '*' };

    try {
      const response = await fetch(`${PISTON_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: config.language,
          version: config.version,
          files: [{ content: code }],
          stdin: stdin,
          run_timeout: timeoutMs,
          compile_timeout: 10000
        })
      });

      if (!response.ok) {
        throw new Error(`Piston API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const run = data.run;
      const compile = data.compile;

      // Handle Compilation Error
      if (compile && (compile.stderr || (compile.code !== 0 && compile.code !== null))) {
        return {
          success: false,
          error: compile.stderr || 'Compilation Error',
          logs: [compile.stdout].filter(Boolean),
          timeMs: Date.now() - start,
          type: 'compile_error'
        };
      }

      // Handle Runtime Result
      return {
        success: run.code === 0 && !run.signal,
        result: run.stdout.trim(),
        logs: [run.stdout, run.stderr].filter(Boolean),
        timeMs: Date.now() - start
      };

    } catch (err) {
      return {
        success: false,
        error: err.message,
        logs: [],
        timeMs: Date.now() - start,
        type: 'system_error'
      };
    }
  }

  /**
   * Execute JavaScript code using Worker Threads (Local)
   */
  static async executeJS(code, input = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const start = Date.now();
    let logs = [];

    const script = `
      const { parentPort, workerData } = require('worker_threads');
      
      // Capture console.log
      const originalLog = console.log;
      console.log = (...args) => {
        parentPort.postMessage({ type: 'log', data: args.join(' ') });
      };

      try {
        const input = workerData || {};
        const result = (function(input) {
          ${code}
        })(input);
        
        parentPort.postMessage({ type: 'result', data: result });
      } catch (err) {
        parentPort.postMessage({ type: 'error', data: err.message });
      }
    `;

    return new Promise((resolve) => {
      const worker = new Worker(script, {
        eval: true,
        workerData: input,
        // Safety: Add resource limits to prevent server crash
        resourceLimits: {
          maxOldGenerationSizeMb: 512,
          maxYoungGenerationSizeMb: 128,
        }
      });

      const timer = setTimeout(() => {
        worker.terminate();
        resolve({
          success: false,
          error: 'Execution Timeout',
          logs,
          timeMs: Date.now() - start,
        });
      }, timeoutMs);

      worker.on('message', (msg) => {
        if (msg.type === 'log') {
          logs.push(msg.data);
        } else if (msg.type === 'result') {
          clearTimeout(timer);
          worker.terminate();
          resolve({
            success: true,
            result: msg.data,
            logs,
            timeMs: Date.now() - start,
          });
        } else if (msg.type === 'error') {
          clearTimeout(timer);
          worker.terminate();
          resolve({
            success: false,
            error: msg.data,
            logs,
            timeMs: Date.now() - start,
          });
        }
      });

      worker.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          error: err.message,
          logs,
          timeMs: Date.now() - start,
        });
      });
    });
  }

  /**
   * Execute Python code (DEPRECATED - moved to executeWithPiston)
   */
  static async executePython(code, input = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return this.executeWithPiston('python', code, JSON.stringify(input), timeoutMs);
  }
}

module.exports = ExecutionService;
