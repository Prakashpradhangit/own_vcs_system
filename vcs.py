# Simple VCS with a Graphical UI

import os
import hashlib
import datetime
import tkinter as tk
from tkinter import messagebox, filedialog

class SimpleVCS:
    def __init__(self, repo_path=".vcs"):
        self.repo_path = repo_path
        self.objects_path = os.path.join(repo_path, "objects")

        if not os.path.exists(repo_path):
            os.mkdir(repo_path)
            os.mkdir(self.objects_path)

    def init(self):
        if os.path.exists(self.repo_path):
            return "Repository already initialized."
        else:
            os.mkdir(self.repo_path)
            os.mkdir(self.objects_path)
            return "Initialized empty repository."

    def hash_object(self, data):
        sha1 = hashlib.sha1()
        sha1.update(data.encode("utf-8"))
        return sha1.hexdigest()

    def add(self, filename):
        if not os.path.isfile(filename):
            return f"Error: {filename} does not exist."

        with open(filename, "r") as f:
            content = f.read()

        object_id = self.hash_object(content)
        object_path = os.path.join(self.objects_path, object_id)

        if not os.path.exists(object_path):
            with open(object_path, "w") as f:
                f.write(content)

        return f"Added: {filename} (Object ID: {object_id})"

    def commit(self, message):
        commit_data = f"Commit: {message}\nTimestamp: {datetime.datetime.now()}"
        commit_id = self.hash_object(commit_data)

        commit_path = os.path.join(self.objects_path, commit_id)
        with open(commit_path, "w") as f:
            f.write(commit_data)

        return f"Commit successful! Commit ID: {commit_id}"

    def log(self):
        logs = []
        for obj in os.listdir(self.objects_path):
            with open(os.path.join(self.objects_path, obj), "r") as f:
                content = f.read()
                if content.startswith("Commit:"):
                    logs.append(f"{obj}: {content}\n")
        return logs

class VCSApp:
    def __init__(self, root):
        self.vcs = SimpleVCS()
        self.root = root
        self.root.title("Simple VCS")

        self.init_button = tk.Button(root, text="Initialize Repository", command=self.init_repo)
        self.init_button.pack(pady=5)

        self.add_button = tk.Button(root, text="Add File", command=self.add_file)
        self.add_button.pack(pady=5)

        self.commit_entry = tk.Entry(root, width=50)
        self.commit_entry.pack(pady=5)
        self.commit_button = tk.Button(root, text="Commit Changes", command=self.commit)
        self.commit_button.pack(pady=5)

        self.log_button = tk.Button(root, text="Show Commit Log", command=self.show_log)
        self.log_button.pack(pady=5)

        self.output = tk.Text(root, height=15, width=80)
        self.output.pack(pady=10)

    def init_repo(self):
        result = self.vcs.init()
        self.output.insert(tk.END, result + "\n")

    def add_file(self):
        filepath = filedialog.askopenfilename()
        if filepath:
            result = self.vcs.add(filepath)
            self.output.insert(tk.END, result + "\n")

    def commit(self):
        message = self.commit_entry.get()
        if message:
            result = self.vcs.commit(message)
            self.output.insert(tk.END, result + "\n")
        else:
            messagebox.showerror("Error", "Commit message cannot be empty")

    def show_log(self):
        logs = self.vcs.log()
        if logs:
            for log in logs:
                self.output.insert(tk.END, log + "\n")
        else:
            self.output.insert(tk.END, "No commits found.\n")

if __name__ == "__main__":
    root = tk.Tk()
    app = VCSApp(root)
    root.mainloop()