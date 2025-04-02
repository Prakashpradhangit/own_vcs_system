# Groot - A Simple Version Control System

Groot is a lightweight version control system similar to Git, designed to track file changes and manage commits locally.

## Features
- Initialize a new repository
- Add files to staging
- Commit changes
- View commit logs
- Show differences between commits
- Restore files from a previous state
- Check repository status

## Installation
To use Groot, ensure you have Node.js installed. Then, clone this repository and install dependencies:

```sh
npm install
```

Make the script executable:

```sh
chmod +x groot
```

Optionally, you can link it globally:

```sh
npm link
```

## Usage

### Initialize Repository
```sh
groot init
```
This command creates a `.groot` directory to store metadata.

### Add Files to Staging
```sh
groot add <filename>
```
Stages the file for the next commit.

### Commit Changes
```sh
groot commit "Your commit message"
```
Creates a new commit with the staged files.

### View Commit Logs
```sh
groot log
```
Displays a history of commits.

### Show Commit Differences
```sh
groot show <commitHash>
```
Displays the differences in a commit.

### Restore a File
```sh
groot restore <filename>
```
Restores a file from the latest commit.

### Check Status
```sh
groot status
```
Shows staged and unstaged files.

## License
This project is licensed under the MIT License.

