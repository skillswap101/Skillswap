import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Code2,
  Terminal,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const PRESET_TEMPLATES: Record<string, { title: string; language: string; code: string }> = {
  debounce: {
    title: 'Debounce Function Pattern',
    language: 'javascript',
    code: `// SkillSwap Code Sandbox: Debounce Utility
function debounce(func, delayMs) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delayMs);
  };
}

console.log("Testing debounce implementation...");
let callCount = 0;
const logAction = debounce((msg) => {
  callCount++;
  console.log(\`Executed action: \${msg} (Total calls: \${callCount})\`);
}, 100);

logAction("Search query: 'React'");
logAction("Search query: 'React Hooks'");
logAction("Search query: 'React Hooks & State'");

console.log("Debounce initialized successfully!");
`,
  },
  binary_search: {
    title: 'Binary Search Algorithm',
    language: 'javascript',
    code: `// SkillSwap Code Sandbox: Binary Search
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  let iterations = 0;

  while (left <= right) {
    iterations++;
    const mid = Math.floor((left + right) / 2);
    console.log(\`Iteration \${iterations}: checking index \${mid} (val: \${arr[mid]})\`);
    
    if (arr[mid] === target) {
      return { index: mid, iterations };
    }
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return { index: -1, iterations };
}

const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const target = 23;
console.log("Sorted Array:", JSON.stringify(numbers));
console.log("Searching for target:", target);

const result = binarySearch(numbers, target);
console.log("Result Found:", JSON.stringify(result));
`,
  },
  async_pipeline: {
    title: 'Async Promise Pipeline',
    language: 'javascript',
    code: `// SkillSwap Code Sandbox: Async Data Pipeline
async function simulateP2PVerification(userId, skill) {
  console.log(\`Initiating verification for \${userId} in '\${skill}'...\`);
  
  const step1 = await new Promise(r => setTimeout(() => r("1. Escrow balance checked"), 50));
  console.log(step1);
  
  const step2 = await new Promise(r => setTimeout(() => r("2. Peer identity signed"), 50));
  console.log(step2);

  const step3 = await new Promise(r => setTimeout(() => r("3. Smart swap contract ready"), 50));
  console.log(step3);

  return { verified: true, timestamp: new Date().toISOString() };
}

simulateP2PVerification("alex_swapper", "Full-Stack TypeScript")
  .then(res => console.log("Final verification status:", JSON.stringify(res)));
`,
  },
};

export const CodeSandboxRunner: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState<string>('debounce');
  const [code, setCode] = useState<string>(PRESET_TEMPLATES.debounce.code);
  const [outputLogs, setOutputLogs] = useState<string[]>([
    'SkillSwap Runtime Ready. Click "Run Code" to execute snippet.',
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTemplateChange = (key: string) => {
    setActiveTemplate(key);
    setCode(PRESET_TEMPLATES[key].code);
    setOutputLogs([`Loaded template: ${PRESET_TEMPLATES[key].title}. Click Run Code to execute.`]);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    const logs: string[] = [];

    // Custom console wrapper
    const customConsole = {
      log: (...args: any[]) => {
        const formatted = args
          .map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
          .join(' ');
        logs.push(formatted);
      },
      warn: (...args: any[]) => {
        logs.push(`[WARN] ` + args.join(' '));
      },
      error: (...args: any[]) => {
        logs.push(`[ERROR] ` + args.join(' '));
      },
    };

    try {
      // Execute within safe scoped Function
      const runFn = new Function('console', 'setTimeout', 'clearTimeout', code);
      runFn(
        customConsole,
        (cb: () => void, ms: number) => {
          setTimeout(() => {
            cb();
            setOutputLogs([...logs]);
          }, ms);
        },
        clearTimeout
      );
      
      setOutputLogs(logs.length > 0 ? logs : ['Execution completed with return value undefined.']);
    } catch (err: any) {
      setOutputLogs([...logs, `Runtime Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Header & Controls */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Template Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400 ml-1.5 mr-0.5" />
          {Object.entries(PRESET_TEMPLATES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handleTemplateChange(key)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTemplate === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 flex items-center gap-1 text-xs"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => setCode(PRESET_TEMPLATES[activeTemplate].code)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Reset to Template Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run Code</span>
          </button>
        </div>
      </div>

      {/* Editor & Console Split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
        {/* Code Input */}
        <div className="flex flex-col h-full bg-slate-950 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              main.js (JavaScript Playground)
            </span>
            <span className="text-slate-500">Live Evaluation</span>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-slate-900 text-indigo-200 font-mono text-xs p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
          />
        </div>

        {/* Output Console */}
        <div className="flex flex-col h-full bg-slate-950 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Standard Output Console
            </span>
            <button
              onClick={() => setOutputLogs([])}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 bg-slate-900 font-mono text-xs p-3.5 rounded-xl border border-slate-800 overflow-y-auto space-y-1.5 text-slate-300">
            {outputLogs.map((log, idx) => (
              <div
                key={idx}
                className={`py-0.5 leading-relaxed break-words ${
                  log.includes('[ERROR]') || log.includes('Runtime Error')
                    ? 'text-rose-400 bg-rose-950/30 px-2 rounded'
                    : log.includes('[WARN]')
                    ? 'text-amber-300'
                    : 'text-emerald-300/90'
                }`}
              >
                <span className="text-slate-600 select-none mr-2">&gt;</span>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
