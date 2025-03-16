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
    }

    async init() {
        await fs.mkdir(this.objectsPath, { recursive: true });
        console.log("Initialized the repository");
        
        try {
            await fs.writeFile(this.headPath, '', { flag: 'wx' });
            await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: 'wx' });
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

    async commit(message) {
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' }));
        const parentCommit = await this.getCurrentHead();

        const commitData = {
            timeStamp: new Date().toISOString(),
            message,
            files: index,
            parent: parentCommit
        };

        const commitHash = this.hashObject(JSON.stringify(commitData));
        const commitPath = path.join(this.objectsPath, commitHash);
        await fs.writeFile(commitPath, JSON.stringify(commitData));
        await fs.writeFile(this.headPath, commitHash);
        await fs.writeFile(this.indexPath, JSON.stringify([]));
        console.log(`Commit successfully created: ${commitHash}`);
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
        let currentCommitHash = await this.getCurrentHead();
        while (currentCommitHash) {
            const commitData = JSON.parse(await fs.readFile(path.join(this.objectsPath, currentCommitHash), { encoding: 'utf-8' }));
            console.log('------------------------------------');
            console.log(`commit: ${currentCommitHash}\nDate: ${commitData.timeStamp}\n\n\t${commitData.message}\n`);
            currentCommitHash = commitData.parent;
        }
    }

    async getCommitDiff(commitHash) {
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if (!commitData) {
            console.log("Commit not found");
            return;
        }
        console.log("Changes in the last commit:");

        for (const file of commitData.files) {
            console.log(`File: ${file.path}`);
            const fileContent = await this.getFileContent(file.hash);
            console.log(fileContent);

            if (commitData.parent) {
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const getParentFileContent = await this.getParentFileContent(parentCommitData, file.path);

                if (getParentFileContent !== undefined) {
                    console.log('\nDiff:');
                    const diff = diffLines(getParentFileContent, fileContent);

                    diff.forEach(part => {
                        if (part.added) {
                            console.log("new line");
                            
                            process.stdout.write(chalk.green("++"+part.value+"\n"));
                        } else if (part.removed) {
                            console.log("removed line");
                            process.stdout.write(chalk.red("--"+part.value+"\n"));
                        } else {
                            process.stdout.write(chalk.grey(part.value));
                        }
                    });
                    console.log();
                } else {
                    console.log('New file in the commit');
                }
            } else {
                console.log('First commit');
            }
        }
    }

    async getParentFileContent(parentCommitData, filePath) {
        const parentFile = parentCommitData.files.find(file => file.path === filePath);
        if (parentFile) {
            return await this.getFileContent(parentFile.hash);
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
}

// (async () => {
//     const groot = new Groot();
//     // await groot.init();
//     // await groot.add('a.txt');
    
//     // await groot.commit('3rd commit');
//     // await groot.log();

//     await groot.getCommitDiff('c5706881151731e12f57ecf072642dd4231e295d');
// })();


program.command('init').action(async () => {
    const groot = new Groot();
    await groot.init();
});

program.command('add <file>').action(async (file)=>{
    const groot = new Groot();
    await groot.add(file);
})

program.command('commit <message>').action(async (message)=>{
    const groot = new Groot();
    await groot.commit(message);
})

program.command('log').action(async ()=>{
    const groot = new Groot();
    await groot.log();
});

program.command('show <commitHash>').action(async (commitHash)=>{
    const groot = new Groot();
    await groot.getCommitDiff(commitHash);
});

program.parse(process.argv);
// console.log(process.argv);