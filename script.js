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
        document.getElementById('tokenInput').addEventListener('change', (e) => {
            this.token = e.target.value;
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

        this.showLoading();

        try {
            const repoData = await this.fetchRepoData(owner, repo);
            const commitsData = await this.fetchCommits(owner, repo);
            const issuesData = await this.fetchIssues(owner, repo);
            const contributorsData = await this.fetchContributors(owner, repo);
            const releasesData = await this.fetchReleases(owner, repo);

            const analysis = this.analyzeData(repoData, commitsData, issuesData, contributorsData, releasesData);
            console.log('Analysis:', analysis);
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    async fetchWithAuth(url) {
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        const response = await fetch(url, { headers });
        
        if (response.status === 404) {
            throw new Error('Repository not found');
        }
        if (response.status === 403) {
            throw new Error('Rate limit exceeded. Add a GitHub token or try again later');
        }
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    }

    async fetchRepoData(owner, repo) {
        return await this.fetchWithAuth(`${this.apiBase}/repos/${owner}/${repo}`);
    }

    async fetchCommits(owner, repo) {
        return await this.fetchWithAuth(`${this.apiBase}/repos/${owner}/${repo}/commits?per_page=100`);
    }

    async fetchIssues(owner, repo) {
        const url = `${this.apiBase}/repos/${owner}/${repo}/issues?state=all&per_page=100&filter=all`;
        const issues = await this.fetchWithAuth(url);
        return issues.filter(issue => !issue.pull_request);
    }

    async fetchContributors(owner, repo) {
        return await this.fetchWithAuth(`${this.apiBase}/repos/${owner}/${repo}/contributors?per_page=100`);
    }

    async fetchReleases(owner, repo) {
        return await this.fetchWithAuth(`${this.apiBase}/repos/${owner}/${repo}/releases`);
    }

    analyzeData(repoData, commits, issues, contributors, releases) {
        const activityScore = this.calculateActivityScore(repoData, commits);
        
        return {
            activityScore,
            metrics: {
                lastCommit: commits[0]?.commit?.author?.date || 'N/A',
                commitCount: commits.length,
                contributorCount: contributors.length,
            }
        };
    }

    calculateActivityScore(repoData, commits) {
        if (!commits.length) return 0;

        const lastCommit = new Date(commits[0].commit.author.date);
        const daysSinceLastCommit = (Date.now() - lastCommit) / (1000 * 3600 * 24);
        
        let recencyScore;
        if (daysSinceLastCommit <= 7) recencyScore = 100;
        else if (daysSinceLastCommit <= 30) recencyScore = 80;
        else if (daysSinceLastCommit <= 90) recencyScore = 50;
        else recencyScore = 20;

        let frequencyScore;
        if (commits.length >= 100) frequencyScore = 100;
        else if (commits.length >= 50) frequencyScore = 80;
        else if (commits.length >= 20) frequencyScore = 60;
        else if (commits.length >= 5) frequencyScore = 40;
        else frequencyScore = 20;

        return Math.round((recencyScore * 0.6) + (frequencyScore * 0.4));
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
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
