#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import chalk from 'chalk';
import { diffLines } from 'diff';
import { Command } from 'commander';

const program = new Command();

class Groot {
    constructor(repoPath = '.') {
        this.repoPath = path.join(repoPath, '.groot');
        this.objectsPath = path.join(this.repoPath, 'objects');
        this.headPath = path.join(this.repoPath, 'HEAD');
        this.indexPath = path.join(this.repoPath, 'index');
        this.commitsJsonPath = path.join(this.repoPath, 'commits.json');
    }

    async init() {
        await fs.mkdir(this.objectsPath, { recursive: true });
        console.log("Initialized the repository");

        try {
            await fs.writeFile(this.headPath, '', { flag: 'wx' });
            await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: 'wx' });
            await fs.writeFile(this.commitsJsonPath, JSON.stringify([]), { flag: 'wx' });
        } catch (error) {
            console.log('Already initialized the .groot folder');
        }
    }

    hashObject(content) {
        return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');
    }

    async add(fileToBeAdded) {
        const filedata = await fs.readFile(fileToBeAdded, { encoding: 'utf-8' });
        const fileHash = this.hashObject(filedata);
        const newFileHashedObjectPath = path.join(this.objectsPath, fileHash);
        await fs.writeFile(newFileHashedObjectPath, filedata);
        await this.updateStagingArea(fileToBeAdded, fileHash);
        console.log(`Added ${fileToBeAdded} to the index`);
    }

    async updateStagingArea(filePath, fileHash) {
        let index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' }));
        index = index.filter(entry => entry.path !== filePath);
        index.push({ path: filePath, hash: fileHash });
        await fs.writeFile(this.indexPath, JSON.stringify(index));
    }

    async status() {
        try {
            const stagedFiles = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' }));
            const allFiles = await fs.readdir(process.cwd());

            const stagedPaths = new Set(stagedFiles.map(entry => entry.path));
            const unstagedFiles = allFiles.filter(file => !stagedPaths.has(file));

            if (stagedFiles.length > 0) {
                console.log(chalk.blue("Staged files:"));
                stagedFiles.forEach(entry => console.log(chalk.green(` - ${entry.path}`)));
            } else {
                console.log(chalk.yellow("No files in the staging area."));
            }

            if (unstagedFiles.length > 0) {
                console.log(chalk.blue("\nUnstaged files:"));
                unstagedFiles.forEach(file => console.log(chalk.red(` - ${file}`)));
            } else {
                console.log(chalk.yellow("\nNo unstaged files."));
            }

            console.log("Use 'groot commit <message>' to save your changes.");
        } catch (error) {
            console.error(chalk.red("Error reading files:"), error.message);
        }
    }

    async restore(filePath) {
        try {
            let index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' }));
            const fileEntry = index.find(entry => entry.path === filePath);

            if (!fileEntry) {
                console.log(chalk.red(`Error: File ${filePath} is not tracked in groot.`));
                return;
            }

            const objectPath = path.join(this.objectsPath, fileEntry.hash);
            const fileContent = await fs.readFile(objectPath, { encoding: 'utf-8' });
            await fs.writeFile(filePath, fileContent);
            console.log(chalk.green(`Restored ${filePath} from groot.`));
        } catch (error) {
            console.log(chalk.red("Error restoring file:"), error.message);
        }
    }

    async commit(message) {
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' }));
        const parentCommit = await this.getCurrentHead();

        const commitData = {
            commitHash: this.hashObject(JSON.stringify({ index, message, parentCommit })),
            timeStamp: new Date().toISOString(),
            message,
            files: index,
            parent: parentCommit
        };

        const commitPath = path.join(this.objectsPath, commitData.commitHash);
        await fs.writeFile(commitPath, JSON.stringify(commitData));
        await fs.writeFile(this.headPath, commitData.commitHash);
        await fs.writeFile(this.indexPath, JSON.stringify([]));

        await this.saveCommitToJson(commitData);

        console.log(`Commit successfully created: ${commitData.commitHash}`);
    }

    async saveCommitToJson(commitData) {
        let commits = [];
        try {
            const existingCommits = await fs.readFile(this.commitsJsonPath, { encoding: 'utf-8' });
            commits = JSON.parse(existingCommits);
        } catch (error) {}

        commits.push(commitData);
        await fs.writeFile(this.commitsJsonPath, JSON.stringify(commits, null, 2));
    }

    async getCurrentHead() {
        try {
            const head = await fs.readFile(this.headPath, { encoding: 'utf-8' });
            return head.trim() || null;
        } catch (error) {
            return null;
        }
    }

    async log() {
        try {
            const commits = JSON.parse(await fs.readFile(this.commitsJsonPath, { encoding: 'utf-8' }));

            if (commits.length === 0) {
                console.log(chalk.yellow("No commits found."));
                return;
            }

            commits.reverse().forEach(commit => {
                console.log('------------------------------------');
                console.log(`Message: ${commit.message}`);
                console.log(`Commit files: ${commit.files.map(file => file.path).join(', ')}`);        
                console.log(`Commit: ${commit.commitHash}`);
                console.log(`Date: ${commit.timeStamp}`);
                console.log(`Parent: ${commit.parent || "None"}`);
                console.log('------------------------------------\n');
            });

        } catch (error) {
            console.log(chalk.red("Error reading commit history"), error.message);
        }
    }

    async getCommitData(commitHash) {
        const commitPath = path.join(this.objectsPath, commitHash);
        try {
            return await fs.readFile(commitPath, { encoding: 'utf-8' });
        } catch (error) {
            console.log("Failed to get commit data");
            return null;
        }
    }

    async getFileContent(fileHash) {
        const objectPath = path.join(this.objectsPath, fileHash);
        return await fs.readFile(objectPath, { encoding: 'utf-8' });
    }

    async getCommitDiff(commitHash) {
        console.log(chalk.blue(`\nShowing commit: ${commitHash}\n`));
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if (!commitData) {
            console.log(chalk.red("Commit not found"));
            return;
        }

        console.log(chalk.green("Changes in this commit:"));
        for (const file of commitData.files) {
            console.log(chalk.yellow(`\nFile: ${file.path}`));
            const fileContent = await this.getFileContent(file.hash);
            console.log(fileContent);

            if (commitData.parent) {
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const getParentFileContent = await this.getParentFileContent(parentCommitData, file.path);

                if (getParentFileContent !== undefined) {
                    console.log(chalk.blue('\nDiff:'));
                    const diff = diffLines(getParentFileContent, fileContent);

                    diff.forEach(part => {
                        if (part.added) {
                            process.stdout.write(chalk.green("New Lines++\n " + part.value + "\n"));
                        } else if (part.removed) {
                            process.stdout.write(chalk.red("Removed Line--\n" + part.value + "\n"));
                        } else {
                            process.stdout.write(chalk.grey(part.value));
                        }
                    });
                    console.log();
                } else {
                    console.log(chalk.yellow('New file in the commit'));
                }
            } else {
                console.log(chalk.yellow('First commit'));
            }
        }
    }

    async getParentFileContent(parentCommitData, filePath) {
        const parentFile = parentCommitData.files.find(file => file.path === filePath);
        if (parentFile) {
            return await this.getFileContent(parentFile.hash);
        }
    }
}

// CLI Commands
program.command('init').action(async () => {
    const groot = new Groot();
    await groot.init();
});

program.command('add <file>').action(async (file) => {
    const groot = new Groot();
    await groot.add(file);
});

program.command('commit <message>').action(async (message) => {
    const groot = new Groot();
    await groot.commit(message);
});

program.command('log').action(async () => {
    const groot = new Groot();
    await groot.log();
});

program.command('status').action(async () => {
    const groot = new Groot();
    await groot.status();
});

program.command('restore <file>').action(async (file) => {
    const groot = new Groot();
    await groot.restore(file);
});

program.command('show <commitHash>').action(async (commitHash) => {
    const groot = new Groot();
    await groot.getCommitDiff(commitHash);
});

program.parse(process.argv);
