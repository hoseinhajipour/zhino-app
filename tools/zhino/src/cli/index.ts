#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import * as core from '../core/index.js';
import type { ServiceBlock, ServiceBlockType, TargetKind } from '../core/types.js';

function printJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

function fail(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function readJsonFile<T = unknown>(filePath: string): T {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw) as T;
}

function parseTarget(value: string): TargetKind {
  if (value === 'page' || value === 'service' || value === 'article' || value === 'workshop') {
    return value;
  }
  throw new Error(`Invalid target "${value}". Use page|service|article|workshop`);
}

async function main() {
  const program = new Command();
  program
    .name('zhino')
    .description('Zhino clinic CMS CLI (pages, blocks, settings, doctors, faqs, forms)')
    .option('--base <url>', 'API base URL (overrides ZHINO_API_BASE)')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts() as { base?: string };
      if (opts.base) process.env.ZHINO_API_BASE = opts.base;
    });

  program
    .command('health')
    .description('Check API health')
    .action(async () => {
      try {
        printJson({
          base: core.getApiBase(),
          tokenSet: Boolean(core.getApiToken()),
          ...(await core.healthCheck()),
        });
      } catch (err) {
        fail(err);
      }
    });

  const pages = program.command('pages').description('Site pages');
  pages.command('list').action(async () => {
    try {
      printJson(await core.listPages());
    } catch (err) {
      fail(err);
    }
  });
  pages
    .command('get')
    .argument('<id>')
    .action(async (id: string) => {
      try {
        printJson(await core.getPage(id));
      } catch (err) {
        fail(err);
      }
    });
  pages
    .command('upsert')
    .requiredOption('--file <path>', 'JSON file with page entity')
    .action(async (opts: { file: string }) => {
      try {
        const body = readJsonFile<Record<string, unknown> & { id: string }>(opts.file);
        if (!body.id) throw new Error('page.id is required');
        printJson(await core.upsertPage(body));
      } catch (err) {
        fail(err);
      }
    });
  pages
    .command('delete')
    .argument('<id>')
    .action(async (id: string) => {
      try {
        await core.deletePage(id);
        printJson({ deleted: id });
      } catch (err) {
        fail(err);
      }
    });

  const services = program.command('services').description('Services');
  services.command('list').action(async () => {
    try {
      printJson(await core.listServices());
    } catch (err) {
      fail(err);
    }
  });
  services
    .command('get')
    .argument('<id>')
    .action(async (id: string) => {
      try {
        printJson(await core.getService(id));
      } catch (err) {
        fail(err);
      }
    });
  services
    .command('upsert')
    .requiredOption('--file <path>')
    .action(async (opts: { file: string }) => {
      try {
        const body = readJsonFile<Record<string, unknown> & { id: string }>(opts.file);
        printJson(await core.upsertService(body));
      } catch (err) {
        fail(err);
      }
    });

  const articles = program.command('articles').description('Articles');
  articles
    .command('list')
    .option('--category <name>')
    .action(async (opts: { category?: string }) => {
      try {
        printJson(await core.listArticles(opts.category));
      } catch (err) {
        fail(err);
      }
    });
  articles
    .command('get')
    .argument('<id>')
    .action(async (id: string) => {
      try {
        printJson(await core.getArticle(id));
      } catch (err) {
        fail(err);
      }
    });
  articles
    .command('upsert')
    .requiredOption('--file <path>')
    .action(async (opts: { file: string }) => {
      try {
        const body = readJsonFile<Record<string, unknown> & { id: string }>(opts.file);
        printJson(await core.upsertArticle(body));
      } catch (err) {
        fail(err);
      }
    });

  const blocks = program.command('blocks').description('Page builder blocks');
  blocks
    .command('get')
    .argument('<target>', 'page|service|article')
    .argument('<id>')
    .action(async (target: string, id: string) => {
      try {
        printJson(await core.getBlocks(parseTarget(target), id));
      } catch (err) {
        fail(err);
      }
    });
  blocks
    .command('replace')
    .argument('<target>', 'page|service|article')
    .argument('<id>')
    .requiredOption('--file <path>', 'JSON array of blocks, or { blocks: [...] }')
    .action(async (target: string, id: string, opts: { file: string }) => {
      try {
        const raw = readJsonFile<ServiceBlock[] | { blocks: ServiceBlock[] }>(opts.file);
        const list = Array.isArray(raw) ? raw : raw.blocks;
        printJson(await core.replaceBlocks(parseTarget(target), id, list));
      } catch (err) {
        fail(err);
      }
    });
  blocks
    .command('add')
    .argument('<target>', 'page|service|article')
    .argument('<id>')
    .requiredOption('--type <type>', 'Widget type e.g. heroHeader')
    .option('--index <n>', 'Insert index', (v) => Number(v))
    .option('--file <path>', 'Optional props JSON')
    .action(
      async (
        target: string,
        id: string,
        opts: { type: string; index?: number; file?: string }
      ) => {
        try {
          const props = opts.file
            ? readJsonFile<Record<string, unknown>>(opts.file)
            : undefined;
          printJson(
            await core.addBlock(
              parseTarget(target),
              id,
              opts.type as ServiceBlockType,
              opts.index,
              props
            )
          );
        } catch (err) {
          fail(err);
        }
      }
    );
  blocks
    .command('update')
    .argument('<target>', 'page|service|article')
    .argument('<id>')
    .argument('<blockId>')
    .requiredOption('--file <path>', 'JSON patch: { props?, type? }')
    .action(async (target: string, id: string, blockId: string, opts: { file: string }) => {
      try {
        const patch = readJsonFile<{ props?: Record<string, unknown>; type?: ServiceBlockType }>(
          opts.file
        );
        printJson(await core.updateBlock(parseTarget(target), id, blockId, patch));
      } catch (err) {
        fail(err);
      }
    });
  blocks
    .command('remove')
    .argument('<target>', 'page|service|article')
    .argument('<id>')
    .argument('<blockId>')
    .action(async (target: string, id: string, blockId: string) => {
      try {
        printJson(await core.removeBlock(parseTarget(target), id, blockId));
      } catch (err) {
        fail(err);
      }
    });

  const settings = program.command('settings').description('Clinic settings');
  settings.command('get').action(async () => {
    try {
      printJson(await core.getSettings());
    } catch (err) {
      fail(err);
    }
  });
  settings
    .command('set')
    .requiredOption('--file <path>')
    .action(async (opts: { file: string }) => {
      try {
        printJson(await core.updateSettings(readJsonFile(opts.file)));
      } catch (err) {
        fail(err);
      }
    });

  const chrome = program.command('chrome').description('Site chrome (header/footer/menu)');
  chrome.command('get').action(async () => {
    try {
      printJson(await core.getChrome());
    } catch (err) {
      fail(err);
    }
  });
  chrome
    .command('patch')
    .requiredOption('--file <path>')
    .action(async (opts: { file: string }) => {
      try {
        printJson(await core.updateChrome(readJsonFile(opts.file)));
      } catch (err) {
        fail(err);
      }
    });

  const doctors = program.command('doctors').description('Doctors / staff');
  doctors.command('list').action(async () => {
    try {
      printJson(await core.listDoctors());
    } catch (err) {
      fail(err);
    }
  });
  doctors
    .command('upsert')
    .requiredOption('--file <path>')
    .action(async (opts: { file: string }) => {
      try {
        printJson(await core.upsertDoctor(readJsonFile(opts.file)));
      } catch (err) {
        fail(err);
      }
    });
  doctors
    .command('delete')
    .argument('<id>')
    .action(async (id: string) => {
      try {
        await core.deleteDoctor(id);
        printJson({ deleted: id });
      } catch (err) {
        fail(err);
      }
    });

  const faqs = program.command('faqs').description('FAQs');
  faqs.command('list').action(async () => {
    try {
      printJson(await core.listFaqs());
    } catch (err) {
      fail(err);
    }
  });
  faqs
    .command('upsert')
    .requiredOption('--file <path>')
    .action(async (opts: { file: string }) => {
      try {
        printJson(await core.upsertFaq(readJsonFile(opts.file)));
      } catch (err) {
        fail(err);
      }
    });
  faqs
    .command('delete')
    .argument('<id>')
    .action(async (id: string) => {
      try {
        await core.deleteFaq(id);
        printJson({ deleted: id });
      } catch (err) {
        fail(err);
      }
    });

  const forms = program.command('forms').description('Forms');
  forms.command('list').action(async () => {
    try {
      printJson(await core.listForms());
    } catch (err) {
      fail(err);
    }
  });
  forms
    .command('get')
    .argument('<id>')
    .action(async (id: string) => {
      try {
        printJson(await core.getForm(id));
      } catch (err) {
        fail(err);
      }
    });

  const media = program.command('media').description('Media library');
  media
    .command('list')
    .description('List uploaded media')
    .option('--kind <kind>', 'image|video|all', 'all')
    .action(async (opts: { kind: string }) => {
      try {
        const kind =
          opts.kind === 'image' || opts.kind === 'video' ? opts.kind : 'all';
        printJson(await core.listMedia(kind));
      } catch (err) {
        fail(err);
      }
    });

  program
    .command('capabilities')
    .description('Widget palette and page-builder rules')
    .option('--page-kind <kind>', 'site|service|article')
    .action(async (opts: { pageKind?: string }) => {
      try {
        const kind =
          opts.pageKind === 'site' ||
          opts.pageKind === 'service' ||
          opts.pageKind === 'article'
            ? opts.pageKind
            : undefined;
        printJson(core.getCapabilities(kind));
      } catch (err) {
        fail(err);
      }
    });

  program
    .command('create-block')
    .description('Create an empty block template')
    .requiredOption('--type <type>')
    .action((opts: { type: string }) => {
      try {
        printJson(core.createEmptyBlock(opts.type as ServiceBlockType));
      } catch (err) {
        fail(err);
      }
    });

  await program.parseAsync(process.argv);
}

main().catch(fail);
