#!/usr/bin/env node

/**
 * Supabase Tables Usage Audit Script
 * 
 * This script analyzes which database tables are actually being used
 * in the codebase vs which ones exist in the schema.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = __dirname;
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

// Extract table operations from file content
function extractTableOperations(content, filePath) {
  const operations = {
    tables: [],
    operations: []
  };
  
  // Extract table names from various Supabase operations
  const tablePatterns = [
    // supabase.from('table_name')
    /supabase\.from\(['"`]([^'"`]+)['"`]/g,
    // supabase.from('table_name').select()
    /\.from\(['"`]([^'"`]+)['"`]\)\.select/g,
    // supabase.from('table_name').insert()
    /\.from\(['"`]([^'"`]+)['"`]\)\.insert/g,
    // supabase.from('table_name').update()
    /\.from\(['"`]([^'"`]+)['"`]\)\.update/g,
    // supabase.from('table_name').delete()
    /\.from\(['"`]([^'"`]+)['"`]\)\.delete/g,
    // supabase.from('table_name').upsert()
    /\.from\(['"`]([^'"`]+)['"`]\)\.upsert/g
  ];
  
  const rpcPatterns = [
    // RPC functions
    /\.rpc\(['"`]([^'"`]+)['"`]/g
  ];
  
  // Process table patterns
  tablePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const tableName = match[1];
      const line = content.substring(0, match.index).split('\n').length;
      
      operations.tables.push({
        name: tableName,
        file: path.relative(PROJECT_ROOT, filePath),
        line: line,
        type: 'table'
      });
    }
  });
  
  // Process RPC patterns separately
  rpcPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const rpcName = match[1];
      const line = content.substring(0, match.index).split('\n').length;
      
      operations.tables.push({
        name: rpcName,
        file: path.relative(PROJECT_ROOT, filePath),
        line: line,
        type: 'rpc'
      });
    }
  });
  
  // Extract specific operation types
  const operationPatterns = [
    { pattern: /\.select\(/g, type: 'SELECT' },
    { pattern: /\.insert\(/g, type: 'INSERT' },
    { pattern: /\.update\(/g, type: 'UPDATE' },
    { pattern: /\.delete\(/g, type: 'DELETE' },
    { pattern: /\.upsert\(/g, type: 'UPSERT' }
  ];
  
  operationPatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      operations.operations.push({
        type: type,
        file: path.relative(PROJECT_ROOT, filePath),
        line: line
      });
    }
  });
  
  return operations;
}

// Get all tables from the database schema
function getTablesFromSchema() {
  const typesPath = path.join(SRC_DIR, 'integrations', 'supabase', 'types.ts');
  
  if (!fs.existsSync(typesPath)) {
    return [];
  }
  
  const content = fs.readFileSync(typesPath, 'utf8');
  const tables = [];
  
  // Extract table names from the Tables section
  const tablesSectionRegex = /Tables:\s*{([\s\S]*?)}/;
  const match = content.match(tablesSectionRegex);
  
  if (match) {
    const tablesContent = match[1];
    const tableNameRegex = /(\w+):\s*{/g;
    let tableMatch;
    
    while ((tableMatch = tableNameRegex.exec(tablesContent)) !== null) {
      tables.push(tableMatch[1]);
    }
  }
  
  return tables;
}

// Get all views from the database schema
function getViewsFromSchema() {
  const typesPath = path.join(SRC_DIR, 'integrations', 'supabase', 'types.ts');
  
  if (!fs.existsSync(typesPath)) {
    return [];
  }
  
  const content = fs.readFileSync(typesPath, 'utf8');
  const views = [];
  
  // Extract view names from the Views section
  const viewsSectionRegex = /Views:\s*{([\s\S]*?)}/;
  const match = content.match(viewsSectionRegex);
  
  if (match) {
    const viewsContent = match[1];
    const viewNameRegex = /(\w+):\s*{/g;
    let viewMatch;
    
    while ((viewMatch = viewNameRegex.exec(viewsContent)) !== null) {
      views.push(viewMatch[1]);
    }
  }
  
  return views;
}

// Main audit function
function auditTableUsage() {
  console.log(colorize('\n📊 SUPABASE TABLES USAGE AUDIT REPORT', 'bold'));
  console.log(colorize('==========================================\n', 'cyan'));
  
  // Find all source files
  console.log(colorize('📁 Scanning source files...', 'blue'));
  const sourceFiles = findFiles(SRC_DIR);
  console.log(`Found ${sourceFiles.length} source files\n`);
  
  // Extract all table operations
  console.log(colorize('🔍 Extracting table operations...', 'blue'));
  const allOperations = {
    tables: [],
    operations: []
  };
  
  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const operations = extractTableOperations(content, file);
      
      allOperations.tables.push(...operations.tables);
      allOperations.operations.push(...operations.operations);
    } catch (error) {
      console.warn(`Warning: Could not read file ${file}: ${error.message}`);
    }
  }
  
  // Get available tables and views
  const availableTables = getTablesFromSchema();
  const availableViews = getViewsFromSchema();
  
  // Analyze table usage
  console.log(colorize('\n📋 TABLES ANALYSIS', 'bold'));
  console.log(colorize('==================\n', 'cyan'));
  
  const usedTables = [...new Set(allOperations.tables
    .filter(op => op.type === 'table')
    .map(op => op.name))];
  
  const unusedTables = availableTables.filter(table => 
    !usedTables.includes(table)
  );
  
  console.log(colorize('✅ USED Tables:', 'green'));
  if (usedTables.length > 0) {
    usedTables.forEach(tableName => {
      const operations = allOperations.tables.filter(op => 
        op.name === tableName && op.type === 'table'
      );
      console.log(`  • ${colorize(tableName, 'green')} (${operations.length} operations)`);
      
      // Show operation details
      const operationTypes = {};
      operations.forEach(op => {
        const fileContent = fs.readFileSync(path.join(PROJECT_ROOT, op.file), 'utf8');
        const lines = fileContent.split('\n');
        const lineContent = lines[op.line - 1] || '';
        
        if (lineContent.includes('.select(')) operationTypes.SELECT = (operationTypes.SELECT || 0) + 1;
        if (lineContent.includes('.insert(')) operationTypes.INSERT = (operationTypes.INSERT || 0) + 1;
        if (lineContent.includes('.update(')) operationTypes.UPDATE = (operationTypes.UPDATE || 0) + 1;
        if (lineContent.includes('.delete(')) operationTypes.DELETE = (operationTypes.DELETE || 0) + 1;
        if (lineContent.includes('.upsert(')) operationTypes.UPSERT = (operationTypes.UPSERT || 0) + 1;
      });
      
      const operationSummary = Object.entries(operationTypes)
        .map(([type, count]) => `${type}:${count}`)
        .join(', ');
      console.log(`    └─ Operations: ${operationSummary}`);
      
      // Show files using this table
      const uniqueFiles = [...new Set(operations.map(op => op.file))];
      uniqueFiles.slice(0, 3).forEach(file => {
        console.log(`    └─ ${file}`);
      });
      if (uniqueFiles.length > 3) {
        console.log(`    └─ ... and ${uniqueFiles.length - 3} more files`);
      }
    });
  } else {
    console.log('  None found');
  }
  
  console.log(colorize('\n❌ UNUSED Tables:', 'red'));
  if (unusedTables.length > 0) {
    unusedTables.forEach(tableName => {
      console.log(`  • ${colorize(tableName, 'red')}`);
    });
  } else {
    console.log('  All tables are being used');
  }
  
  // Analyze views usage
  console.log(colorize('\n👁️  VIEWS ANALYSIS', 'bold'));
  console.log(colorize('==================\n', 'cyan'));
  
  const usedViews = [...new Set(allOperations.tables
    .filter(op => op.type === 'table')
    .map(op => op.name)
    .filter(name => availableViews.includes(name)))];
  
  const unusedViews = availableViews.filter(view => 
    !usedViews.includes(view)
  );
  
  console.log(colorize('✅ USED Views:', 'green'));
  if (usedViews.length > 0) {
    usedViews.forEach(viewName => {
      const operations = allOperations.tables.filter(op => 
        op.name === viewName && op.type === 'table'
      );
      console.log(`  • ${colorize(viewName, 'green')} (${operations.length} operations)`);
    });
  } else {
    console.log('  None found');
  }
  
  console.log(colorize('\n❌ UNUSED Views:', 'red'));
  if (unusedViews.length > 0) {
    unusedViews.forEach(viewName => {
      console.log(`  • ${colorize(viewName, 'red')}`);
    });
  } else {
    console.log('  All views are being used');
  }
  
  // Analyze RPC functions that might be table-related
  console.log(colorize('\n🔧 RPC FUNCTIONS (Table-related)', 'bold'));
  console.log(colorize('==================================\n', 'cyan'));
  
  const rpcFunctions = [...new Set(allOperations.tables
    .filter(op => op.type === 'rpc')
    .map(op => op.name))];
  
  if (rpcFunctions.length > 0) {
    rpcFunctions.forEach(rpcName => {
      const operations = allOperations.tables.filter(op => 
        op.name === rpcName && op.type === 'rpc'
      );
      console.log(`  • ${colorize(rpcName, 'blue')} (${operations.length} calls)`);
    });
  } else {
    console.log('  None found');
  }
  
  // Operation type analysis
  console.log(colorize('\n⚡ OPERATION TYPES ANALYSIS', 'bold'));
  console.log(colorize('============================\n', 'cyan'));
  
  const operationCounts = {};
  allOperations.operations.forEach(op => {
    operationCounts[op.type] = (operationCounts[op.type] || 0) + 1;
  });
  
  Object.entries(operationCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  • ${colorize(type, 'magenta')}: ${count} operations`);
    });
  
  // Summary
  console.log(colorize('\n📈 SUMMARY', 'bold'));
  console.log(colorize('===========\n', 'cyan'));
  
  console.log(`Tables: ${colorize(usedTables.length, 'green')}/${colorize(availableTables.length, 'blue')} used`);
  console.log(`Views: ${colorize(usedViews.length, 'green')}/${colorize(availableViews.length, 'blue')} used`);
  console.log(`RPC Functions: ${colorize(rpcFunctions.length, 'green')} table-related`);
  console.log(`Total Operations: ${colorize(allOperations.operations.length, 'green')}`);
  
  // Recommendations
  console.log(colorize('\n💡 RECOMMENDATIONS', 'bold'));
  console.log(colorize('==================\n', 'cyan'));
  
  if (unusedTables.length > 0) {
    console.log(colorize('🗑️  Consider removing unused tables:', 'yellow'));
    unusedTables.forEach(table => {
      console.log(`  • ${table}`);
    });
    console.log('');
  }
  
  if (unusedViews.length > 0) {
    console.log(colorize('🗑️  Consider removing unused views:', 'yellow'));
    unusedViews.forEach(view => {
      console.log(`  • ${view}`);
    });
    console.log('');
  }
  
  console.log(colorize('✨ Table audit complete!', 'green'));
}

// Run the audit
auditTableUsage();
