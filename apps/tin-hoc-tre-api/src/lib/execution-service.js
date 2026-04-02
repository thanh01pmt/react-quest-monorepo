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

const DEFAULT_TIMEOUT_MS = 2000;

class ExecutionService {
  /**
   * Execute JavaScript code using Worker Threads
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
   * Execute Python code using child_process
   */
  static async executePython(code, input = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const start = Date.now();
    let logs = [];
    let errorOutput = '';

    // Wrap the code to handle input/output as JSON
    const wrappedCode = `
import json
import sys

def run_user_code(input_data):
    # User code starts here
${code.split('\n').map(line => '    ' + line).join('\n')}
    # User code ends here (assuming user returns result)

if __name__ == "__main__":
    try:
        data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        # result = run_user_code(data) # Not feasible for general code without a function wrapper
        # For competitive programming style:
        exec("""${code.replace(/"""/g, '\\"\\"\\"') }""", globals())
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
`;

    return new Promise((resolve) => {
      const process = spawn('python3', ['-c', wrappedCode, JSON.stringify(input)]);
      
      const timer = setTimeout(() => {
        process.kill();
        resolve({
          success: false,
          error: 'Execution Timeout',
          logs,
          timeMs: Date.now() - start,
        });
      }, timeoutMs);

      process.stdout.on('data', (data) => {
        logs.push(data.toString().trim());
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve({
            success: true,
            logs,
            timeMs: Date.now() - start,
          });
        } else {
          resolve({
            success: false,
            error: errorOutput || 'Unknown execution error',
            logs,
            timeMs: Date.now() - start,
          });
        }
      });
    });
  }
}

module.exports = ExecutionService;
