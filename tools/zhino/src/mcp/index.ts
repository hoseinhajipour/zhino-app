#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as core from '../core/index.js';
import type { ServiceBlock, ServiceBlockType, TargetKind } from '../core/types.js';

function textResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

const targetSchema = z.enum(['page', 'service', 'article', 'workshop']);
const pageKindSchema = z.enum(['site', 'service', 'article', 'workshop']);

const server = new McpServer({
  name: 'zhino',
  version: '1.0.0',
});

server.tool('health_check', 'Check Zhino API health and token status', {}, async () => {
  try {
    return textResult({
      base: core.getApiBase(),
      tokenSet: Boolean(core.getApiToken()),
      ...(await core.healthCheck()),
    });
  } catch (err) {
    return errorResult(err);
  }
});

server.tool('list_pages', 'List site CMS pages', {}, async () => {
  try {
    return textResult(await core.listPages());
  } catch (err) {
    return errorResult(err);
  }
});

server.tool(
  'get_page',
  'Get a site page by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      return textResult(await core.getPage(id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'upsert_page',
  'Create or update a site page (full entity JSON including pageBuilder)',
  { page: z.record(z.string(), z.unknown()) },
  async ({ page }) => {
    try {
      if (!page.id || typeof page.id !== 'string') throw new Error('page.id is required');
      return textResult(
        await core.upsertPage(page as Record<string, unknown> & { id: string })
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'delete_page',
  'Delete a site page by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      await core.deletePage(id);
      return textResult({ deleted: id });
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool('list_services', 'List clinic services', {}, async () => {
  try {
    return textResult(await core.listServices());
  } catch (err) {
    return errorResult(err);
  }
});

server.tool(
  'get_service',
  'Get a service by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      return textResult(await core.getService(id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'upsert_service',
  'Create or update a service (includes pageBuilder)',
  { service: z.record(z.string(), z.unknown()) },
  async ({ service }) => {
    try {
      if (!service.id || typeof service.id !== 'string') throw new Error('service.id is required');
      return textResult(
        await core.upsertService(service as Record<string, unknown> & { id: string })
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'list_articles',
  'List articles',
  { category: z.string().optional() },
  async ({ category }) => {
    try {
      return textResult(await core.listArticles(category));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'get_article',
  'Get an article by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      return textResult(await core.getArticle(id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'upsert_article',
  'Create or update an article',
  { article: z.record(z.string(), z.unknown()) },
  async ({ article }) => {
    try {
      if (!article.id || typeof article.id !== 'string') throw new Error('article.id is required');
      return textResult(
        await core.upsertArticle(article as Record<string, unknown> & { id: string })
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'get_blocks',
  'Get pageBuilder blocks for a page, service, or article',
  { target: targetSchema, id: z.string() },
  async ({ target, id }) => {
    try {
      return textResult(await core.getBlocks(target as TargetKind, id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'replace_blocks',
  'Replace the full blocks array (validated against pageKind palette)',
  {
    target: targetSchema,
    id: z.string(),
    blocks: z.array(z.record(z.string(), z.unknown())),
  },
  async ({ target, id, blocks }) => {
    try {
      return textResult(
        await core.replaceBlocks(target as TargetKind, id, blocks as unknown as ServiceBlock[])
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'add_block',
  'Add a new empty (or props-merged) block to a pageBuilder',
  {
    target: targetSchema,
    id: z.string(),
    type: z.string(),
    index: z.number().int().optional(),
    props: z.record(z.string(), z.unknown()).optional(),
  },
  async ({ target, id, type, index, props }) => {
    try {
      return textResult(
        await core.addBlock(target as TargetKind, id, type as ServiceBlockType, index, props)
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'update_block',
  'Patch one block by id (merge props)',
  {
    target: targetSchema,
    id: z.string(),
    blockId: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
    type: z.string().optional(),
  },
  async ({ target, id, blockId, props, type }) => {
    try {
      return textResult(
        await core.updateBlock(target as TargetKind, id, blockId, {
          props,
          type: type as ServiceBlockType | undefined,
        })
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'remove_block',
  'Remove a block by id',
  { target: targetSchema, id: z.string(), blockId: z.string() },
  async ({ target, id, blockId }) => {
    try {
      return textResult(await core.removeBlock(target as TargetKind, id, blockId));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool('get_settings', 'Get clinic_settings singleton', {}, async () => {
  try {
    return textResult(await core.getSettings());
  } catch (err) {
    return errorResult(err);
  }
});

server.tool(
  'update_settings',
  'Merge and save clinic_settings',
  { settings: z.record(z.string(), z.unknown()) },
  async ({ settings }) => {
    try {
      return textResult(await core.updateSettings(settings));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool('get_chrome', 'Get site chrome (header/menu/footer/identity)', {}, async () => {
  try {
    return textResult(await core.getChrome());
  } catch (err) {
    return errorResult(err);
  }
});

server.tool(
  'update_chrome',
  'Patch site chrome settings',
  { chrome: z.record(z.string(), z.unknown()) },
  async ({ chrome }) => {
    try {
      return textResult(await core.updateChrome(chrome));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'update_contact',
  'Merge partial contact info (phones, email, telegram, instagram, youtube, addresses with lat/lng, etc.) into clinic_settings.contact and sync legacy site.identity fields',
  { contact: z.record(z.string(), z.unknown()) },
  async ({ contact }) => {
    try {
      return textResult(await core.updateContact(contact));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool('list_doctors', 'List doctors / staff', {}, async () => {
  try {
    return textResult(await core.listDoctors());
  } catch (err) {
    return errorResult(err);
  }
});

server.tool(
  'get_doctor',
  'Get a doctor by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      return textResult(await core.getDoctor(id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'upsert_doctor',
  'Create or update a doctor',
  { doctor: z.record(z.string(), z.unknown()) },
  async ({ doctor }) => {
    try {
      if (!doctor.id || typeof doctor.id !== 'string') throw new Error('doctor.id is required');
      return textResult(
        await core.upsertDoctor(doctor as Record<string, unknown> & { id: string })
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'delete_doctor',
  'Delete a doctor by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      await core.deleteDoctor(id);
      return textResult({ deleted: id });
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool('list_faqs', 'List FAQs', {}, async () => {
  try {
    return textResult(await core.listFaqs());
  } catch (err) {
    return errorResult(err);
  }
});

server.tool(
  'upsert_faq',
  'Create or update a FAQ',
  { faq: z.record(z.string(), z.unknown()) },
  async ({ faq }) => {
    try {
      if (!faq.id || typeof faq.id !== 'string') throw new Error('faq.id is required');
      return textResult(await core.upsertFaq(faq as Record<string, unknown> & { id: string }));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'delete_faq',
  'Delete a FAQ by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      await core.deleteFaq(id);
      return textResult({ deleted: id });
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool('list_forms', 'List form definitions', {}, async () => {
  try {
    return textResult(await core.listForms());
  } catch (err) {
    return errorResult(err);
  }
});

server.tool(
  'get_form',
  'Get a form definition by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      return textResult(await core.getForm(id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'list_media',
  'List uploaded media',
  { kind: z.enum(['image', 'video', 'all']).optional() },
  async ({ kind }) => {
    try {
      return textResult(await core.listMedia(kind || 'all'));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'upload_media',
  'Upload a local file (by path) to the media library (POST /api/uploads)',
  {
    filePath: z.string().describe('Absolute path, or relative to the MCP server cwd'),
    purpose: z.enum(['shop', 'document', '']).optional().describe('Allows document/audio uploads when set'),
  },
  async ({ filePath, purpose }) => {
    try {
      return textResult(await core.uploadMedia(filePath, purpose));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'delete_media',
  'Delete an uploaded media file by filename (DELETE /api/uploads/:filename)',
  { filename: z.string() },
  async ({ filename }) => {
    try {
      return textResult(await core.deleteMedia(filename));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool('list_workshops', 'List workshops / training events', {}, async () => {
  try {
    return textResult(await core.listWorkshops());
  } catch (err) {
    return errorResult(err);
  }
});

server.tool(
  'get_workshop',
  'Get a workshop by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      return textResult(await core.getWorkshop(id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'upsert_workshop',
  'Create or update a workshop',
  { workshop: z.record(z.string(), z.unknown()) },
  async ({ workshop }) => {
    try {
      if (!workshop.id || typeof workshop.id !== 'string') {
        throw new Error('workshop.id is required');
      }
      return textResult(
        await core.upsertWorkshop(workshop as Record<string, unknown> & { id: string })
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'delete_workshop',
  'Delete a workshop by id',
  { id: z.string() },
  async ({ id }) => {
    try {
      await core.deleteWorkshop(id);
      return textResult({ deleted: id });
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'get_capabilities',
  'Page-builder widget palettes and design rules (from CAPABILITIES)',
  { pageKind: pageKindSchema.optional() },
  async ({ pageKind }) => {
    try {
      return textResult(core.getCapabilities(pageKind));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  'create_empty_block',
  'Create a default block template for a widget type',
  { type: z.string() },
  async ({ type }) => {
    try {
      return textResult(core.createEmptyBlock(type as ServiceBlockType));
    } catch (err) {
      return errorResult(err);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('zhino MCP server running on stdio');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
