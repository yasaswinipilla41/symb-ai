import json
import re

database = {
    "ai-tools": {
        "title": "AI Tools",
        "sectionTitle": "AI Tools",
        "items": [
            {"name": "Cursor", "description": "An AI-first code editor built on VS Code. Features composer, tab completion, chat, and codebase indexing.", "url": "https://www.cursor.com/", "badges": ["NEW"]},
            {"name": "Claude Code", "description": "Anthropic's command-line tool for Claude. Exceptional at complex reasoning, reading large codebases, and architectural discussions.", "url": "https://claude.ai/", "badges": []},
            {"name": "Lovable", "description": "An AI development platform that builds full-stack web apps from text descriptions.", "url": "https://lovable.dev/", "badges": ["NEW"]},
            {"name": "Stitch", "description": "An advanced AI-driven UI component generator and front-end copilot.", "url": "https://stitch.dev/", "badges": []},
            {"name": "Antigravity", "description": "Google DeepMind's advanced agentic AI coding assistant.", "url": "#", "badges": ["NEW"]},
            {"name": "Visual Studio Code", "description": "Microsoft's lightweight but powerful source code editor, extensible via thousands of plugins including AI assistants.", "url": "https://code.visualstudio.com/", "badges": []}
        ]
    },
    "frameworks-agents": {
        "title": "Frameworks & Agents",
        "sectionTitle": "Frameworks & Agents",
        "items": [
            {"name": "LangChain", "description": "Framework for developing applications powered by language models.", "url": "https://www.langchain.com/", "badges": ["DOCS"]},
            {"name": "LangGraph", "description": "Build stateful, multi-actor applications with LLMs.", "url": "https://www.langchain.com/langgraph", "badges": []},
            {"name": "Hugging Face", "description": "The AI community building the future. Build, train and deploy state of the art models powered by the reference open source in machine learning.", "url": "https://huggingface.co/", "badges": []},
            {"name": "Vercel AI SDK", "description": "The Vercel AI SDK is a library for building AI-powered streaming text and chat UIs.", "url": "https://sdk.vercel.ai/", "badges": ["DOCS"]},
            {"name": "Azure AI Foundry", "description": "Build, evaluate, and deploy generative AI solutions and custom copilots.", "url": "https://azure.microsoft.com/en-us/products/ai-services/ai-foundry", "badges": []}
        ]
    },
    "mcp-tools": {
        "title": "Mcp Tools",
        "sectionTitle": "Mcp Tools",
        "items": [
            {"name": "Model Context Protocol", "description": "An open standard by Anthropic that enables developers to build secure, two-way connections between AI models and their data sources/tools.", "url": "https://modelcontextprotocol.io/", "badges": ["DOCS"]},
            {"name": "Postgres MCP", "description": "An MCP server that allows AI assistants to securely inspect schemas, run queries, and analyze data in PostgreSQL.", "url": "https://github.com/modelcontextprotocol/servers", "badges": []},
            {"name": "Power BI MCP", "description": "An MCP server for connecting AI assistants to Microsoft Power BI datasets and reports.", "url": "https://github.com/modelcontextprotocol/servers", "badges": []},
            {"name": "GitHub MCP", "description": "An MCP server to interact with GitHub repositories, issues, and pull requests.", "url": "https://github.com/modelcontextprotocol/servers", "badges": []},
            {"name": "Azure MCP", "description": "An MCP server to interact with Microsoft Azure resources and APIs.", "url": "https://github.com/modelcontextprotocol/servers", "badges": []},
            {"name": "Composio", "description": "A platform offering hundreds of production-ready MCP servers to connect AI agents with external tools and APIs.", "url": "https://composio.dev/", "badges": ["NEW"]}
        ]
    },
    "data-analytics": {
        "title": "Data & Analytics",
        "sectionTitle": "Data & Analytics",
        "items": [
            {"name": "Microsoft Fabric", "description": "An all-in-one analytics solution for enterprises that covers everything from data movement to data science, Real-Time Analytics, and business intelligence.", "url": "https://www.microsoft.com/en-us/microsoft-fabric", "badges": ["NEW"]},
            {"name": "Cube.dev", "description": "The universal semantic layer for building data apps. Organize data securely and deliver it to any application.", "url": "https://cube.dev/", "badges": []},
            {"name": "Azure AI Search", "description": "An AI-powered information retrieval platform that helps developers build rich search experiences and generative AI apps.", "url": "https://azure.microsoft.com/en-us/products/ai-services/ai-search", "badges": []},
            {"name": "Power BI", "description": "Interactive data visualization software product developed by Microsoft with primary focus on business intelligence.", "url": "https://powerbi.microsoft.com/", "badges": []},
            {"name": "Looker", "description": "Enterprise platform for BI, data applications, and embedded analytics developed by Google Cloud.", "url": "https://cloud.google.com/looker", "badges": []}
        ]
    },
    "web-analytics": {
        "title": "Web Analytics",
        "sectionTitle": "Web Analytics",
        "items": [
            {"name": "Microsoft Clarity", "description": "A free user behavior analytics tool that helps you understand how users are interacting with your website through session replays and heatmaps.", "url": "https://clarity.microsoft.com/", "badges": []},
            {"name": "Google Analytics", "description": "Google's primary web and app analytics tool. Tracks user journeys, engagement, conversions, and provides machine-learning insights.", "url": "https://analytics.google.com/", "badges": ["DOCS"]},
            {"name": "Google Tag Manager", "description": "A tag management system that allows you to quickly and easily update measurement codes and related code fragments collectively known as tags on your website or mobile app.", "url": "https://tagmanager.google.com/", "badges": []}
        ]
    },
    "backend-infra": {
        "title": "Backend & Infra",
        "sectionTitle": "Backend & Infra",
        "items": [
            {"name": "n8n", "description": "A free and open workflow automation tool. Easily build complex automations and connect anything to everything.", "url": "https://n8n.io/", "badges": []},
            {"name": "Supabase", "description": "The open-source Firebase alternative. Provides a Postgres database, authentication, instant APIs, Edge Functions, and real-time subscriptions.", "url": "https://supabase.com/", "badges": ["DOCS"]},
            {"name": "Firebase", "description": "Google's mobile platform that helps you quickly develop high-quality apps and grow your business.", "url": "https://firebase.google.com/", "badges": []}
        ]
    },
    "hosting-domains": {
        "title": "Hosting & Domains",
        "sectionTitle": "Hosting & Domains",
        "items": [
            {"name": "Vercel", "description": "Cloud platform for frontend developers. Optimized for Next.js, providing instant deployments, global CDN, serverless functions, and analytics.", "url": "https://vercel.com/", "badges": ["DOCS"]},
            {"name": "Railway", "description": "Infrastructure platform where you can provision databases, deploy servers, and manage fullstack applications with minimal configuration.", "url": "https://railway.app/", "badges": ["NEW"]},
            {"name": "Cloudflare", "description": "Global network designed to make everything you connect to the Internet secure, private, fast, and reliable.", "url": "https://www.cloudflare.com/", "badges": []},
            {"name": "Namecheap", "description": "Domain registrar and web hosting company. Provides domain registration, DNS management, SSL certificates, and affordable hosting options.", "url": "https://www.namecheap.com/", "badges": []}
        ]
    },
    "web-scraping": {
        "title": "Web Scraping",
        "sectionTitle": "Web Scraping",
        "items": [
            {"name": "Firecrawl", "description": "Turn entire websites into clean markdown or structured data. Built specifically for LLM applications to scrape and crawl pages with ease.", "url": "https://www.firecrawl.dev/", "badges": ["NEW"]},
            {"name": "Apify", "description": "A platform for web scraping and data extraction. Easily create web scrapers to extract data from any website.", "url": "https://apify.com/", "badges": []}
        ]
    },
    "erp-business": {
        "title": "ERP & Business",
        "sectionTitle": "ERP & Business",
        "items": [
            {"name": "Frappe / ERPNext", "description": "Free and open-source integrated Enterprise Resource Planning (ERP) software. Built on the Frappe framework.", "url": "https://erpnext.com/", "badges": []},
            {"name": "Odoo", "description": "Open-source suite of business apps. Covers CRM, eCommerce, billing, accounting, manufacturing, warehouse, and project management.", "url": "https://www.odoo.com/", "badges": ["DOCS"]}
        ]
    },
    "payments": {
        "title": "Payments",
        "sectionTitle": "Payments",
        "items": [
            {"name": "Stripe", "description": "Financial infrastructure for the internet. Payment processing, subscription billing, fraud prevention, and global payout APIs.", "url": "https://stripe.com/", "badges": ["DOCS"]}
        ]
    },
    "azure": {
        "title": "Azure",
        "sectionTitle": "Azure",
        "items": [
            {"name": "Azure App Service", "description": "A fully managed platform for building, deploying, and scaling web apps.", "url": "https://azure.microsoft.com/en-us/products/app-service", "badges": ["DOCS"]},
            {"name": "Azure Key Vault", "description": "Cloud service for securely storing and accessing secrets, keys, and certificates.", "url": "https://azure.microsoft.com/en-us/products/key-vault", "badges": []},
            {"name": "Azure Data Factory", "description": "Cloud-based data integration service that allows you to create data-driven workflows for orchestrating data movement and transforming data at scale.", "url": "https://azure.microsoft.com/en-us/products/data-factory", "badges": []},
            {"name": "Azure API Management", "description": "A hybrid, multicloud management platform for APIs across all environments.", "url": "https://azure.microsoft.com/en-us/products/api-management", "badges": []},
            {"name": "Microsoft Entra External ID", "description": "A highly customizable customer identity and access management (CIAM) solution.", "url": "https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-external-id", "badges": []}
        ]
    },
    "aws": {
        "title": "AWS",
        "sectionTitle": "AWS",
        "items": [
            {"name": "AWS EC2", "description": "Secure and resizable compute capacity for virtually any workload.", "url": "https://aws.amazon.com/ec2/", "badges": ["DOCS"]},
            {"name": "AWS Lambda", "description": "Run code without thinking about servers or clusters.", "url": "https://aws.amazon.com/lambda/", "badges": []},
            {"name": "AWS S3", "description": "Object storage built to retrieve any amount of data from anywhere.", "url": "https://aws.amazon.com/s3/", "badges": []},
            {"name": "AWS Glue", "description": "A serverless data integration service that makes it easy to discover, prepare, and combine data for analytics, machine learning, and application development.", "url": "https://aws.amazon.com/glue/", "badges": []},
            {"name": "AWS Athena", "description": "A serverless, interactive analytics service to query data and analyze big data in Amazon S3 using standard SQL.", "url": "https://aws.amazon.com/athena/", "badges": []}
        ]
    },
    "react": {
        "title": "React",
        "sectionTitle": "React",
        "items": [
            {"name": "React", "description": "The library for web and native user interfaces.", "url": "https://react.dev/", "badges": ["DOCS"]},
            {"name": "Next.js", "description": "The React Framework for the Web. Enables you to create high-quality web applications with the power of React components.", "url": "https://nextjs.org/", "badges": ["DOCS"]}
        ]
    },
    "mobile-frameworks": {
        "title": "Frameworks",
        "sectionTitle": "Frameworks",
        "items": [
            {"name": "React Native", "description": "Build native iOS and Android apps using React and JavaScript. Write once, run everywhere with native performance.", "url": "https://reactnative.dev/", "badges": ["DOCS"]},
            {"name": "Expo", "description": "An open-source platform for making universal native apps for Android, iOS, and the web with JavaScript and React.", "url": "https://expo.dev/", "badges": ["NEW"]},
            {"name": "Flutter", "description": "Google's UI toolkit for building beautiful, natively compiled applications for mobile, web, desktop, and embedded devices.", "url": "https://flutter.dev/", "badges": []}
        ]
    },
    "cicd-distribution": {
        "title": "CI/CD & Distribution",
        "sectionTitle": "CI/CD & Distribution",
        "items": [
            {"name": "Codemagic", "description": "CI/CD built specifically for mobile. Automated builds, code signing, and distribution for React Native, Flutter, and native iOS/Android apps.", "url": "https://codemagic.io/start/", "badges": ["NEW"]},
            {"name": "TestFlight", "description": "Apple's official platform for distributing iOS beta builds to testers.", "url": "https://developer.apple.com/testflight/", "badges": []},
            {"name": "Firebase App Distribution", "description": "Distribute pre-release iOS and Android builds to testers in seconds.", "url": "https://firebase.google.com/products/app-distribution", "badges": []},
            {"name": "Google Play", "description": "Android app distribution via the Play Store. Internal/closed/open testing tracks.", "url": "https://play.google.com/console/signup", "badges": []}
        ]
    },
    "source-control": {
        "title": "Source Control",
        "sectionTitle": "Source Control",
        "items": [
            {"name": "GitHub", "description": "The standard for source control. Pull requests, code review, Issues, Projects, and GitHub Actions.", "url": "https://github.com/", "badges": ["DOCS"]},
            {"name": "Azure DevOps", "description": "Microsoft's DevOps platform with Repos (Git), Pipelines (CI/CD), Boards (work tracking), and Artifacts.", "url": "https://azure.microsoft.com/en-gb/products/devops/", "badges": []}
        ]
    },
    "iac": {
        "title": "Infrastructure as Code",
        "sectionTitle": "Infrastructure as Code",
        "items": [
            {"name": "Terraform", "description": "Industry-standard IaC tool by HashiCorp. Provision and manage cloud infrastructure across AWS, Azure, GCP.", "url": "https://developer.hashicorp.com/terraform", "badges": []},
            {"name": "Azure Bicep", "description": "Microsoft's DSL for deploying Azure resources. A cleaner alternative to ARM templates.", "url": "https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/", "badges": []},
            {"name": "Azure AZD", "description": "Azure Developer CLI — scaffold, provision, and deploy full Azure applications in one command.", "url": "https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/", "badges": ["NEW"]}
        ]
    },
    "testing": {
        "title": "Testing",
        "sectionTitle": "Testing",
        "items": [
            {"name": "Playwright", "description": "Microsoft's end-to-end testing framework for web apps. Supports Chromium, Firefox, and WebKit.", "url": "https://playwright.dev/", "badges": ["NEW"]}
        ]
    },
    "design-tools": {
        "title": "Design Tools",
        "sectionTitle": "Design Tools",
        "items": [
            {"name": "Figma", "description": "The standard for UI/UX design. Collaborative, browser-based, and packed with plugins.", "url": "https://www.figma.com/", "badges": []},
            {"name": "Canva", "description": "Easy-to-use design platform for marketing materials, presentations, social media, and more.", "url": "https://www.canva.com/", "badges": []},
            {"name": "FigJam", "description": "Figma's online whiteboard for brainstorming, diagramming, and workshops.", "url": "https://www.figma.com/figjam/", "badges": []},
            {"name": "Miro", "description": "Collaborative visual workspace for teams. Ideal for sprint planning, user journey mapping.", "url": "https://miro.com/", "badges": []}
        ]
    },
    "animation": {
        "title": "Animation",
        "sectionTitle": "Animation",
        "items": [
            {"name": "GSAP", "description": "Industry-standard JavaScript animation library. Blazing fast, works everywhere.", "url": "https://gsap.com/", "badges": []},
            {"name": "Lottie", "description": "Render Adobe After Effects animations natively on web, iOS, and Android.", "url": "https://lottiefiles.com/", "badges": []},
            {"name": "Motion", "description": "The animation library for React. Formerly Framer Motion.", "url": "https://motion.dev/", "badges": ["NEW"]}
        ]
    },
    "colors": {
        "title": "Colors",
        "sectionTitle": "Colors",
        "items": [
            {"name": "Flat UI Colors", "description": "Curated flat color palettes from designers around the world.", "url": "https://flatuicolors.com/", "badges": []}
        ]
    },
    "icons": {
        "title": "Icons",
        "sectionTitle": "Icons",
        "items": [
            {"name": "Ionicons", "description": "Premium open-source icon set by Ionic. 1,300+ icons with outline, filled, and sharp variants.", "url": "https://ionic.io/ionicons", "badges": []}
        ]
    },
    "note-taking": {
        "title": "Note Taking",
        "sectionTitle": "Note Taking",
        "items": [
            {"name": "Notion", "description": "All-in-one workspace for notes, docs, wikis, and project management.", "url": "https://www.notion.com/", "badges": []},
            {"name": "Microsoft Loop", "description": "Microsoft's collaborative workspace app. Loop components work across Teams, Outlook, and Office.", "url": "https://loop.cloud.microsoft/", "badges": []}
        ]
    },
    "task-management": {
        "title": "Task Management",
        "sectionTitle": "Task Management",
        "items": [
            {"name": "TickTick", "description": "Task manager and to-do app with calendar view, habits, Pomodoro timer, and smart lists.", "url": "https://ticktick.com/", "badges": []}
        ]
    }
}

# Add tags to each item dynamically
for cat_id, cat_data in database.items():
    for item in cat_data['items']:
        item['tags'] = [cat_data['title']]

# Update script.js
with open('script.js', 'r', encoding='utf-8') as f:
    script_content = f.read()

# Replace the database variable in script.js
# We find everything before `document.addEventListener('DOMContentLoaded'`
import re
new_script_content = f"const database = {json.dumps(database, indent=4)};\n\n"
new_script_content += script_content[script_content.find("document.addEventListener('DOMContentLoaded', () => {"):]

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(new_script_content)

# Update index.html badge counts
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update All Resources count
total_resources = sum(len(c['items']) for c in database.values())
html = re.sub(r'(data-category="all".*?<span class="badge">)\d+(</span>)', rf'\g<1>{total_resources}\g<2>', html, flags=re.DOTALL)

# Update category counts
for cat_id, cat_data in database.items():
    count = len(cat_data['items'])
    pattern = rf'(data-category="{cat_id}".*?<span class="badge">)\d+(</span>)'
    html = re.sub(pattern, rf'\g<1>{count}\g<2>', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated script.js and index.html successfully!")
