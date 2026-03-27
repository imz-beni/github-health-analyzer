# GitHub Repository Health Analyzer 📊

> **Assignment:** Playing Around with APIs
> **Author:** IMANZI Beni   
> **Course/Section:** Web infrastructure.
> **Video Demo:** https://youtu.be/9SbV8MT4EFM

## 🌐 Live Demo
The application has been fully deployed and is actively load-balanced across multiple web servers. You can access the live working version of the app at the Load Balancer IP below:
- **Live URL:** `http://52.70.209.67` 

## 📋 Table of Contents
1. [Live Demo](#-live-demo)
2. [Meaningful Purpose and Value](#-meaningful-purpose-and-value)
3. [Health Metrics Scoring System](#-health-metrics-scoring-system)
4. [API Integration, Usage & Rate Limits](#-api-integration-usage--rate-limits)
5. [Security & .gitignore Explanation](#-security---gitignore-explanation)
6. [Data Interaction & User Experience](#-data-interaction--user-experience)
7. [Prerequisites](#-prerequisites)
8. [Local Implementation Instructions](#-local-implementation-instructions)
9. [Server Deployment & Load Balancer Setup](#-server-deployment--load-balancer-setup)
10. [Verification & Load Balancer Testing](#-verification--load-balancer-testing)
11. [Troubleshooting](#-troubleshooting)
12. [Challenges Encountered & Solutions](#-challenges-encountered--solutions)
13. [Credits and Attribution](#-credits-and-attribution)

---

## 🎯 Meaningful Purpose and Value
The **GitHub Repository Health Analyzer** is a web-based diagnostic tool designed to solve a genuine, practical problem for software developers: deciding whether an open-source project is safe to adopt.

Instead of a gimmicky toy, this application provides **substantial value** by fetching comprehensive metrics across four critical areas:
- **Activity:** Commit recency, frequency, and contributor count.
- **Community Health:** Issue response times and closure rates.
- **Project Maturity:** Repository age, recent releases, and star count.
- **Documentation:** README, license, and wiki availability.

By aggregating these metrics securely and calculating an automated "Overall Health Score," developers can avoid adopting unmaintained legacy codebases.

---

## 📈 Health Metrics Scoring System
The application calculates a weighted "Overall Health Score" based on 5 primary pillars. Below is the exact scoring matrix implemented to evaluate any repository:

### A. Activity Metrics (25% weight)
- **Last commit date:** If within 1 week = 100%, 1 month = 80%, 3 months = 50%, 6+ months = 20%
- **Commit frequency (last 90 days):** 50 commits = 100%, 20-50 = 75%, 5-20 = 50%, <5 = 25%
- **Contributor count:** 10 active = 100%, 5-10 = 75%, 1-4 = 50%, 0 = 0%

### B. Community Health (25% weight)
- **Issue response time (average time to first comment):** <1 day = 100%, <3 days = 75%, <1 week = 50%, >1 week = 25%
- **Issue closure rate (percentage closed in last 90 days):** 80% = 100%, 60-80% = 75%, 40-60% = 50%, <40% = 25%
- **Open issues vs. closed ratio:** <10% open = 100%, 10-30% = 75%, 30-50% = 50%, >50% = 25%

### C. Pull Request Health (20% weight)
- **PR merge time (average days to merge):** <1 day = 100%, 1-3 days = 75%, 3-7 days = 50%, >7 days = 25%
- **PR acceptance rate:** 80% = 100%, 60-80% = 75%, 40-60% = 50%, <40% = 25%
- **Open PRs count (relative to closed):** <10% open = 100%, 10-20% = 75%, 20-30% = 50%, >30% = 25%

### D. Project Maturity (15% weight)
- **Age of project (first commit to present):** 2 years = 100%, 1-2 years = 75%, 6-12 months = 50%, <6 months = 25%
- **Recent release (last version):** <1 month = 100%, <3 months = 75%, <6 months = 50%, >6 months = 25%
- **Release frequency (releases per year):** 10 = 100%, 5-10 = 75%, 1-5 = 50%, 0 = 25%

### E. Documentation & Best Practices (15% weight)
- **Has README (comprehensive):** 25%
- **Has LICENSE:** 25%
- **Has CONTRIBUTING.md:** 15%
- **Has CODE_OF_CONDUCT.md:** 15%
- **Has issue templates:** 10%
- **Has PR template:** 10%

---

## 🔌 API Integration, Usage & Rate Limits
This application strictly leverages the **[GitHub REST API (v3)](https://docs.github.com/en/rest)** to fetch real-time public repository data. 

**Endpoints Used:**
- `GET https://api.github.com/repos/{owner}/{repo}` - Fetches core repository statistics.
- `GET https://api.github.com/repos/{owner}/{repo}/commits` - Fetches the commit history.
- `GET https://api.github.com/repos/{owner}/{repo}/issues` - Gathers issue queues to calculate response rates.
- `GET https://api.github.com/repos/{owner}/{repo}/contributors` - Identifies community breadth.
- `GET https://api.github.com/repos/{owner}/{repo}/releases` - Scans for recent production releases.

### 🚦 Rate Limiting
According to the GitHub REST API documentation, unauthenticated requests are strictly capped at **60 requests per hour** per IP address. The application catches `403 Forbidden` API limitations securely and instructs the user to insert a completely optional **Personal Access Token**, instantly raising the quota to **5,000 requests per hour**.

---

## 🔒 Security & .gitignore Explanation
Security was a critical focus of this assignment. No API keys were hardcoded into the javascript payload.
Instead of exposing any credentials:
- Users provide a token dynamically through a local, secure `<input type="password">` field.
- The `Authorization: token <token>` header is sent directly to GitHub securely using HTTPS.

**Why the `.gitignore`?**
A well-structured `.gitignore` file was included in this repository to actively prevent sensitive OS files (like `.DS_Store`), editor workspace caches (`.vscode/`), and most importantly, environment configuration files (like `.env`) from accidentally being committed, eliminating the chance of exposing a developer's local API keys to the public web.

---

## 🕹️ Data Interaction & User Experience
The application allows users to actively interact with the data by:
1. **Searching:** Querying any string formatted as `owner/repo` or passing full URLs. The input is cleaned and validated.
2. **Filtering:** Under the hood, the raw GitHub `issues` payload natively includes Pull Requests. Our logic parses and explicitly *filters out* PRs to perform clean statistical analysis purely on user-reported issues.
3. **Error Handling & Feedback:** 
   - `404 Not Found`: Displays "Repository not found" if the user misspells a repository.
   - `403 Forbidden`: Caught gracefully to inform the user that IP-based rate limiting has occurred.
   - Displays an intuitive UI-bound error message (red banner) instead of failing silently in the browser console.

---

## 🛠️ Prerequisites
- A modern web browser (Google Chrome, Firefox, Safari).
- Basic bash terminal to deploy onto Nginx servers.
- A free [GitHub Personal Access Token](https://github.com/settings/tokens) (Optional, but highly recommended for frequent use).

---

## 💻 Local Implementation Instructions

To run this application successfully on your local machine:

1. **Clone the repository**:
   ```bash
   git clone <your-repo-link>
   cd github-health-analyzer
   ```
2. **Open the web application**: 
   Since this is a vanilla HTML/CSS/JS frontend application, no build tools (like `npm`) are required. Simply open the `index.html` file in your browser:
   ```bash
   # On Mac:
   open index.html
   # On Linux:
   xdg-open index.html
   # On Windows:
   start index.html
   ```
3. Type a public repository handle (e.g., `facebook/react`) and click **Analyze**.

---

## 🌐 Server Deployment & Load Balancer Setup

This application was successfully deployed onto three web servers provided for the assignment. Nginx is installed on both standard servers, and HAProxy handles load distribution.

### 1. Web01 Deployment
```bash
# Connect to Web01 
ssh ubuntu@<Web01-IP>

# Install Nginx
sudo apt update && sudo apt install -y nginx

# Clone the repository code directly into the web root
sudo git clone <your-repo-link> /var/www/html/app
sudo cp -r /var/www/html/app/* /var/www/html/
sudo rm /var/www/html/index.nginx-debian.html

# Restart the service
sudo systemctl restart nginx
```

### 2. Web02 Deployment 
The exact same steps are repeated for the secondary web server to ensure code redundancy.
```bash
# Connect to Web02 
ssh ubuntu@<Web02-IP>

# Install Nginx and deploy code
sudo apt update && sudo apt install -y nginx
sudo git clone <your-repo-link> /var/www/html/app
sudo cp -r /var/www/html/app/* /var/www/html/
sudo rm /var/www/html/index.nginx-debian.html

sudo systemctl restart nginx
```

### 3. Load Balancer Configuration (Lb01)
To ensure reliability and scalable performance, HAProxy routes inbound HTTP traffic evenly across Web01 and Web02 utilizing the **Round Robin** algorithm.

```bash
# Connect to Lb01
ssh ubuntu@<Lb01-IP>

# Install HAProxy
sudo apt update && sudo apt install -y haproxy

# Edit configuration file
sudo nano /etc/haproxy/haproxy.cfg
```
Add the following blocks to the configuration to dictate traffic flow:
```haproxy
frontend http_front
    bind *:80
    default_backend web_servers

backend web_servers
    balance roundrobin
    server web01 <Web01-IP>:80 check
    server web02 <Web02-IP>:80 check
```
Restart HAProxy to apply the changes: `sudo systemctl restart haproxy`.

---

## 🧪 Verification & Load Balancer Testing

Testing is critical to ensure traffic is correctly alternating between our web servers. Follow these exact steps to verify the Load Balancer is successfully implementing the Round Robin algorithm:

1. Open two separate terminal windows for **Web01** and **Web02**.
2. Run the Nginx access-log monitoring command on both servers simultaneously:
   ```bash
   # On both Web01 and Web02
   sudo tail -f /var/log/nginx/access.log
   ```
3. On a third local terminal, continuously send HTTP `GET` requests to the **Load Balancer's public IP**:
   ```bash
   while sleep 1; do curl http://<Lb01-IP>; done
   ```
4. **Expected Result:** Watching the log terminals, you will see a request successfully populate on `Web01` followed strictly by a request on `Web02` in an alternating manner, perfectly balancing the traffic footprint!

---

## 🔧 Troubleshooting
- **Logs showing errors but site loads?** This may be the API returning a `403` error when parsing rate limits. Simply input your GitHub Token into the web interface.
- **Nginx failing to start?** Check if another service (like Apache2) is currently locking port 80 using `sudo lsof -i :80` and terminate it before attempting `systemctl restart nginx`.
- **503 Service Unavailable via Lb01?** Ensure both Nginx instances on Web01 and Web02 have port 80 openly allowed through `ufw` firewall (`sudo ufw allow 'Nginx Full'`).

---

## 🚧 Challenges Encountered & Solutions
1. **Challenge:** Severe API Rate Limiting during local testing (`403 Forbidden` API blockages at exactly 60 requests).
   **Solution:** I mitigated this by dynamically securing a token-injectable UI element. Instead of hardcoding keys (which would violate assignment security policies), the script intercepts a user's GitHub Token at runtime, applying it to HTTPS header requests to drastically push the limit up to 5000 requests/hour.
   
2. **Challenge:** Massive payload data. Giant repositories (e.g. `torvalds/linux`) contain millions of commits, making API requests incredibly slow and truncated to 30 elements by default.
   **Solution:** I utilized GitHub's Query Parameters (`?per_page=100`) directly attached to my fetch links. This single performance optimization provided maximum statistical accuracy about recent issues and commits strictly within a single API hit, bypassing expensive sequential pagination loops entirely.

---

## 📜 Credits and Attribution

- **[GitHub REST API v3](https://docs.github.com/en/rest):** All raw backend repository data is fetched securely courtesy of GitHub's excellent external REST service.
- **[Google Fonts (System Defaults)](https://fonts.google.com/):** OS-level fonts are specifically requested for optimized cross-platform loading states.
- **Vanilla JavaScript Frameworking:** I deliberately avoided bloated library packages (React/Vue) or heavy CSS processors to guarantee maximal performance rendering specifically for this assignment's guidelines limit. 

*This application was written entirely natively to assure quality and optimal resource management.*
