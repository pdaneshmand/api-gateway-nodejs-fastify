import { FastifyInstance } from 'fastify';
import { statSync } from 'fs';
import logger from '../libraries/Logger';
const fsPromises = require('fs').promises;
import { join } from 'path';

export default async (
  app: FastifyInstance,
  opts: { dir: string },
  next: (err?: Error) => void,
) => {
  if (!opts.dir) {
    throw new Error('Option dir must be provided');
  }

  const stats = statSync(opts.dir);

  if (!stats.isDirectory) {
    throw new Error('Option dir must be a directory');
  }

  const checkForFilesInDir = async ({ dir }: { dir: string }) => {
    try {
      const subfolders = await fsPromises.readdir(dir);

      for await (const entry of subfolders) {
        if (entry.toLowerCase() !== '.ds_store') {
          const folderStats = statSync(join(dir, entry));

          if (folderStats.isFile) {
            const content = require(join(dir, entry));

            const plugin = content.default || content;

            await app.register(
              plugin,
              content?.autoPrefix && { prefix: content?.autoPrefix },
            );
          } else await checkForFilesInDir({ dir: join(dir, entry) });
        }
      }
    } catch (error) {
      logger.error(error, error['message'], '', 'CONSOLE');
    }
  };

  await checkForFilesInDir({ dir: opts.dir });

  next();
};

module.exports[Symbol.for('skip-override')] = true;
