#!/usr/bin/env node
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {getFileSystem, NodeJSFileSystem, setFileSystem} from '@angular/compiler-cli/src/ngtsc/file_system';
import {ConsoleLogger, Logger, LogLevel} from '@angular/compiler-cli/src/ngtsc/logging';
import * as glob from 'glob';
import * as yargs from 'yargs';
import {migrateFile, MigrationMapping} from './migrate';

if (require.main === module) {
  const args = process.argv.slice(2);
  const options =
      yargs
          .option('r', {
            alias: 'root',
            default: '.',
            describe: 'The root path for other paths provided in these options.\n' +
                'This should either be absolute or relative to the current working directory.',
            type: 'string',
          })
          .option('f', {
            alias: 'files',
            required: true,
            describe:
                'A glob pattern indicating what files to migrate. This should be relative to the root path',
            type: 'string',
          })
          .option('m', {
            alias: 'mapFile',
            required: true,
            describe:
                'Path to the migration mapping file generated by `localize-extract`. This should be relative to the root path.',
            type: 'string',
          })
          .strict()
          .help()
          .parse(args);

  const fs = new NodeJSFileSystem();
  setFileSystem(fs);

  const rootPath = options.r;
  const translationFilePaths = glob.sync(options.f, {cwd: rootPath, nodir: true});
  const logger = new ConsoleLogger(LogLevel.warn);

  migrateFiles({rootPath, translationFilePaths, mappingFilePath: options.m, logger});
  process.exit(0);
}

export interface MigrateFilesOptions {
  /**
   * The base path for other paths provided in these options.
   * This should either be absolute or relative to the current working directory.
   */
  rootPath: string;

  /** Paths to the files that should be migrated. Should be relative to the `rootPath`. */
  translationFilePaths: string[];

  /** Path to the file containing the message ID mappings. Should be relative to the `rootPath`. */
  mappingFilePath: string;

  /** Logger to use for diagnostic messages. */
  logger: Logger;
}

/** Migrates the legacy message IDs based on the passed in configuration. */
export function migrateFiles({
  rootPath,
  translationFilePaths,
  mappingFilePath,
  logger,
}: MigrateFilesOptions) {
  const fs = getFileSystem();
  const absoluteMappingPath = fs.resolve(rootPath, mappingFilePath);
  const mapping = JSON.parse(fs.readFile(absoluteMappingPath)) as MigrationMapping;

  if (Object.keys(mapping).length === 0) {
    logger.warn(
        `Mapping file at ${absoluteMappingPath} is empty. Either there are no messages ` +
        `that need to be migrated, or the extraction step failed to find them.`);
  } else {
    translationFilePaths.forEach(path => {
      const absolutePath = fs.resolve(rootPath, path);
      const sourceCode = fs.readFile(absolutePath);
      fs.writeFile(absolutePath, migrateFile(sourceCode, mapping));
    });
  }
}
