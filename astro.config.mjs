import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: "James's AI Knowledge Portal",
      description: 'Technical notes on AI, Claude Code, and telecom infrastructure',
      social: { github: 'https://github.com/P9Mew' },
      sidebar: [
        {
          label: 'Claude Code',
          autogenerate: { directory: 'public/claude-code' },
        },
        {
          label: 'AI & Infrastructure',
          autogenerate: { directory: 'public/ai-infra' },
        },
        {
          label: 'Private Notes',
          autogenerate: { directory: 'private' },
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
