#!/usr/bin/env node

import { Command } from "commander";
import { download } from "./commands/download";

const program = new Command();

program.command('download videoUrl')
    .description('Download video by url.')
    .action(download);

program.parse();