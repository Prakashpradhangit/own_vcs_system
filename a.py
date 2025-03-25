import os
import json
import hashlib
import shutil
import argparse
from datetime import datetime
from difflib import unified_diff

class Groot:
    def __init__(self, repo_path='.'):        
        self.repo_path = os.path.join(repo_path, '.GEC')
        self.objects_path = os.path.join(self.repo_path, 'objects')
        self.head_path = os.path.join(self.repo_path, 'HEAD')
        self.index_path = os.path.join(self.repo_path, 'index')
    
    def init(self):
        os.makedirs(self.objects_path, exist_ok=True)
        print("Initialized the repository")
        
        open(self.head_path, 'a').close()
        with open(self.index_path, 'w') as f:
            json.dump([], f)
    
    def hash_object(self, content):
        return hashlib.sha1(content.encode('utf-8')).hexdigest()
    
    def add(self, file):
        with open(file, 'r') as f:
            file_data = f.read()
        
        file_hash = self.hash_object(file_data)
        object_path = os.path.join(self.objects_path, file_hash)
        
        with open(object_path, 'w') as f:
            f.write(file_data)
        
        self.update_staging_area(file, file_hash)
        print(f"Added {file} to the index")
    
    def update_staging_area(self, file_path, file_hash):
        with open(self.index_path, 'r') as f:
            index = json.load(f)
        
        index = [entry for entry in index if entry['path'] != file_path]
        index.append({'path': file_path, 'hash': file_hash})
        
        with open(self.index_path, 'w') as f:
            json.dump(index, f)
    
    def commit(self, message):
        with open(self.index_path, 'r') as f:
            index = json.load(f)
        
        parent_commit = self.get_current_head()
        commit_data = {
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'files': index,
            'parent': parent_commit
        }
        
        commit_hash = self.hash_object(json.dumps(commit_data))
        commit_path = os.path.join(self.objects_path, commit_hash)
        
        with open(commit_path, 'w') as f:
            json.dump(commit_data, f)
        
        with open(self.head_path, 'w') as f:
            f.write(commit_hash)
        
        with open(self.index_path, 'w') as f:
            json.dump([], f)
        
        print(f"Commit successfully created: {commit_hash}")
    
    def get_current_head(self):
        if os.path.exists(self.head_path):
            with open(self.head_path, 'r') as f:
                return f.read().strip() or None
        return None
    
    def log(self):
        commit_hash = self.get_current_head()
        while commit_hash:
            commit_path = os.path.join(self.objects_path, commit_hash)
            with open(commit_path, 'r') as f:
                commit_data = json.load(f)
            
            print('------------------------------------')
            print(f"commit: {commit_hash}\nDate: {commit_data['timestamp']}\n\n\t{commit_data['message']}\n")
            
            commit_hash = commit_data['parent']
    
    def status(self):
        print("Checking status...")
        staged_files = []
        unstaged_files = []
        
        with open(self.index_path, 'r') as f:
            index = json.load(f)
        
        for entry in index:
            file_path = entry['path']
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    file_data = f.read()
                current_hash = self.hash_object(file_data)
                if current_hash != entry['hash']:
                    unstaged_files.append(file_path)
                else:
                    staged_files.append(file_path)
        
        print("Staged files:")
        for file in staged_files:
            print(f"  {file}")
        
        print("Unstaged files:")
        for file in unstaged_files:
            print(f"  {file}")
    
    def get_commit_diff(self, commit_hash):
        commit_path = os.path.join(self.objects_path, commit_hash)
        if not os.path.exists(commit_path):
            print("Commit not found")
            return
        
        with open(commit_path, 'r') as f:
            commit_data = json.load(f)
        
        print("Changes in the last commit:")
        for file in commit_data['files']:
            print(f"File: {file['path']}")
            file_content = self.get_file_content(file['hash'])
            print(file_content)
            
            if commit_data['parent']:
                parent_commit_path = os.path.join(self.objects_path, commit_data['parent'])
                with open(parent_commit_path, 'r') as f:
                    parent_commit_data = json.load(f)
                
                parent_file_content = self.get_parent_file_content(parent_commit_data, file['path'])
                
                if parent_file_content is not None:
                    print('\nDiff:')
                    diff = unified_diff(
                        parent_file_content.splitlines(),
                        file_content.splitlines(),
                        lineterm=''
                    )
                    print('\n'.join(diff))
                else:
                    print('New file in the commit')
            else:
                print('First commit')
    
    def get_parent_file_content(self, parent_commit_data, file_path):
        for file in parent_commit_data['files']:
            if file['path'] == file_path:
                return self.get_file_content(file['hash'])
        return None
    
    def get_file_content(self, file_hash):
        object_path = os.path.join(self.objects_path, file_hash)
        with open(object_path, 'r') as f:
            return f.read()

def main():
    parser = argparse.ArgumentParser(description='Groot - A simple version control system')
    subparsers = parser.add_subparsers(dest='command')
    
    subparsers.add_parser('init')
    add_parser = subparsers.add_parser('add')
    add_parser.add_argument('file')
    
    commit_parser = subparsers.add_parser('commit')
    commit_parser.add_argument('message')
    
    subparsers.add_parser('log')
    subparsers.add_parser('status')
    
    show_parser = subparsers.add_parser('show')
    show_parser.add_argument('commit_hash')
    
    args = parser.parse_args()
    groot = Groot()
    
    if args.command == 'init':
        groot.init()
    elif args.command == 'add':
        groot.add(args.file)
    elif args.command == 'commit':
        groot.commit(args.message)
    elif args.command == 'log':
        groot.log()
    elif args.command == 'status':
        groot.status()
    elif args.command == 'show':
        groot.get_commit_diff(args.commit_hash)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()