const fs = require('fs');
const path = require('path');

// Assuming the script is run from the project root
const examplesListPath = path.join(__dirname, '../src/app/example-list.ts');
const appDir = path.join(__dirname, '../src/app');
const outputDir = path.join(__dirname, '../src/assets');
const outputPath = path.join(outputDir, 'examples-code.json');

// A simple regex to extract the array content from example-list.ts
// This is a bit brittle but works for the current file structure.
// A more robust solution would be to use a TypeScript parser.
function getRouterLinks(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const matches = fileContent.match(/routerLink: '([^']+)'/g);
  if (!matches) {
    return [];
  }
  return matches.map(m => m.replace(/routerLink: '([^']+)'/, '$1'));
}

function generateCodeMap() {
  try {
    const routerLinks = getRouterLinks(examplesListPath);
    const codeMap = {};

    routerLinks.forEach(link => {
      const componentPath = path.join(appDir, link, `${link}.component.ts`);
      if (fs.existsSync(componentPath)) {
        codeMap[link] = fs.readFileSync(componentPath, 'utf-8');
      } else {
        console.warn(`Warning: Could not find component file for "${link}" at ${componentPath}`);
      }
    });

    // Ensure the assets directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(codeMap, null, 2));
    console.log(`Successfully generated examples code map at ${outputPath}`);
  } catch (error) {
    console.error('Error generating examples code map:', error);
    process.exit(1);
  }
}

generateCodeMap();
