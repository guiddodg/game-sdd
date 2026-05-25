#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colored terminal output helpers
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`\n${COLORS.bright}${COLORS.cyan}🚀 Iniciando instalación de Stack-Architecture & SDD Enforcer via NPX...${COLORS.reset}\n`);

const targetDir = process.cwd();
const rulesDir = path.join(targetDir, '.ai-rules');
const templatesSourceDir = path.join(__dirname, '..', 'templates');

// 1. Create .ai-rules directory if it does not exist
try {
  if (!fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDir, { recursive: true });
    console.log(`${COLORS.green}📁 Carpeta ${COLORS.bright}.ai-rules${COLORS.reset}${COLORS.green} creada exitosamente.${COLORS.reset}`);
  }
} catch (err) {
  console.error(`${COLORS.red}❌ Error al crear la carpeta .ai-rules: ${err.message}${COLORS.reset}`);
  process.exit(1);
}

// 2. Define files to copy (Source inside package -> Destination inside user's project)
const filesToCopy = [
  { src: '.claudeprompt', dest: '.claudeprompt', root: true },
  { src: 'architecture-sdv.md', dest: 'architecture-sdv.md' },
  { src: 'hierarchy-standard.md', dest: 'hierarchy-standard.md' },
  { src: 'definition-of-done.md', dest: 'definition-of-done.md' },
  { src: 'performance-standards.md', dest: 'performance-standards.md' },
  { src: 'ui-architecture.md', dest: 'ui-architecture.md' }
];

// 3. Copy files
let hasError = false;

filesToCopy.forEach(file => {
  const sourcePath = path.join(templatesSourceDir, file.src);
  const destinationPath = file.root 
    ? path.join(targetDir, file.dest)
    : path.join(rulesDir, file.dest);

  console.log(`${COLORS.yellow}📥 Copiando ${file.src}...${COLORS.reset}`);

  try {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`El archivo de plantilla no existe en el paquete: ${sourcePath}`);
    }
    fs.copyFileSync(sourcePath, destinationPath);
  } catch (err) {
    console.error(`${COLORS.red}❌ Error al copiar ${file.src}: ${err.message}${COLORS.reset}`);
    hasError = true;
  }
});

if (hasError) {
  console.log(`\n${COLORS.red}❌ Ocurrieron errores durante la instalación. Revisá los logs de arriba.${COLORS.reset}\n`);
  process.exit(1);
}

// 4. Success Message
console.log(`\n${COLORS.green}${COLORS.bright}✅ ¡Instalación completada con éxito!${COLORS.reset}`);
console.log(`${COLORS.cyan}💡 Ahora podés crear tu archivo 'feature.md' en la raíz y ejecutar /game-sdd${COLORS.reset}\n`);
