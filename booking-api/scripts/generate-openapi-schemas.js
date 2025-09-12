const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const jsonSchemaPath = path.join(__dirname, '..', 'docs', 'generated', 'schema.json');
const outPath = path.join(__dirname, '..', 'docs', 'components', 'generated-schemas.yaml');

function run() {
  if (!fs.existsSync(jsonSchemaPath)) {
    console.warn('[openapi] Skipped: JSON schema not found (run prisma generate).');
    return;
  }
  const raw = JSON.parse(fs.readFileSync(jsonSchemaPath, 'utf8'));
  const definitions = raw.definitions || {};

  Object.values(definitions).forEach(def => {
    delete def.$schema;
    delete def.title;
  });

  const doc = { components: { schemas: definitions } };
  fs.writeFileSync(outPath, yaml.dump(doc, { lineWidth: 120 }));
  console.log('[openapi] Generated', path.relative(process.cwd(), outPath));
}

run();