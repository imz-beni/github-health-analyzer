class GitHubHealthAnalyzer {
    constructor() {
        this.apiBase = 'https://api.github.com';
        this.token = '';
        this.currentRepo = null;
        this.init();
    }

    init() {
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyze());
        document.getElementById('repoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.analyze();
        });
    }

    async analyze() {
        const repoInput = document.getElementById('repoInput').value.trim();
        if (!repoInput) {
            this.showError('Please enter a repository name');
            return;
        }

        let owner, repo;
        if (repoInput.includes('github.com')) {
            const parts = repoInput.split('github.com/')[1].split('/');
            owner = parts[0];
            repo = parts[1];
        } else {
            [owner, repo] = repoInput.split('/');
        }

        if (!owner || !repo) {
            this.showError('Invalid repository format. Use "owner/repo" or full GitHub URL');
            return;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

const app = new GitHubHealthAnalyzer();
