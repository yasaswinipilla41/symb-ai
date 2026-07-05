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
                                "headers": [
                                    "Model",
                                    "When to use"
                                ],
                                "rows": [
                                    [
                                        "claude-sonnet-4.6",
                                        "Default for everything â€” coding, refactoring, debugging"
                                    ],
                                    [
                                        "claude-opus-4",
                                        "Only for genuinely complex tasks: deep architecture decisions, hard bugs"
                                    ]
                                ]
                            }
                        },
                        {
                            "title": "Advice",
                            "content": "Avoid: Auto â€” Auto-selects models unpredictably and often generates low-quality or irrelevant code. Stick with Sonnet 4.6 as your default. Opus is slower and expensive â€” only reach for it when Sonnet is clearly struggling."
                        },
                        {
                            "title": "Project Rules",
                            "content": "Add a .cursorrules file to your project root. Cursor reads it automatically on every session â€” great for enforcing conventions without repeating yourself."
                        },
                        {
                            "title": "Tips",
                            "content": "Use @codebase in chat to search your whole project before asking questions â€” prevents hallucinated solutions. When Composer makes a mistake, keep iterating in the same thread."
                        }
                    ]
                }
            },
            {
                "name": "Claude Code",
                "description": "Anthropic's command-line tool for Claude. Exceptional at complex reasoning, reading large codebases, and architectural discussions.",
                "url": "https://claude.ai/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "GitHub Copilot",
                "description": "The single biggest gap; most-adopted AI assistant and Microsoft-native.",
                "url": "https://github.com/features/copilot",
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Windsurf (Codeium)",
                "description": "Agentic IDE, now OpenAI-owned.",
                "url": "https://codeium.com/windsurf",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "OpenAI Codex",
                "description": "Terminal coding agent.",
                "url": "https://openai.com/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Gemini CLI",
                "description": "Terminal coding agent.",
                "url": "https://gemini.google.com/",
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Cline",
                "description": "Editor/agent/app-builder.",
                "url": "#",
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Aider",
                "description": "Editor/agent/app-builder.",
                "url": "https://aider.chat/",
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Zed",
                "description": "Editor/agent/app-builder.",
                "url": "https://zed.dev/",
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Bolt.new",
                "description": "Editor/agent/app-builder.",
                "url": "https://bolt.new/",
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "v0 (Vercel)",
                "description": "Editor/agent/app-builder.",
                "url": "https://v0.dev/",
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Replit Agent",
                "description": "Editor/agent/app-builder.",
                "url": "https://replit.com/",
                "badges": [

                ],
                "tags": [
                    "AI Tools"
                ]
            },
            {
                "name": "Devin",
                "description": "Editor/agent/app-builder.",
                "url": "https://devin.ai/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "Hugging Face",
                "description": "The AI community building the future. Build, train and deploy state of the art models powered by the reference open source in machine learning.",
                "url": "https://huggingface.co/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "Microsoft Agent Framework",
                "description": "The production-ready convergence of Semantic Kernel and AutoGen into a single unified SDK.",
                "url": "https://microsoft.com",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "LlamaIndex",
                "description": "Core RAG / multi-agent framework.",
                "url": "https://www.llamaindex.ai/",
                "badges": [

                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "CrewAI",
                "description": "Core RAG / multi-agent framework.",
                "url": "https://www.crewai.com/",
                "badges": [

                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "OpenAI Agents SDK",
                "description": "Modern agent-building option.",
                "url": "https://platform.openai.com/docs/assistants/overview",
                "badges": [

                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "Pydantic AI",
                "description": "Modern agent-building option.",
                "url": "https://ai.pydantic.dev/",
                "badges": [

                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "Google ADK",
                "description": "Modern agent-building option.",
                "url": "https://google.com/",
                "badges": [

                ],
                "tags": [
                    "Frameworks & Agents"
                ]
            },
            {
                "name": "DSPy",
                "description": "Modern agent-building option.",
                "url": "https://dspy.ai/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Power BI MCP",
                "description": "An MCP server for connecting AI assistants to Microsoft Power BI datasets and reports.",
                "url": "https://github.com/microsoft/powerbi-modeling-mcp",
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "GitHub MCP",
                "description": "An MCP server to interact with GitHub repositories, issues, and pull requests.",
                "url": "https://github.com/modelcontextprotocol/servers",
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Azure MCP",
                "description": "An MCP server to interact with Microsoft Azure resources and APIs.",
                "url": "https://github.com/modelcontextprotocol/servers",
                "badges": [

                ],
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
            },
            {
                "name": "Playwright MCP",
                "description": "Widely used first-party server.",
                "url": "#",
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Stripe MCP",
                "description": "Widely used first-party server.",
                "url": "#",
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Notion MCP",
                "description": "Widely used first-party server.",
                "url": "#",
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Sentry MCP",
                "description": "Widely used first-party server.",
                "url": "#",
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Context7 MCP",
                "description": "Live docs server.",
                "url": "#",
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "Zapier MCP",
                "description": "Integration server.",
                "url": "#",
                "badges": [

                ],
                "tags": [
                    "Mcp Tools"
                ]
            },
            {
                "name": "MCP Registry",
                "description": "An MCP registry/directory entry.",
                "url": "#",
                "badges": [

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
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Azure AI Search",
                "description": "An AI-powered information retrieval platform that helps developers build rich search experiences and generative AI apps.",
                "url": "https://azure.microsoft.com/en-us/products/ai-services/ai-search",
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Power BI",
                "description": "Interactive data visualization software product developed by Microsoft with primary focus on business intelligence.",
                "url": "https://powerbi.microsoft.com/",
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Looker",
                "description": "Enterprise platform for BI, data applications, and embedded analytics developed by Google Cloud.",
                "url": "https://cloud.google.com/looker",
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "dbt",
                "description": "Transformation layer; near-universal in modern data stacks.",
                "url": "https://www.getdbt.com/",
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Databricks",
                "description": "Warehouse/query engine.",
                "url": "https://www.databricks.com/",
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Snowflake",
                "description": "Warehouse/query engine.",
                "url": "https://www.snowflake.com/",
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "BigQuery",
                "description": "Warehouse/query engine.",
                "url": "https://cloud.google.com/bigquery",
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "DuckDB",
                "description": "Warehouse/query engine.",
                "url": "https://duckdb.org/",
                "badges": [

                ],
                "tags": [
                    "Data & Analytics"
                ]
            },
            {
                "name": "Metabase",
                "description": "Warehouse/query engine.",
                "url": "https://www.metabase.com/",
                "badges": [

                ],
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
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Web Analytics"
                ]
            },
            {
                "name": "PostHog",
                "description": "Product analytics + session replay.",
                "url": "https://posthog.com/",
                "badges": [

                ],
                "tags": [
                    "Web Analytics"
                ]
            },
            {
                "name": "Plausible",
                "description": "Web Analytics",
                "url": "https://plausible.io/",
                "badges": [

                ],
                "tags": [
                    "Web Analytics"
                ]
            },
            {
                "name": "Vercel Analytics",
                "description": "Web Analytics",
                "url": "https://vercel.com/analytics",
                "badges": [

                ],
                "tags": [
                    "Web Analytics"
                ]
            },
            {
                "name": "Umami",
                "description": "Web Analytics",
                "url": "https://umami.is/",
                "badges": [

                ],
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
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Neon",
                "description": "Serverless Postgres.",
                "url": "https://neon.tech/",
                "badges": [

                ],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Convex",
                "description": "Backend as a service.",
                "url": "https://www.convex.dev/",
                "badges": [

                ],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Trigger.dev",
                "description": "Background jobs.",
                "url": "https://trigger.dev/",
                "badges": [

                ],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Inngest",
                "description": "Background jobs.",
                "url": "https://www.inngest.com/",
                "badges": [

                ],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Upstash",
                "description": "Serverless Redis.",
                "url": "https://upstash.com/",
                "badges": [

                ],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Hono",
                "description": "Backend framework.",
                "url": "https://hono.dev/",
                "badges": [

                ],
                "tags": [
                    "Backend & Infra"
                ]
            },
            {
                "name": "Appwrite",
                "description": "Backend as a service.",
                "url": "https://appwrite.io/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Hosting & Domains"
                ]
            },
            {
                "name": "Namecheap",
                "description": "Domain registrar and web hosting company. Provides domain registration, DNS management, SSL certificates, and affordable hosting options.",
                "url": "https://www.namecheap.com/",
                "badges": [

                ],
                "tags": [
                    "Hosting & Domains"
                ]
            },
            {
                "name": "Netlify",
                "description": "Hosting & Domains.",
                "url": "https://www.netlify.com/",
                "badges": [

                ],
                "tags": [
                    "Hosting & Domains"
                ]
            },
            {
                "name": "Fly.io",
                "description": "Hosting & Domains.",
                "url": "https://fly.io/",
                "badges": [

                ],
                "tags": [
                    "Hosting & Domains"
                ]
            },
            {
                "name": "Render",
                "description": "Hosting & Domains.",
                "url": "https://render.com/",
                "badges": [

                ],
                "tags": [
                    "Hosting & Domains"
                ]
            },
            {
                "name": "Azure Static Web Apps",
                "description": "Hosting & Domains.",
                "url": "https://azure.microsoft.com/en-us/products/app-service/static",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Web Scraping"
                ]
            },
            {
                "name": "Browserbase",
                "description": "Headless browser infra for agents.",
                "url": "https://browserbase.com/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Web Scraping"
                ]
            },
            {
                "name": "Crawl4AI",
                "description": "Web Scraping",
                "url": "#",
                "badges": [

                ],
                "tags": [
                    "Web Scraping"
                ]
            },
            {
                "name": "Bright Data",
                "description": "Web Scraping",
                "url": "https://brightdata.com/",
                "badges": [

                ],
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
                "badges": [

                ],
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
            },
            {
                "name": "Microsoft Dynamics 365",
                "description": "ERP & Business.",
                "url": "https://dynamics.microsoft.com/",
                "badges": [

                ],
                "tags": [
                    "ERP & Business"
                ]
            },
            {
                "name": "NetSuite",
                "description": "ERP & Business.",
                "url": "https://www.netsuite.com/",
                "badges": [

                ],
                "tags": [
                    "ERP & Business"
                ]
            },
            {
                "name": "HubSpot",
                "description": "ERP & Business.",
                "url": "https://www.hubspot.com/",
                "badges": [

                ],
                "tags": [
                    "ERP & Business"
                ]
            },
            {
                "name": "Salesforce",
                "description": "ERP & Business.",
                "url": "https://www.salesforce.com/",
                "badges": [

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
            },
            {
                "name": "Razorpay",
                "description": "Strong for India; standard alongside Stripe.",
                "url": "https://razorpay.com/",
                "badges": [

                ],
                "tags": [
                    "Payments"
                ]
            },
            {
                "name": "Paddle",
                "description": "Payments",
                "url": "https://www.paddle.com/",
                "badges": [

                ],
                "tags": [
                    "Payments"
                ]
            },
            {
                "name": "Lemon Squeezy",
                "description": "Payments",
                "url": "https://www.lemonsqueezy.com/",
                "badges": [

                ],
                "tags": [
                    "Payments"
                ]
            },
            {
                "name": "PayPal",
                "description": "Payments",
                "url": "https://www.paypal.com/",
                "badges": [

                ],
                "tags": [
                    "Payments"
                ]
            },
            {
                "name": "Polar",
                "description": "Payments",
                "url": "https://polar.sh/",
                "badges": [

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
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure Data Factory",
                "description": "Cloud-based data integration service that allows you to create data-driven workflows for orchestrating data movement and transforming data at scale.",
                "url": "https://azure.microsoft.com/en-us/products/data-factory",
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure API Management",
                "description": "A hybrid, multicloud management platform for APIs across all environments.",
                "url": "https://azure.microsoft.com/en-us/products/api-management",
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Microsoft Entra External ID",
                "description": "A highly customizable customer identity and access management (CIAM) solution.",
                "url": "https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-external-id",
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure Functions",
                "description": "Azure",
                "url": "https://azure.microsoft.com/en-us/products/functions",
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure Container Apps",
                "description": "Azure",
                "url": "https://azure.microsoft.com/en-us/products/container-apps",
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure OpenAI",
                "description": "Azure AI Services",
                "url": "https://azure.microsoft.com/en-us/products/ai-services/openai-service",
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure Cosmos DB",
                "description": "Azure",
                "url": "https://azure.microsoft.com/en-us/products/cosmos-db",
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "Azure Blob Storage",
                "description": "Azure",
                "url": "https://azure.microsoft.com/en-us/products/storage/blobs",
                "badges": [

                ],
                "tags": [
                    "Azure"
                ]
            },
            {
                "name": "AKS",
                "description": "Azure Kubernetes Service",
                "url": "https://azure.microsoft.com/en-us/products/kubernetes-service",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "AWS S3",
                "description": "Object storage built to retrieve any amount of data from anywhere.",
                "url": "https://aws.amazon.com/s3/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "AWS Glue",
                "description": "A serverless data integration service that makes it easy to discover, prepare, and combine data for analytics, machine learning, and application development.",
                "url": "https://aws.amazon.com/glue/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "AWS Athena",
                "description": "A serverless, interactive analytics service to query data and analyze big data in Amazon S3 using standard SQL.",
                "url": "https://aws.amazon.com/athena/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "AWS Bedrock",
                "description": "GenAI",
                "url": "https://aws.amazon.com/bedrock/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "DynamoDB",
                "description": "AWS",
                "url": "https://aws.amazon.com/dynamodb/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "RDS",
                "description": "AWS",
                "url": "https://aws.amazon.com/rds/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "ECS/Fargate",
                "description": "AWS",
                "url": "https://aws.amazon.com/ecs/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "API Gateway",
                "description": "AWS",
                "url": "https://aws.amazon.com/api-gateway/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "CloudFront",
                "description": "AWS",
                "url": "https://aws.amazon.com/cloudfront/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "Cognito",
                "description": "AWS",
                "url": "https://aws.amazon.com/cognito/",
                "badges": [

                ],
                "tags": [
                    "AWS"
                ]
            },
            {
                "name": "SQS/SNS",
                "description": "AWS",
                "url": "https://aws.amazon.com/sns/",
                "badges": [

                ],
                "tags": [
                    "AWS"
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
                "badges": [

                ],
                "tags": [
                    "Frameworks"
                ]
            },
            {
                "name": "SwiftUI",
                "description": "Mobile Frameworks",
                "url": "https://developer.apple.com/xcode/swiftui/",
                "badges": [

                ],
                "tags": [
                    "Frameworks"
                ]
            },
            {
                "name": "Kotlin / Jetpack Compose",
                "description": "Mobile Frameworks",
                "url": "https://developer.android.com/compose",
                "badges": [

                ],
                "tags": [
                    "Frameworks"
                ]
            },
            {
                "name": "Capacitor",
                "description": "Mobile Frameworks",
                "url": "https://capacitorjs.com/",
                "badges": [

                ],
                "tags": [
                    "Frameworks"
                ]
            },
            {
                "name": "Ionic",
                "description": "Mobile Frameworks",
                "url": "https://ionicframework.com/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "CI/CD & Distribution"
                ]
            },
            {
                "name": "Firebase App Distribution",
                "description": "Distribute pre-release iOS and Android builds to testers in seconds.",
                "url": "https://firebase.google.com/products/app-distribution",
                "badges": [

                ],
                "tags": [
                    "CI/CD & Distribution"
                ]
            },
            {
                "name": "Google Play",
                "description": "Android app distribution via the Play Store. Internal/closed/open testing tracks.",
                "url": "https://play.google.com/console/signup",
                "badges": [

                ],
                "tags": [
                    "CI/CD & Distribution"
                ]
            },
            {
                "name": "GitHub Actions",
                "description": "CI/CD",
                "url": "https://github.com/features/actions",
                "badges": [

                ],
                "tags": [
                    "CI/CD & Distribution"
                ]
            },
            {
                "name": "Azure Pipelines",
                "description": "CI/CD",
                "url": "https://azure.microsoft.com/en-us/products/devops/pipelines",
                "badges": [

                ],
                "tags": [
                    "CI/CD & Distribution"
                ]
            },
            {
                "name": "GitLab CI",
                "description": "CI/CD",
                "url": "https://docs.gitlab.com/ee/ci/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Source Control"
                ]
            },
            {
                "name": "GitLab",
                "description": "Source Control",
                "url": "https://about.gitlab.com/",
                "badges": [

                ],
                "tags": [
                    "Source Control"
                ]
            },
            {
                "name": "Bitbucket",
                "description": "Source Control",
                "url": "https://bitbucket.org/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Infrastructure as Code"
                ]
            },
            {
                "name": "Azure Bicep",
                "description": "Microsoft's DSL for deploying Azure resources. A cleaner alternative to ARM templates.",
                "url": "https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/",
                "badges": [

                ],
                "tags": [
                    "Infrastructure as Code"
                ]
            },
            {
                "name": "Azure AZD",
                "description": "Azure Developer CLI — scaffold, provision, and deploy full Azure applications in one command.",
                "url": "https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Infrastructure as Code"
                ]
            },
            {
                "name": "Pulumi",
                "description": "Infrastructure as Code",
                "url": "https://www.pulumi.com/",
                "badges": [

                ],
                "tags": [
                    "Infrastructure as Code"
                ]
            },
            {
                "name": "OpenTofu",
                "description": "Infrastructure as Code",
                "url": "https://opentofu.org/",
                "badges": [

                ],
                "tags": [
                    "Infrastructure as Code"
                ]
            },
            {
                "name": "Ansible",
                "description": "Infrastructure as Code",
                "url": "https://www.ansible.com/",
                "badges": [

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
            },
            {
                "name": "Vitest",
                "description": "Testing",
                "url": "https://vitest.dev/",
                "badges": [

                ],
                "tags": [
                    "Testing"
                ]
            },
            {
                "name": "Jest",
                "description": "Testing",
                "url": "https://jestjs.io/",
                "badges": [

                ],
                "tags": [
                    "Testing"
                ]
            },
            {
                "name": "Cypress",
                "description": "Testing",
                "url": "https://www.cypress.io/",
                "badges": [

                ],
                "tags": [
                    "Testing"
                ]
            },
            {
                "name": "Testing Library",
                "description": "Testing",
                "url": "https://testing-library.com/",
                "badges": [

                ],
                "tags": [
                    "Testing"
                ]
            },
            {
                "name": "Postman",
                "description": "Testing",
                "url": "https://www.postman.com/",
                "badges": [

                ],
                "tags": [
                    "Testing"
                ]
            },
            {
                "name": "k6",
                "description": "Testing",
                "url": "https://k6.io/",
                "badges": [

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
                "badges": [

                ],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "Canva",
                "description": "Easy-to-use design platform for marketing materials, presentations, social media, and more.",
                "url": "https://www.canva.com/",
                "badges": [

                ],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "FigJam",
                "description": "Figma's online whiteboard for brainstorming, diagramming, and workshops.",
                "url": "https://www.figma.com/figjam/",
                "badges": [

                ],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "Miro",
                "description": "Collaborative visual workspace for teams. Ideal for sprint planning, user journey mapping.",
                "url": "https://miro.com/",
                "badges": [

                ],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "Stitch",
                "description": "An advanced AI-driven UI component generator and front-end copilot.",
                "url": "https://stitch.dev/",
                "badges": [

                ],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "Framer",
                "description": "Design Tools",
                "url": "https://www.framer.com/",
                "badges": [

                ],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "Spline",
                "description": "Design Tools",
                "url": "https://spline.design/",
                "badges": [

                ],
                "tags": [
                    "Design Tools"
                ]
            },
            {
                "name": "Penpot",
                "description": "Design Tools",
                "url": "https://penpot.app/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Animation"
                ]
            },
            {
                "name": "Lottie",
                "description": "Render Adobe After Effects animations natively on web, iOS, and Android.",
                "url": "https://lottiefiles.com/",
                "badges": [

                ],
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
            },
            {
                "name": "Rive",
                "description": "Animation",
                "url": "https://rive.app/",
                "badges": [
                    "NEW"
                ],
                "tags": [
                    "Animation"
                ]
            },
            {
                "name": "Theatre.js",
                "description": "Animation",
                "url": "https://www.theatrejs.com/",
                "badges": [

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
                "badges": [

                ],
                "tags": [
                    "Colors"
                ]
            },
            {
                "name": "Coolors",
                "description": "Colors",
                "url": "https://coolors.co/",
                "badges": [

                ],
                "tags": [
                    "Colors"
                ]
            },
            {
                "name": "Realtime Colors",
                "description": "Colors",
                "url": "https://www.realtimecolors.com/",
                "badges": [

                ],
                "tags": [
                    "Colors"
                ]
            },
            {
                "name": "Adobe Color",
                "description": "Colors",
                "url": "https://color.adobe.com/",
                "badges": [

                ],
                "tags": [
                    "Colors"
                ]
            },
            {
                "name": "Color Hunt",
                "description": "Colors",
                "url": "https://colorhunt.co/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Icons"
                ]
            },
            {
                "name": "Lucide",
                "description": "The modern default.",
                "url": "https://lucide.dev/",
                "badges": [

                ],
                "tags": [
                    "Icons"
                ]
            },
            {
                "name": "Heroicons",
                "description": "Icons",
                "url": "https://heroicons.com/",
                "badges": [

                ],
                "tags": [
                    "Icons"
                ]
            },
            {
                "name": "Phosphor",
                "description": "Icons",
                "url": "https://phosphoricons.com/",
                "badges": [

                ],
                "tags": [
                    "Icons"
                ]
            },
            {
                "name": "Tabler Icons",
                "description": "Icons",
                "url": "https://tabler-icons.io/",
                "badges": [

                ],
                "tags": [
                    "Icons"
                ]
            },
            {
                "name": "Iconify",
                "description": "Icons",
                "url": "https://iconify.design/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Note Taking"
                ]
            },
            {
                "name": "Microsoft Loop",
                "description": "Microsoft's collaborative workspace app. Loop components work across Teams, Outlook, and Office.",
                "url": "https://loop.cloud.microsoft/",
                "badges": [

                ],
                "tags": [
                    "Note Taking"
                ]
            },
            {
                "name": "Obsidian",
                "description": "Note Taking",
                "url": "https://obsidian.md/",
                "badges": [

                ],
                "tags": [
                    "Note Taking"
                ]
            },
            {
                "name": "OneNote",
                "description": "Note Taking",
                "url": "https://www.onenote.com/",
                "badges": [

                ],
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
                "badges": [

                ],
                "tags": [
                    "Task Management"
                ]
            },
            {
                "name": "Linear",
                "description": "Task management dev-team standard.",
                "url": "https://linear.app/",
                "badges": [

                ],
                "tags": [
                    "Task Management"
                ]
            },
            {
                "name": "Jira",
                "description": "Task Management",
                "url": "https://www.atlassian.com/software/jira",
                "badges": [

                ],
                "tags": [
                    "Task Management"
                ]
            },
            {
                "name": "Microsoft Planner / To Do",
                "description": "Task Management",
                "url": "https://planner.cloud.microsoft/",
                "badges": [

                ],
                "tags": [
                    "Task Management"
                ]
            },
            {
                "name": "Trello",
                "description": "Task Management",
                "url": "https://trello.com/",
                "badges": [

                ],
                "tags": [
                    "Task Management"
                ]
            }
        ]
    },
    "web-frameworks": {
        "title": "Web Frameworks",
        "sectionTitle": "Web Frameworks",
        "items": [
            {
                "name": "React",
                "description": "The library for web and native user interfaces.",
                "url": "https://react.dev/",
                "badges": [
                    "DOCS"
                ],
                "tags": [
                    "Web Frameworks"
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
                    "Web Frameworks"
                ]
            },
            {
                "name": "Tailwind CSS",
                "description": "Web Frameworks",
                "url": "https://tailwindcss.com/",
                "badges": [

                ],
                "tags": [
                    "Web Frameworks"
                ]
            },
            {
                "name": "shadcn/ui",
                "description": "Web Frameworks",
                "url": "https://ui.shadcn.com/",
                "badges": [

                ],
                "tags": [
                    "Web Frameworks"
                ]
            },
            {
                "name": "Vite",
                "description": "Web Frameworks",
                "url": "https://vitejs.dev/",
                "badges": [

                ],
                "tags": [
                    "Web Frameworks"
                ]
            },
            {
                "name": "Astro",
                "description": "Web Frameworks",
                "url": "https://astro.build/",
                "badges": [

                ],
                "tags": [
                    "Web Frameworks"
                ]
            },
            {
                "name": "React Router / Remix",
                "description": "Web Frameworks",
                "url": "https://remix.run/",
                "badges": [

                ],
                "tags": [
                    "Web Frameworks"
                ]
            },
            {
                "name": "SvelteKit",
                "description": "Web Frameworks",
                "url": "https://kit.svelte.dev/",
                "badges": [

                ],
                "tags": [
                    "Web Frameworks"
                ]
            },
            {
                "name": "TanStack",
                "description": "Web Frameworks",
                "url": "https://tanstack.com/",
                "badges": [

                ],
                "tags": [
                    "Web Frameworks"
                ]
            }
        ]
    }
};


let issues = [];
for (const key in database) {
  const cat = database[key];
  cat.items.forEach(item => {
    if (item.url === '#' || item.description === cat.title || item.description === cat.sectionTitle || item.tags.includes(item.description)) {
      issues.push({ name: item.name, desc: item.description, url: item.url, category: cat.title });
    }
  });
}
console.log(issues.length + ' issues found.');
console.log(issues);
