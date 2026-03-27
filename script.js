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
        document.getElementById('compareBtn').addEventListener('click', () => this.clearForNew());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportReport());
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
        this.hideResults();

        try {
            const repoData = await this.fetchRepoData(owner, repo);
            const commitsData = await this.fetchCommits(owner, repo);
            const issuesData = await this.fetchIssues(owner, repo);
            const contributorsData = await this.fetchContributors(owner, repo);
            const releasesData = await this.fetchReleases(owner, repo);

            const analysis = this.analyzeData(repoData, commitsData, issuesData, contributorsData, releasesData);
            this.displayResults(analysis);
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
        const url = `${this.apiBase}/repos/${owner}/${repo}`;
        return await this.fetchWithAuth(url);
    }

    async fetchCommits(owner, repo) {
        const url = `${this.apiBase}/repos/${owner}/${repo}/commits?per_page=100`;
        return await this.fetchWithAuth(url);
    }

    async fetchIssues(owner, repo) {
        const url = `${this.apiBase}/repos/${owner}/${repo}/issues?state=all&per_page=100&filter=all`;
        const issues = await this.fetchWithAuth(url);

        return issues.filter(issue => !issue.pull_request);
    }

    async fetchContributors(owner, repo) {
        const url = `${this.apiBase}/repos/${owner}/${repo}/contributors?per_page=100`;
        return await this.fetchWithAuth(url);
    }

    async fetchReleases(owner, repo) {
        const url = `${this.apiBase}/repos/${owner}/${repo}/releases`;
        return await this.fetchWithAuth(url);
    }

    analyzeData(repoData, commits, issues, contributors, releases) {

        const activityScore = this.calculateActivityScore(repoData, commits);
        
        const communityScore = this.calculateCommunityScore(issues);
        
        const maturityScore = this.calculateMaturityScore(repoData, releases);
        
        const docsScore = this.calculateDocumentationScore(repoData);
        
        const overallScore = Math.round(
            (activityScore * 0.3) + 
            (communityScore * 0.3) + 
            (maturityScore * 0.2) + 
            (docsScore * 0.2)
        );

        const recommendations = this.generateRecommendations({
            activityScore, communityScore, maturityScore, docsScore,
            repoData, issues, commits, releases
        });

        return {
            overallScore,
            activityScore,
            communityScore,
            maturityScore,
            docsScore,
            metrics: {
                lastCommit: commits[0]?.commit?.author?.date || 'N/A',
                commitCount: commits.length,
                contributorCount: contributors.length,
                openIssues: issues.filter(i => i.state === 'open').length,
                closedIssues: issues.filter(i => i.state === 'closed').length,
                responseTime: this.calculateResponseTime(issues),
                repoAge: new Date(repoData.created_at),
                latestRelease: releases[0]?.published_at || 'N/A',
                stars: repoData.stargazers_count,
                hasReadme: repoData.has_wiki ? '✅ Yes' : '❌ No',
                hasLicense: repoData.license ? '✅ Yes' : '❌ No',
                hasContributing: 'Not available via API'
            },
            recommendations
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

    calculateCommunityScore(issues) {
        if (!issues.length) return 50;

        const totalIssues = issues.length;
        const closedIssues = issues.filter(i => i.state === 'closed').length;
        const closureRate = (closedIssues / totalIssues) * 100;

        let closureScore;
        if (closureRate >= 80) closureScore = 100;
        else if (closureRate >= 60) closureScore = 80;
        else if (closureRate >= 40) closureScore = 60;
        else if (closureRate >= 20) closureScore = 40;
        else closureScore = 20;

        const responseScore = this.calculateResponseScore(issues);
        
        return Math.round((closureScore * 0.6) + (responseScore * 0.4));
    }

    calculateResponseScore(issues) {
        const recentIssues = issues.slice(0, 50).filter(i => i.comments > 0);
        if (!recentIssues.length) return 50;

        let totalResponseHours = 0;
        let counted = 0;

        for (const issue of recentIssues) {
            if (issue.comments > 0 && issue.comments_data) {

                totalResponseHours += 24; 
                counted++;
            }
        }

        if (counted === 0) return 50;
        
        const avgHours = totalResponseHours / counted;
        
        if (avgHours <= 24) return 100;
        if (avgHours <= 72) return 80;
        if (avgHours <= 168) return 60;
        if (avgHours <= 336) return 40;
        return 20;
    }

    calculateResponseTime(issues) {

        return 'Calculated with token';
    }

    calculateMaturityScore(repoData, releases) {
      
        const ageInYears = (Date.now() - new Date(repoData.created_at)) / (1000 * 3600 * 24 * 365);
        let ageScore;
        if (ageInYears >= 2) ageScore = 100;
        else if (ageInYears >= 1) ageScore = 80;
        else if (ageInYears >= 0.5) ageScore = 60;
        else ageScore = 40;

        
        let releaseScore = 50;
        if (releases.length > 0) {
            const lastRelease = new Date(releases[0].published_at);
            const monthsSinceRelease = (Date.now() - lastRelease) / (1000 * 3600 * 24 * 30);
            
            if (monthsSinceRelease <= 1) releaseScore = 100;
            else if (monthsSinceRelease <= 3) releaseScore = 80;
            else if (monthsSinceRelease <= 6) releaseScore = 60;
            else if (monthsSinceRelease <= 12) releaseScore = 40;
            else releaseScore = 20;
        }

    
        const starsScore = Math.min(100, (repoData.stargazers_count / 1000) * 20);

        return Math.round((ageScore * 0.4) + (releaseScore * 0.4) + (starsScore * 0.2));
    }

    calculateDocumentationScore(repoData) {
        let score = 0;
        
        if (repoData.description && repoData.description.length > 50) score += 30;
        else if (repoData.description) score += 20;
        
        if (repoData.has_wiki) score += 25;
        
        if (repoData.license) score += 25;
        
        if (repoData.homepage) score += 20;
        
        return Math.min(100, score);
    }

    generateRecommendations(scores) {
        const recommendations = [];
        
        if (scores.activityScore < 60) {
            recommendations.push('⚠️ Low activity detected. Consider looking for more actively maintained alternatives.');
        }
        
        if (scores.communityScore < 60) {
            recommendations.push('👥 Weak community engagement. Check if issues are being responded to promptly.');
        }
        
        if (scores.maturityScore < 60) {
            recommendations.push('📦 Project appears young or has low adoption. Evaluate stability requirements carefully.');
        }
        
        if (scores.docsScore < 70) {
            recommendations.push('📝 Documentation could be improved. Look for projects with better documentation.');
        }
        
        if (scores.overallScore >= 80) {
            recommendations.push('✅ This appears to be a healthy, well-maintained project!');
        } else if (scores.overallScore >= 60) {
            recommendations.push('👍 This project is reasonably healthy but has some areas for improvement.');
        } else {
            recommendations.push('⚠️ This project shows signs of being unhealthy. Consider alternatives if possible.');
        }
        
        return recommendations;
    }

    displayResults(analysis) {
        
        const scoreCircle = document.getElementById('overallScore');
        const scoreLabel = document.getElementById('scoreLabel');
        scoreCircle.textContent = analysis.overallScore;
        
        if (analysis.overallScore >= 80) {
            scoreLabel.textContent = 'Excellent - Very Healthy Project!';
            scoreCircle.style.background = '#28a745';
        } else if (analysis.overallScore >= 60) {
            scoreLabel.textContent = 'Good - Decent Health';
            scoreCircle.style.background = '#ffc107';
        } else {
            scoreLabel.textContent = 'Needs Improvement - Exercise Caution';
            scoreCircle.style.background = '#dc3545';
        }

        
        this.updateProgressBar('activityScore', analysis.activityScore);
        this.updateProgressBar('communityScore', analysis.communityScore);
        this.updateProgressBar('maturityScore', analysis.maturityScore);
        this.updateProgressBar('docsScore', analysis.docsScore);
        
        document.getElementById('activityScoreText').textContent = `Score: ${analysis.activityScore}%`;
        document.getElementById('communityScoreText').textContent = `Score: ${analysis.communityScore}%`;
        document.getElementById('maturityScoreText').textContent = `Score: ${analysis.maturityScore}%`;
        document.getElementById('docsScoreText').textContent = `Score: ${analysis.docsScore}%`;

        
        const metrics = analysis.metrics;
        document.getElementById('lastCommit').textContent = new Date(metrics.lastCommit).toLocaleDateString();
        document.getElementById('commitCount').textContent = metrics.commitCount;
        document.getElementById('contributorCount').textContent = metrics.contributorCount;
        document.getElementById('openIssues').textContent = metrics.openIssues;
        document.getElementById('closedIssues').textContent = metrics.closedIssues;
        document.getElementById('responseTime').textContent = metrics.responseTime;
        document.getElementById('repoAge').textContent = `${Math.floor((Date.now() - metrics.repoAge) / (1000 * 3600 * 24 * 365))} years`;
        document.getElementById('latestRelease').textContent = metrics.latestRelease !== 'N/A' ? new Date(metrics.latestRelease).toLocaleDateString() : 'No releases';
        document.getElementById('stars').textContent = metrics.stars.toLocaleString();
        document.getElementById('hasReadme').textContent = metrics.hasReadme;
        document.getElementById('hasLicense').textContent = metrics.hasLicense;
        document.getElementById('hasContributing').textContent = metrics.hasContributing;

        
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = analysis.recommendations.map(rec => `<li>${rec}</li>`).join('');

        this.showResults();
    }

    updateProgressBar(elementId, score) {
        const progressBar = document.getElementById(elementId);
        progressBar.style.width = `${score}%`;
        
        
        if (score >= 80) {
            progressBar.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
        } else if (score >= 60) {
            progressBar.style.background = 'linear-gradient(90deg, #ffc107, #fd7e14)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #dc3545, #c82333)';
        }
    }

    exportReport() {
        const results = document.getElementById('results').innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>GitHub Health Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #667eea; }
                    </style>
                </head>
                <body>
                    <h1>GitHub Repository Health Report</h1>
                    ${results}
                </body>
            </html>
        `);
        win.document.close();
        win.print();
    }

    clearForNew() {
        document.getElementById('repoInput').value = '';
        this.hideResults();
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showResults() {
        document.getElementById('results').style.display = 'block';
    }

    hideResults() {
        document.getElementById('results').style.display = 'none';
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