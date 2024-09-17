#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs";
import path from "path";

const MIGRATION_CONTENT = `import { Migration } from '@mikro-orm/migrations';
import { bemiUpSql, bemiDownSql } from '@bemi-db/mikro-orm';

export class {{CLASS_NAME}} extends Migration {
  async up(): Promise<void> {
    this.addSql(bemiUpSql());
  }

  async down(): Promise<void> {
    this.addSql(bemiDownSql());
  }
}`

const generateMigrationFile = async (options: { path: string }) => {
  const timestamp = new Date().toISOString().split('.')[0].replaceAll(/\D/g, '')

  const dirPath = path.join(process.cwd(), options.path)
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);

  const filePath = path.join(dirPath, `Migration${timestamp}_bemi.ts`)
  fs.writeFileSync(filePath, MIGRATION_CONTENT.replace('{{CLASS_NAME}}', `Migration${timestamp}_bemi`));

  console.log(`Migration file created: ${filePath}`);
};

const program = new Command();

program.name("bemi").description("CLI to Bemi utilities").version("0.2.8");

program.
  command("migration:create").
  requiredOption("--path <path>", "Path to the migrations directory").
  description("Create a new MikroORM migration file with Bemi PostgreSQL triggers").
  action((options) => { generateMigrationFile(options) });

program.parseAsync(process.argv);
