import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

function debugDocsLoader() {
  const inner = docsLoader();
  return {
    name: 'debug-docs-loader',
    load: async (context: any) => {
      const rootDir = fileURLToPath(context.config.root);
      const srcDir = fileURLToPath(context.config.srcDir);
      const docsDir = path.join(srcDir, 'content', 'docs');

      context.logger.info(`[debug] root=${rootDir}`);
      context.logger.info(`[debug] srcDir=${srcDir}`);
      context.logger.info(`[debug] docsDir=${docsDir} exists=${fs.existsSync(docsDir)}`);

      if (fs.existsSync(docsDir)) {
        const files: string[] = [];
        function walk(dir: string) {
          for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const fp = path.join(dir, e.name);
            e.isDirectory() ? walk(fp) : files.push(fp.slice(docsDir.length));
          }
        }
        walk(docsDir);
        context.logger.info(`[debug] files (${files.length}): ${JSON.stringify(files)}`);
      }

      await inner.load(context);

      const keys = [...context.store.keys()];
      context.logger.info(`[debug] store entries (${keys.length}): ${JSON.stringify(keys)}`);
    },
  };
}

export const collections = {
  docs: defineCollection({ loader: debugDocsLoader(), schema: docsSchema() }),
};
