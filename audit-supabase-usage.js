#!/usr/bin/env node

/**
 * Supabase Functions and RPC Usage Audit Script
 * 
 * This script analyzes which Supabase Edge Functions and RPC functions
 * are actually being used in the codebase vs which ones exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = __dirname;
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const SUPABASE_FUNCTIONS_DIR = path.join(PROJECT_ROOT, 'supabase', 'functions');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Helper function to colorize text
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Helper function to find all files recursively
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Extract function calls from file content
function extractFunctionCalls(content, filePath) {
  const calls = {
    edgeFunctions: [],
    rpcFunctions: [],
    tableOperations: []
  };
  
  // Extract Edge Function calls: supabase.functions.invoke('function_name')
  const edgeFunctionRegex = /supabase\.functions\.invoke\(['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = edgeFunctionRegex.exec(content)) !== null) {
    calls.edgeFunctions.push({
      name: match[1],
      file: path.relative(PROJECT_ROOT, filePath),
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  // Extract RPC function calls: supabase.rpc('function_name')
  const rpcFunctionRegex = /supabase\.rpc\(['"`]([^'"`]+)['"`]/g;
  while ((match = rpcFunctionRegex.exec(content)) !== null) {
    calls.rpcFunctions.push({
      name: match[1],
      file: path.relative(PROJECT_ROOT, filePath),
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  // Extract table operations: supabase.from('table_name')
  const tableOperationRegex = /supabase\.from\(['"`]([^'"`]+)['"`]/g;
  while ((match = tableOperationRegex.exec(content)) !== null) {
    calls.tableOperations.push({
      name: match[1],
      file: path.relative(PROJECT_ROOT, filePath),
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return calls;
}

// Get all Edge Functions from supabase/functions directory
function getEdgeFunctions() {
  const functions = [];
  
  if (fs.existsSync(SUPABASE_FUNCTIONS_DIR)) {
    const items = fs.readdirSync(SUPABASE_FUNCTIONS_DIR);
    
    for (const item of items) {
      const functionPath = path.join(SUPABASE_FUNCTIONS_DIR, item);
      const stat = fs.statSync(functionPath);
      
      if (stat.isDirectory()) {
        // Check if it has an index.ts file
        const indexPath = path.join(functionPath, 'index.ts');
        if (fs.existsSync(indexPath)) {
          functions.push({
            name: item,
            path: functionPath,
            hasIndex: true
          });
        } else {
          functions.push({
            name: item,
            path: functionPath,
            hasIndex: false
          });
        }
      }
    }
  }
  
  return functions;
}

// Get RPC functions from types.ts
function getRPCFunctions() {
  const typesPath = path.join(SRC_DIR, 'integrations', 'supabase', 'types.ts');
  
  if (!fs.existsSync(typesPath)) {
    return [];
  }
  
  const content = fs.readFileSync(typesPath, 'utf8');
  const rpcFunctions = [];
  
  // Extract RPC function names from the Functions section
  const functionsSectionRegex = /Functions:\s*{([\s\S]*?)}/;
  const match = content.match(functionsSectionRegex);
  
  if (match) {
    const functionsContent = match[1];
    const functionNameRegex = /(\w+):\s*{/g;
    let functionMatch;
    
    while ((functionMatch = functionNameRegex.exec(functionsContent)) !== null) {
      rpcFunctions.push(functionMatch[1]);
    }
  }
  
  return rpcFunctions;
}

// Main audit function
function auditSupabaseUsage() {
  console.log(colorize('\n🔍 SUPABASE USAGE AUDIT REPORT', 'bold'));
  console.log(colorize('=====================================\n', 'cyan'));
  
  // Find all source files
  console.log(colorize('📁 Scanning source files...', 'blue'));
  const sourceFiles = findFiles(SRC_DIR);
  console.log(`Found ${sourceFiles.length} source files\n`);
  
  // Extract all function calls
  console.log(colorize('🔍 Extracting function calls...', 'blue'));
  const allCalls = {
    edgeFunctions: [],
    rpcFunctions: [],
    tableOperations: []
  };
  
  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const calls = extractFunctionCalls(content, file);
      
      allCalls.edgeFunctions.push(...calls.edgeFunctions);
      allCalls.rpcFunctions.push(...calls.rpcFunctions);
      allCalls.tableOperations.push(...calls.tableOperations);
    } catch (error) {
      console.warn(`Warning: Could not read file ${file}: ${error.message}`);
    }
  }
  
  // Get available functions
  const availableEdgeFunctions = getEdgeFunctions();
  const availableRPCFunctions = getRPCFunctions();
  
  // Analyze Edge Functions
  console.log(colorize('\n🚀 EDGE FUNCTIONS ANALYSIS', 'bold'));
  console.log(colorize('============================\n', 'cyan'));
  
  const usedEdgeFunctions = [...new Set(allCalls.edgeFunctions.map(call => call.name))];
  const unusedEdgeFunctions = availableEdgeFunctions.filter(func => 
    !usedEdgeFunctions.includes(func.name)
  );
  
  console.log(colorize('✅ USED Edge Functions:', 'green'));
  if (usedEdgeFunctions.length > 0) {
    usedEdgeFunctions.forEach(funcName => {
      const calls = allCalls.edgeFunctions.filter(call => call.name === funcName);
      console.log(`  • ${colorize(funcName, 'green')} (${calls.length} calls)`);
      calls.forEach(call => {
        console.log(`    └─ ${call.file}:${call.line}`);
      });
    });
  } else {
    console.log('  None found');
  }
  
  console.log(colorize('\n❌ UNUSED Edge Functions:', 'red'));
  if (unusedEdgeFunctions.length > 0) {
    unusedEdgeFunctions.forEach(func => {
      const status = func.hasIndex ? 'has index.ts' : 'missing index.ts';
      console.log(`  • ${colorize(func.name, 'red')} (${status})`);
    });
  } else {
    console.log('  All Edge Functions are being used');
  }
  
  // Analyze RPC Functions
  console.log(colorize('\n🔧 RPC FUNCTIONS ANALYSIS', 'bold'));
  console.log(colorize('===========================\n', 'cyan'));
  
  const usedRPCFunctions = [...new Set(allCalls.rpcFunctions.map(call => call.name))];
  const unusedRPCFunctions = availableRPCFunctions.filter(func => 
    !usedRPCFunctions.includes(func)
  );
  
  console.log(colorize('✅ USED RPC Functions:', 'green'));
  if (usedRPCFunctions.length > 0) {
    usedRPCFunctions.forEach(funcName => {
      const calls = allCalls.rpcFunctions.filter(call => call.name === funcName);
      console.log(`  • ${colorize(funcName, 'green')} (${calls.length} calls)`);
      calls.forEach(call => {
        console.log(`    └─ ${call.file}:${call.line}`);
      });
    });
  } else {
    console.log('  None found');
  }
  
  console.log(colorize('\n❌ UNUSED RPC Functions:', 'red'));
  if (unusedRPCFunctions.length > 0) {
    unusedRPCFunctions.forEach(funcName => {
      console.log(`  • ${colorize(funcName, 'red')}`);
    });
  } else {
    console.log('  All RPC Functions are being used');
  }
  
  // Analyze Table Operations
  console.log(colorize('\n📊 TABLE OPERATIONS ANALYSIS', 'bold'));
  console.log(colorize('==============================\n', 'cyan'));
  
  const usedTables = [...new Set(allCalls.tableOperations.map(call => call.name))];
  
  console.log(colorize('✅ USED Tables:', 'green'));
  if (usedTables.length > 0) {
    usedTables.forEach(tableName => {
      const calls = allCalls.tableOperations.filter(call => call.name === tableName);
      console.log(`  • ${colorize(tableName, 'green')} (${calls.length} operations)`);
    });
  } else {
    console.log('  None found');
  }
  
  // Summary
  console.log(colorize('\n📈 SUMMARY', 'bold'));
  console.log(colorize('===========\n', 'cyan'));
  
  console.log(`Edge Functions: ${colorize(usedEdgeFunctions.length, 'green')}/${colorize(availableEdgeFunctions.length, 'blue')} used`);
  console.log(`RPC Functions: ${colorize(usedRPCFunctions.length, 'green')}/${colorize(availableRPCFunctions.length, 'blue')} used`);
  console.log(`Tables: ${colorize(usedTables.length, 'green')} tables accessed`);
  
  // Recommendations
  console.log(colorize('\n💡 RECOMMENDATIONS', 'bold'));
  console.log(colorize('==================\n', 'cyan'));
  
  if (unusedEdgeFunctions.length > 0) {
    console.log(colorize('🗑️  Consider removing unused Edge Functions:', 'yellow'));
    unusedEdgeFunctions.forEach(func => {
      console.log(`  • ${func.name}`);
    });
    console.log('');
  }
  
  if (unusedRPCFunctions.length > 0) {
    console.log(colorize('🗑️  Consider removing unused RPC Functions:', 'yellow'));
    unusedRPCFunctions.forEach(func => {
      console.log(`  • ${func}`);
    });
    console.log('');
  }
  
  console.log(colorize('✨ Audit complete!', 'green'));
}

// Run the audit
auditSupabaseUsage();
