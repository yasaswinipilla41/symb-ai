const database = {
    "ai-tools": {
        "title": "AI Tools",
        "sectionTitle": "AI Tools",
        "items": [
            {
                "name": "Cursor",
                "description": "An AI-first code editor built on VS Code. Features composer, tab completion, chat, and codebase indexing.",
                "url": "https://www.cursor.com/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "AI Tools"
                ],
                "popupDetails": {
                    "overview": "Cursor is an AI-powered code editor built on VS Code. It is designed to speed up day-to-day development with AI assistance, snippet generation, and smarter navigation.",
                    "sections": [
                        {
                            "title": "Models",
                            "table": {
                                "headers": ["Model", "When to use"],
                                "rows": [
                                    ["claude-sonnet-4.6", "Default for everything — coding, refactoring, debugging"],
                                    ["claude-opus-4", "Only for genuinely complex tasks: deep architecture decisions, hard bugs"]
                                ]
                            }
                        },
                        {
                            "title": "Advice",
                            "content": "Avoid: Auto — Auto-selects models unpredictably and often generates low-quality or irrelevant code. Stick with Sonnet 4.6 as your default. Opus is slower and expensive — only reach for it when Sonnet is clearly struggling."
                        },
                        {
                            "title": "Project Rules",
                            "content": "Add a .cursorrules file to your project root. Cursor reads it automatically on every session — great for enforcing conventions without repeating yourself."
                        },
                        {
                            "title": "Tips",
                            "content": "Use @codebase in chat to search your whole project before asking questions — prevents hallucinated solutions. When Composer makes a mistake, keep iterating in the same thread."
                        }
                    ]
                }
            },
            {
                "name": "Claude Code",
                "description": "Anthropic's command-line tool for Claude. Exceptional at complex reasoning, reading large codebases, and architectural discussions.",
                "url": "https://claude.ai/",
                "badges": [],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Lovable",
                "description": "An AI development platform that builds full-stack web apps from text descriptions.",
                "url": "https://lovable.dev/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Stitch",
                "description": "An advanced AI-driven UI component generator and front-end copilot.",
                "url": "https://stitch.dev/",
                "badges": [],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Antigravity",
                "description": "Google DeepMind's advanced agentic AI coding assistant.",
                "url": "#",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Visual Studio Code",
                "description": "Microsoft's lightweight but powerful source code editor, extensible via thousands of plugins including AI assistants.",
                "url": "https://code.visualstudio.com/",
                "badges": [],
                "tags": [
                    "AI Tools"
                ]
            }
        ]
    },
    "frameworks-agents": {
        "title": "Frameworks & Agents",
        "sectionTitle": "Frameworks & Agents",
        "items": [
            {
                "name": "LangChain",
                "description": "Framework for developing applications powered by language models.",
                "url": "https://www.langchain.com/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "LangGraph",
                "description": "Build stateful, multi-actor applications with LLMs.",
                "url": "https://www.langchain.com/langgraph",
                "badges": [],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "Hugging Face",
                "description": "The AI community building the future. Build, train and deploy state of the art models powered by the reference open source in machine learning.",
                "url": "https://huggingface.co/",
                "badges": [],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "Vercel AI SDK",
                "description": "The Vercel AI SDK is a library for building AI-powered streaming text and chat UIs.",
                "url": "https://sdk.vercel.ai/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "Azure AI Foundry",
                "description": "Build, evaluate, and deploy generative AI solutions and custom copilots.",
                "url": "https://azure.microsoft.com/en-us/products/ai-services/ai-foundry",
                "badges": [],
                "tags": [
                    "Frameworks & Agents"
                ]
            }
        ]
    },
    "mcp-tools": {
        "title": "Mcp Tools",
        "sectionTitle": "Mcp Tools",
        "items": [
            {
                "name": "Model Context Protocol",
                "description": "An open standard by Anthropic that enables developers to build secure, two-way connections between AI models and their data sources/tools.",
                "url": "https://modelcontextprotocol.io/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Postgres MCP",
                "description": "An MCP server that allows AI assistants to securely inspect schemas, run queries, and analyze data in PostgreSQL.",
                "url": "https://github.com/modelcontextprotocol/servers",
                "badges": [],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Power BI MCP",
                "description": "An MCP server for connecting AI assistants to Microsoft Power BI datasets and reports.",
                "url": "https://github.com/modelcontextprotocol/servers",
                "badges": [],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "GitHub MCP",
                "description": "An MCP server to interact with GitHub repositories, issues, and pull requests.",
                "url": "https://github.com/modelcontextprotocol/servers",
                "badges": [],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Azure MCP",
                "description": "An MCP server to interact with Microsoft Azure resources and APIs.",
                "url": "https://github.com/modelcontextprotocol/servers",
                "badges": [],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Composio",
                "description": "A platform offering hundreds of production-ready MCP servers to connect AI agents with external tools and APIs.",
                "url": "https://composio.dev/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Mcp Tools"
                ]
            }
        ]
    },
    "data-analytics": {
        "title": "Data & Analytics",
        "sectionTitle": "Data & Analytics",
        "items": [
            {
                "name": "Microsoft Fabric",
                "description": "An all-in-one analytics solution for enterprises that covers everything from data movement to data science, Real-Time Analytics, and business intelligence.",
                "url": "https://www.microsoft.com/en-us/microsoft-fabric",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Cube.dev",
                "description": "The universal semantic layer for building data apps. Organize data securely and deliver it to any application.",
                "url": "https://cube.dev/",
                "badges": [],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Azure AI Search",
                "description": "An AI-powered information retrieval platform that helps developers build rich search experiences and generative AI apps.",
                "url": "https://azure.microsoft.com/en-us/products/ai-services/ai-search",
                "badges": [],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Power BI",
                "description": "Interactive data visualization software product developed by Microsoft with primary focus on business intelligence.",
                "url": "https://powerbi.microsoft.com/",
                "badges": [],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Looker",
                "description": "Enterprise platform for BI, data applications, and embedded analytics developed by Google Cloud.",
                "url": "https://cloud.google.com/looker",
                "badges": [],
                "tags": [
                    "Data & Analytics"
                ]
            }
        ]
    },
    "web-analytics": {
        "title": "Web Analytics",
        "sectionTitle": "Web Analytics",
        "items": [
            {
                "name": "Microsoft Clarity",
                "description": "A free user behavior analytics tool that helps you understand how users are interacting with your website through session replays and heatmaps.",
                "url": "https://clarity.microsoft.com/",
                "badges": [],
                "tags": [
                    "Web Analytics"
                ]
            },
            {
                "name": "Google Analytics",
                "description": "Google's primary web and app analytics tool. Tracks user journeys, engagement, conversions, and provides machine-learning insights.",
                "url": "https://analytics.google.com/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Web Analytics"
                ]
            },
            {
                "name": "Google Tag Manager",
                "description": "A tag management system that allows you to quickly and easily update measurement codes and related code fragments collectively known as tags on your website or mobile app.",
                "url": "https://tagmanager.google.com/",
                "badges": [],
                "tags": [
                    "Web Analytics"
                ]
            }
        ]
    },
    "backend-infra": {
        "title": "Backend & Infra",
        "sectionTitle": "Backend & Infra",
        "items": [
            {
                "name": "n8n",
                "description": "A free and open workflow automation tool. Easily build complex automations and connect anything to everything.",
                "url": "https://n8n.io/",
                "badges": [],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Supabase",
                "description": "The open-source Firebase alternative. Provides a Postgres database, authentication, instant APIs, Edge Functions, and real-time subscriptions.",
                "url": "https://supabase.com/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Firebase",
                "description": "Google's mobile platform that helps you quickly develop high-quality apps and grow your business.",
                "url": "https://firebase.google.com/",
                "badges": [],
                "tags": [
                    "Backend & Infra"
                ]
            }
        ]
    },
    "hosting-domains": {
        "title": "Hosting & Domains",
        "sectionTitle": "Hosting & Domains",
        "items": [
            {
                "name": "Vercel",
                "description": "Cloud platform for frontend developers. Optimized for Next.js, providing instant deployments, global CDN, serverless functions, and analytics.",
                "url": "https://vercel.com/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Hosting & Domains"
                ]
            },
            {
                "name": "Railway",
                "description": "Infrastructure platform where you can provision databases, deploy servers, and manage fullstack applications with minimal configuration.",
                "url": "https://railway.app/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Hosting & Domains"
                ]
            },
            {
                "name": "Cloudflare",
                "description": "Global network designed to make everything you connect to the Internet secure, private, fast, and reliable.",
                "url": "https://www.cloudflare.com/",
                "badges": [],
                "tags": [
                    "Hosting & Domains"
                ]
            },
            {
                "name": "Namecheap",
                "description": "Domain registrar and web hosting company. Provides domain registration, DNS management, SSL certificates, and affordable hosting options.",
                "url": "https://www.namecheap.com/",
                "badges": [],
                "tags": [
                    "Hosting & Domains"
                ]
            }
        ]
    },
    "web-scraping": {
        "title": "Web Scraping",
        "sectionTitle": "Web Scraping",
        "items": [
            {
                "name": "Firecrawl",
                "description": "Turn entire websites into clean markdown or structured data. Built specifically for LLM applications to scrape and crawl pages with ease.",
                "url": "https://www.firecrawl.dev/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Web Scraping"
                ]
            },
            {
                "name": "Apify",
                "description": "A platform for web scraping and data extraction. Easily create web scrapers to extract data from any website.",
                "url": "https://apify.com/",
                "badges": [],
                "tags": [
                    "Web Scraping"
                ]
            }
        ]
    },
    "erp-business": {
        "title": "ERP & Business",
        "sectionTitle": "ERP & Business",
        "items": [
            {
                "name": "Frappe / ERPNext",
                "description": "Free and open-source integrated Enterprise Resource Planning (ERP) software. Built on the Frappe framework.",
                "url": "https://erpnext.com/",
                "badges": [],
                "tags": [
                    "ERP & Business"
                ]
            },
            {
                "name": "Odoo",
                "description": "Open-source suite of business apps. Covers CRM, eCommerce, billing, accounting, manufacturing, warehouse, and project management.",
                "url": "https://www.odoo.com/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "ERP & Business"
                ]
            }
        ]
    },
    "payments": {
        "title": "Payments",
        "sectionTitle": "Payments",
        "items": [
            {
                "name": "Stripe",
                "description": "Financial infrastructure for the internet. Payment processing, subscription billing, fraud prevention, and global payout APIs.",
                "url": "https://stripe.com/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Payments"
                ]
            }
        ]
    },
    "azure": {
        "title": "Azure",
        "sectionTitle": "Azure",
        "items": [
            {
                "name": "Azure App Service",
                "description": "A fully managed platform for building, deploying, and scaling web apps.",
                "url": "https://azure.microsoft.com/en-us/products/app-service",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure Key Vault",
                "description": "Cloud service for securely storing and accessing secrets, keys, and certificates.",
                "url": "https://azure.microsoft.com/en-us/products/key-vault",
                "badges": [],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure Data Factory",
                "description": "Cloud-based data integration service that allows you to create data-driven workflows for orchestrating data movement and transforming data at scale.",
                "url": "https://azure.microsoft.com/en-us/products/data-factory",
                "badges": [],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure API Management",
                "description": "A hybrid, multicloud management platform for APIs across all environments.",
                "url": "https://azure.microsoft.com/en-us/products/api-management",
                "badges": [],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Microsoft Entra External ID",
                "description": "A highly customizable customer identity and access management (CIAM) solution.",
                "url": "https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-external-id",
                "badges": [],
                "tags": [
                    "Azure"
                ]
            }
        ]
    },
    "aws": {
        "title": "AWS",
        "sectionTitle": "AWS",
        "items": [
            {
                "name": "AWS EC2",
                "description": "Secure and resizable compute capacity for virtually any workload.",
                "url": "https://aws.amazon.com/ec2/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "AWS Lambda",
                "description": "Run code without thinking about servers or clusters.",
                "url": "https://aws.amazon.com/lambda/",
                "badges": [],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "AWS S3",
                "description": "Object storage built to retrieve any amount of data from anywhere.",
                "url": "https://aws.amazon.com/s3/",
                "badges": [],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "AWS Glue",
                "description": "A serverless data integration service that makes it easy to discover, prepare, and combine data for analytics, machine learning, and application development.",
                "url": "https://aws.amazon.com/glue/",
                "badges": [],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "AWS Athena",
                "description": "A serverless, interactive analytics service to query data and analyze big data in Amazon S3 using standard SQL.",
                "url": "https://aws.amazon.com/athena/",
                "badges": [],
                "tags": [
                    "AWS"
                ]
            }
        ]
    },
    "react": {
        "title": "React",
        "sectionTitle": "React",
        "items": [
            {
                "name": "React",
                "description": "The library for web and native user interfaces.",
                "url": "https://react.dev/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "React"
                ]
            },
            {
                "name": "Next.js",
                "description": "The React Framework for the Web. Enables you to create high-quality web applications with the power of React components.",
                "url": "https://nextjs.org/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "React"
                ]
            }
        ]
    },
    "mobile-frameworks": {
        "title": "Frameworks",
        "sectionTitle": "Frameworks",
        "items": [
            {
                "name": "React Native",
                "description": "Build native iOS and Android apps using React and JavaScript. Write once, run everywhere with native performance.",
                "url": "https://reactnative.dev/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Frameworks"
                ]
            },
            {
                "name": "Expo",
                "description": "An open-source platform for making universal native apps for Android, iOS, and the web with JavaScript and React.",
                "url": "https://expo.dev/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Frameworks"
                ]
            },
            {
                "name": "Flutter",
                "description": "Google's UI toolkit for building beautiful, natively compiled applications for mobile, web, desktop, and embedded devices.",
                "url": "https://flutter.dev/",
                "badges": [],
                "tags": [
                    "Frameworks"
                ]
            }
        ]
    },
    "cicd-distribution": {
        "title": "CI/CD & Distribution",
        "sectionTitle": "CI/CD & Distribution",
        "items": [
            {
                "name": "Codemagic",
                "description": "CI/CD built specifically for mobile. Automated builds, code signing, and distribution for React Native, Flutter, and native iOS/Android apps.",
                "url": "https://codemagic.io/start/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "CI/CD & Distribution"
                ]
            },
            {
                "name": "TestFlight",
                "description": "Apple's official platform for distributing iOS beta builds to testers.",
                "url": "https://developer.apple.com/testflight/",
                "badges": [],
                "tags": [
                    "CI/CD & Distribution"
                ]
            },
            {
                "name": "Firebase App Distribution",
                "description": "Distribute pre-release iOS and Android builds to testers in seconds.",
                "url": "https://firebase.google.com/products/app-distribution",
                "badges": [],
                "tags": [
                    "CI/CD & Distribution"
                ]
            },
            {
                "name": "Google Play",
                "description": "Android app distribution via the Play Store. Internal/closed/open testing tracks.",
                "url": "https://play.google.com/console/signup",
                "badges": [],
                "tags": [
                    "CI/CD & Distribution"
                ]
            }
        ]
    },
    "source-control": {
        "title": "Source Control",
        "sectionTitle": "Source Control",
        "items": [
            {
                "name": "GitHub",
                "description": "The standard for source control. Pull requests, code review, Issues, Projects, and GitHub Actions.",
                "url": "https://github.com/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Source Control"
                ]
            },
            {
                "name": "Azure DevOps",
                "description": "Microsoft's DevOps platform with Repos (Git), Pipelines (CI/CD), Boards (work tracking), and Artifacts.",
                "url": "https://azure.microsoft.com/en-gb/products/devops/",
                "badges": [],
                "tags": [
                    "Source Control"
                ]
            }
        ]
    },
    "iac": {
        "title": "Infrastructure as Code",
        "sectionTitle": "Infrastructure as Code",
        "items": [
            {
                "name": "Terraform",
                "description": "Industry-standard IaC tool by HashiCorp. Provision and manage cloud infrastructure across AWS, Azure, GCP.",
                "url": "https://developer.hashicorp.com/terraform",
                "badges": [],
                "tags": [
                    "Infrastructure as Code"
                ]
            },
            {
                "name": "Azure Bicep",
                "description": "Microsoft's DSL for deploying Azure resources. A cleaner alternative to ARM templates.",
                "url": "https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/",
                "badges": [],
                "tags": [
                    "Infrastructure as Code"
                ]
            },
            {
                "name": "Azure AZD",
                "description": "Azure Developer CLI \u2014 scaffold, provision, and deploy full Azure applications in one command.",
                "url": "https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Infrastructure as Code"
                ]
            }
        ]
    },
    "testing": {
        "title": "Testing",
        "sectionTitle": "Testing",
        "items": [
            {
                "name": "Playwright",
                "description": "Microsoft's end-to-end testing framework for web apps. Supports Chromium, Firefox, and WebKit.",
                "url": "https://playwright.dev/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Testing"
                ]
            }
        ]
    },
    "design-tools": {
        "title": "Design Tools",
        "sectionTitle": "Design Tools",
        "items": [
            {
                "name": "Figma",
                "description": "The standard for UI/UX design. Collaborative, browser-based, and packed with plugins.",
                "url": "https://www.figma.com/",
                "badges": [],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "Canva",
                "description": "Easy-to-use design platform for marketing materials, presentations, social media, and more.",
                "url": "https://www.canva.com/",
                "badges": [],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "FigJam",
                "description": "Figma's online whiteboard for brainstorming, diagramming, and workshops.",
                "url": "https://www.figma.com/figjam/",
                "badges": [],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "Miro",
                "description": "Collaborative visual workspace for teams. Ideal for sprint planning, user journey mapping.",
                "url": "https://miro.com/",
                "badges": [],
                "tags": [
                    "Design Tools"
                ]
            }
        ]
    },
    "animation": {
        "title": "Animation",
        "sectionTitle": "Animation",
        "items": [
            {
                "name": "GSAP",
                "description": "Industry-standard JavaScript animation library. Blazing fast, works everywhere.",
                "url": "https://gsap.com/",
                "badges": [],
                "tags": [
                    "Animation"
                ]
            },
            {
                "name": "Lottie",
                "description": "Render Adobe After Effects animations natively on web, iOS, and Android.",
                "url": "https://lottiefiles.com/",
                "badges": [],
                "tags": [
                    "Animation"
                ]
            },
            {
                "name": "Motion",
                "description": "The animation library for React. Formerly Framer Motion.",
                "url": "https://motion.dev/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Animation"
                ]
            }
        ]
    },
    "colors": {
        "title": "Colors",
        "sectionTitle": "Colors",
        "items": [
            {
                "name": "Flat UI Colors",
                "description": "Curated flat color palettes from designers around the world.",
                "url": "https://flatuicolors.com/",
                "badges": [],
                "tags": [
                    "Colors"
                ]
            }
        ]
    },
    "icons": {
        "title": "Icons",
        "sectionTitle": "Icons",
        "items": [
            {
                "name": "Ionicons",
                "description": "Premium open-source icon set by Ionic. 1,300+ icons with outline, filled, and sharp variants.",
                "url": "https://ionic.io/ionicons",
                "badges": [],
                "tags": [
                    "Icons"
                ]
            }
        ]
    },
    "note-taking": {
        "title": "Note Taking",
        "sectionTitle": "Note Taking",
        "items": [
            {
                "name": "Notion",
                "description": "All-in-one workspace for notes, docs, wikis, and project management.",
                "url": "https://www.notion.com/",
                "badges": [],
                "tags": [
                    "Note Taking"
                ]
            },
            {
                "name": "Microsoft Loop",
                "description": "Microsoft's collaborative workspace app. Loop components work across Teams, Outlook, and Office.",
                "url": "https://loop.cloud.microsoft/",
                "badges": [],
                "tags": [
                    "Note Taking"
                ]
            }
        ]
    },
    "task-management": {
        "title": "Task Management",
        "sectionTitle": "Task Management",
        "items": [
            {
                "name": "TickTick",
                "description": "Task manager and to-do app with calendar view, habits, Pomodoro timer, and smart lists.",
                "url": "https://ticktick.com/",
                "badges": [],
                "tags": [
                    "Task Management"
                ]
            }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Navigation logic
    const navLinks = document.querySelectorAll('.nav-link');
    const contentArea = document.getElementById('content-area');
    const modalOverlay = document.getElementById('resource-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalDetails = document.getElementById('modal-details');
    const modalBadges = document.getElementById('modal-badges');
    const modalPrimaryAction = document.getElementById('modal-primary-action');
    const modalCloseBtn = document.getElementById('modal-close');

    function buildResourceCard(item) {
        const linkUrl = item.linkUrl || item.url || '#';
        return `
            <div class="resource-card" role="button" tabindex="0"
              data-name="${item.name}"
              data-description="${item.description}"
              data-link="${linkUrl}"
              ${item.pptUrl ? `data-ppt="${item.pptUrl}"` : ''}
              ${item.docUrl ? `data-doc="${item.docUrl}"` : ''}
            >
                <div class="resource-header">
                    <div class="resource-brand">
                        <div class="resource-logo">${item.name.charAt(0)}</div>
                        <div class="resource-title">${item.name}</div>
                    </div>
                    ${item.badges.length > 0 ? `
                        <div class="resource-badges">
                            ${item.badges.map(b => `<span class="badge-${b.toLowerCase()}">${b}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <p class="resource-desc">${item.description}</p>
                <div class="resource-footer">
                    ${item.tags.map(t => `<span class="resource-tag">${t}</span>`).join('')}
                </div>
            </div>
        `;
    }

    // Returns both the item and its category key so popups can vary by category
    function findResourceEntry(name) {
        for (const key in database) {
            const match = database[key].items.find(item => item.name === name);
            if (match) {
                return { item: match, category: key };
            }
        }
        return null;
    }

    // primary default details (Models are injected per-category later)

    function createDefaultPopupDetails(resource) {
        return {
            overview: resource.description,
            sections: [
                {
                    title: 'Project Rules',
                    html: `Add a <code>.rules</code> file to your project root. Many tools read it automatically each session — great for enforcing conventions without repeating yourself.`
                },
                {
                    title: 'Key Shortcuts',
                    html: `<ul class="detail-list"><li><strong>Ctrl+B</strong> — toggle file explorer</li><li><strong>Ctrl+Alt+B</strong> — toggle AI agents panel</li></ul>`
                },
                {
                    title: 'Tips',
                    html: `<ul class="detail-list"><li>Use <code>@codebase</code> in chat to search your whole project before asking questions.</li><li>When Composer makes a mistake, keep iterating in the same thread.</li><li>Short, specific prompts beat long explanations.</li><li>Review the diff before accepting, especially on config files.</li></ul>`
                }
            ]
        };
    }

    // Category-specific Models configuration (shows in the top of the details)
    const categoryModels = {
        'ai-tools': {
            headers: ['Model', 'When to use'],
            rows: [
                ['claude-sonnet-4.6', 'Default for everything — coding, refactoring, debugging'],
                ['claude-opus-4', 'Only for genuinely complex tasks: deep architecture decisions, hard bugs'],
                ['Avoid: Auto', 'Auto-selects models unpredictably and often generates low-quality or irrelevant code']
            ]
        },
        'frameworks-agents': {
            headers: ['Model', 'When to use'],
            rows: [
                ['claude-sonnet-4.6', 'Good default for prototyping and integration work'],
                ['claude-opus-4', 'Reach for Opus for large-scale architecture or complex orchestration logic'],
                ['Avoid: Auto', 'Auto-selection can be unpredictable for multi-actor workflows']
            ]
        },
        'mcp-tools': {
            headers: ['Model', 'When to use'],
            rows: [
                ['claude-sonnet-4.6', 'Default for queries, schema analysis, and data summaries'],
                ['claude-opus-4', 'For deep data reasoning and cross-dataset joins']
            ]
        },
        'data-analytics': {
            headers: ['Model', 'When to use'],
            rows: [
                ['claude-sonnet-4.6', 'Default for data summaries and transformations'],
                ['claude-opus-4', 'For complex statistical reasoning or causal analysis']
            ]
        },
        'default': {
            headers: ['Model', 'When to use'],
            rows: [
                ['claude-sonnet-4.6', 'Default for general usage'],
                ['claude-opus-4', 'Use for especially difficult reasoning tasks']
            ]
        }
    };

    // Merge resource custom popup details with defaults and inject category models
    function getResourcePopupDetails(resource, category) {
        const defaultDetails = createDefaultPopupDetails(resource);
        const models = categoryModels[category] || categoryModels['default'];

        const custom = resource?.popupDetails || {};
        const customSections = custom.sections || [];

        // Ensure Models section appears first, prefer custom if provided
        const hasModelsInCustom = customSections.some(s => s.title && s.title.toLowerCase().trim() === 'models');
        const mergedSections = [];
        if (hasModelsInCustom) {
            mergedSections.push(...customSections);
        } else {
            mergedSections.push({ title: 'Models', table: models });
            mergedSections.push(...customSections);
        }

        // Append any default sections that aren't present in custom
        const presentTitles = mergedSections.map(s => s.title);
        for (const def of defaultDetails.sections) {
            if (!presentTitles.includes(def.title)) mergedSections.push(def);
        }

        return {
            overview: custom.overview || defaultDetails.overview,
            sections: mergedSections
        };
    }
    function renderPopupDetails(details, defaultDescription) {
        const overviewHtml = details?.overview
            ? `<p class="detail-overview">${details.overview}</p>`
            : `<p class="detail-overview">${defaultDescription}</p>`;

        const sections = details?.sections?.filter(section =>
            section.title.toLowerCase().trim() !== 'documentation & best practices'
        ) || [];

        const sectionsHtml = sections.map(section => {
            if (section.table) {
                const headerRow = section.table.headers
                    .map(header => `<th>${header}</th>`)
                    .join('');
                const rowHtml = section.table.rows
                    .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
                    .join('');

                return `
                    <div class="detail-section">
                        <div class="detail-section-title">${section.title}</div>
                        <div class="detail-table-wrapper">
                            <table class="detail-table">
                                <thead><tr>${headerRow}</tr></thead>
                                <tbody>${rowHtml}</tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="detail-section">
                    <div class="detail-section-title">${section.title}</div>
                    <div class="detail-section-content">${section.html || `<p>${section.content}</p>`}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="detail-heading">Documentation & Best Practices</div>
            ${overviewHtml}
            ${sectionsHtml}
        `;
    }

    function openResourceModal(cardElement) {
        const title = cardElement.dataset.name || 'Resource details';
        const description = cardElement.dataset.description || 'Choose a resource option below.';
        const actions = [];

        if (cardElement.dataset.ppt) {
            actions.push({ label: 'PPT', url: cardElement.dataset.ppt });
        }
        if (cardElement.dataset.doc) {
            actions.push({ label: 'DOC', url: cardElement.dataset.doc });
        }
        if (cardElement.dataset.link) {
            actions.push({ label: 'Link', url: cardElement.dataset.link });
        }

        const resourceEntry = findResourceEntry(title);
        const resource = resourceEntry?.item;
        const category = resourceEntry?.category || 'default';
        const popupDetails = resource
            ? getResourcePopupDetails(resource, category)
            : getResourcePopupDetails({ description }, 'default');

        modalTitle.textContent = title;
        modalDescription.textContent = description;
        document.getElementById('modal-logo').textContent = title.charAt(0);
        modalBadges.innerHTML = resource?.badges?.map(b => `<span class="badge-${b.toLowerCase()}">${b}</span>`).join('') || '';
        modalDetails.innerHTML = renderPopupDetails(popupDetails, description);

        if (actions.length > 0) {
            const primary = actions[0];
            modalPrimaryAction.dataset.actionUrl = primary.url;
            modalPrimaryAction.textContent = primary.label === 'Link' ? 'Visit' : primary.label;
            modalPrimaryAction.classList.remove('hidden');
        } else {
            modalPrimaryAction.dataset.actionUrl = '#';
            modalPrimaryAction.classList.add('hidden');
        }

        modalOverlay.style.display = 'grid';
        modalOverlay.classList.remove('hidden');
    }

    function closeResourceModal() {
        modalOverlay.classList.add('hidden');
        modalPrimaryAction.dataset.actionUrl = '#';
        modalPrimaryAction.classList.add('hidden');
    }

    modalOverlay.addEventListener('transitionend', (event) => {
        if (event.target === modalOverlay && modalOverlay.classList.contains('hidden')) {
            modalDetails.innerHTML = '';
        }
    });

    contentArea.addEventListener('click', (event) => {
        const card = event.target.closest('.resource-card');
        if (card) {
            openResourceModal(card);
        }
    });

    contentArea.addEventListener('keydown', (event) => {
        const card = event.target.closest('.resource-card');
        if (card && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openResourceModal(card);
        }
    });

    modalCloseBtn.addEventListener('click', closeResourceModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeResourceModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeResourceModal();
        }
    });

    modalPrimaryAction.addEventListener('click', () => {
        const url = modalPrimaryAction.dataset.actionUrl;
        if (url && url !== '#') {
            window.open(url, '_blank', 'noopener');
        }
    });

    function renderCategory(categoryId, categoryName, countText) {
        let data = database[categoryId];

        // Fallback for "All Resources" or missing categories
        if (!data) {
            if (categoryId === 'all') {
                // Aggregate everything
                data = {
                    title: "All Resources",
                    sectionTitle: "All Resources",
                    items: []
                };
                for (const key in database) {
                    data.items.push(...database[key].items);
                }
            } else {
                // Fallback empty
                data = {
                    title: categoryName,
                    sectionTitle: categoryName,
                    items: []
                };
            }
        }

        let itemsHtml = data.items.map(item => buildResourceCard(item)).join('');

        contentArea.innerHTML = `
            <header class="page-header">
                <h1 class="page-title" id="page-title">${data.title}</h1>
                <p class="page-subtitle" id="page-subtitle">${data.items.length} resources</p>
                
                <div class="search-container">
                    <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" class="search-input" id="search-input" placeholder="Search resources…">
                </div>
            </header>

            <div style="margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;" id="section-title">${data.sectionTitle}</h2>
                <p style="color: var(--text-muted);" id="section-subtitle">${data.items.length} resources</p>
            </div>

            <div class="resources-grid" id="resources-grid">
                ${itemsHtml}
            </div>
        `;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            const allItems = [];
            for (const key in database) {
                allItems.push(...database[key].items);
            }

            let filteredItems = [];
            if (query === '') {
                filteredItems = data.items;
                document.getElementById('page-title').textContent = data.title;
                document.getElementById('section-title').textContent = data.sectionTitle;
            } else {
                filteredItems = allItems.filter(item =>
                    item.name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.tags.some(tag => tag.toLowerCase().includes(query))
                );
                document.getElementById('page-title').textContent = "Search Results";
                document.getElementById('section-title').textContent = `Results for "${query}"`;
            }

            document.getElementById('page-subtitle').textContent = `${filteredItems.length} resources`;
            document.getElementById('section-subtitle').textContent = `${filteredItems.length} resources`;

            document.getElementById('resources-grid').innerHTML = filteredItems.map(item => buildResourceCard(item)).join('');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const categoryId = link.getAttribute('data-category');
            let categoryName = "Resources";
            let countText = "0";

            if (link.querySelector('span:first-child')) {
                categoryName = link.querySelector('span:first-child').textContent;
                countText = link.querySelector('.badge').textContent;
            }

            renderCategory(categoryId, categoryName, countText);
        });
    });

    // Render default view
    renderCategory('frameworks-agents', 'Frameworks & Agents', '5');
});
