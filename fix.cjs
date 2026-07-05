const fs = require('fs');

const patches = {
  "Antigravity": { desc: "Google DeepMind's advanced agentic AI coding assistant.", url: "https://deepmind.google/technologies/gemini/" },
  "Cline": { desc: "Editor/agent/app-builder for VS Code.", url: "https://github.com/cline/cline" },
  "Playwright MCP": { desc: "MCP server for browser automation via Playwright.", url: "https://github.com/modelcontextprotocol/servers/tree/main/src/playwright" },
  "Stripe MCP": { desc: "MCP server for integrating Stripe payments.", url: "https://github.com/stripe/stripe-mcp" },
  "Notion MCP": { desc: "MCP server for Notion integration.", url: "https://github.com/modelcontextprotocol/servers/tree/main/src/notion" },
  "Sentry MCP": { desc: "MCP server for Sentry error tracking integration.", url: "https://github.com/modelcontextprotocol/servers/tree/main/src/sentry" },
  "Context7 MCP": { desc: "Live docs server.", url: "https://context7.com/" },
  "Zapier MCP": { desc: "Integration server for connecting apps.", url: "https://zapier.com/" },
  "MCP Registry": { desc: "An MCP registry/directory entry.", url: "https://github.com/modelcontextprotocol/registry" },
  "Plausible": { desc: "Lightweight and open-source web analytics.", url: "https://plausible.io/" },
  "Vercel Analytics": { desc: "Privacy-friendly analytics for Vercel deployments.", url: "https://vercel.com/analytics" },
  "Umami": { desc: "Simple, fast, website analytics alternative to Google Analytics.", url: "https://umami.is/" },
  "Crawl4AI": { desc: "Open-source LLM friendly web crawler & scraper.", url: "https://crawl4ai.com/" },
  "Bright Data": { desc: "World's leading web data platform.", url: "https://brightdata.com/" },
  "Paddle": { desc: "Complete payments, tax, and subscriptions solution for SaaS.", url: "https://www.paddle.com/" },
  "Lemon Squeezy": { desc: "Payments, tax, and subscriptions for software companies.", url: "https://www.lemonsqueezy.com/" },
  "PayPal": { desc: "Global online payment system.", url: "https://www.paypal.com/" },
  "Polar": { desc: "Funding and monetization for open source developers.", url: "https://polar.sh/" },
  "Azure Functions": { desc: "Serverless compute service on Azure.", url: "https://azure.microsoft.com/en-us/products/functions" },
  "Azure Container Apps": { desc: "Serverless platform for building and deploying microservices.", url: "https://azure.microsoft.com/en-us/products/container-apps" },
  "Azure Cosmos DB": { desc: "Fully managed NoSQL database for modern app development.", url: "https://azure.microsoft.com/en-us/products/cosmos-db" },
  "Azure Blob Storage": { desc: "Massively scalable and secure object storage.", url: "https://azure.microsoft.com/en-us/products/storage/blobs" },
  "DynamoDB": { desc: "Fast, flexible NoSQL database service for any scale.", url: "https://aws.amazon.com/dynamodb/" },
  "RDS": { desc: "Managed relational database service on AWS.", url: "https://aws.amazon.com/rds/" },
  "ECS/Fargate": { desc: "Highly secure, reliable, and scalable container execution.", url: "https://aws.amazon.com/ecs/" },
  "API Gateway": { desc: "Fully managed service for creating and managing APIs.", url: "https://aws.amazon.com/api-gateway/" },
  "CloudFront": { desc: "Secure and highly programmable content delivery network.", url: "https://aws.amazon.com/cloudfront/" },
  "Cognito": { desc: "Simple and secure user sign-up, sign-in, and access control.", url: "https://aws.amazon.com/cognito/" },
  "SQS/SNS": { desc: "Fully managed pub/sub messaging and message queuing services.", url: "https://aws.amazon.com/sns/" },
  "GitLab": { desc: "Complete DevOps platform delivered as a single application.", url: "https://about.gitlab.com/" },
  "Bitbucket": { desc: "Git code management built for professional teams.", url: "https://bitbucket.org/" },
  "Pulumi": { desc: "Infrastructure as code in any programming language.", url: "https://www.pulumi.com/" },
  "OpenTofu": { desc: "Open-source alternative to Terraform for infrastructure as code.", url: "https://opentofu.org/" },
  "Ansible": { desc: "Radically simple IT automation system.", url: "https://www.ansible.com/" },
  "Vitest": { desc: "Blazing fast unit test framework powered by Vite.", url: "https://vitest.dev/" },
  "Jest": { desc: "Delightful JavaScript Testing Framework with a focus on simplicity.", url: "https://jestjs.io/" },
  "Cypress": { desc: "Fast, easy and reliable testing for anything that runs in a browser.", url: "https://www.cypress.io/" },
  "Testing Library": { desc: "Simple and complete testing utilities that encourage good testing practices.", url: "https://testing-library.com/" },
  "Postman": { desc: "API platform for building and using APIs.", url: "https://www.postman.com/" },
  "k6": { desc: "Open-source load testing tool and SaaS for engineering teams.", url: "https://k6.io/" },
  "Framer": { desc: "Design tool for creating interactive prototypes and websites.", url: "https://www.framer.com/" },
  "Spline": { desc: "3D design tool for the web.", url: "https://spline.design/" },
  "Penpot": { desc: "Open-source design and prototyping platform.", url: "https://penpot.app/" },
  "Rive": { desc: "Interactive animations for any platform.", url: "https://rive.app/" },
  "Theatre.js": { desc: "Motion design toolset for the web.", url: "https://www.theatrejs.com/" },
  "Coolors": { desc: "Super fast color palettes generator.", url: "https://coolors.co/" },
  "Realtime Colors": { desc: "Visualize color palettes on real websites instantly.", url: "https://www.realtimecolors.com/" },
  "Adobe Color": { desc: "Create and explore beautiful color themes.", url: "https://color.adobe.com/" },
  "Color Hunt": { desc: "Free and open platform for color inspiration.", url: "https://colorhunt.co/" },
  "Heroicons": { desc: "Beautiful hand-crafted SVG icons, by the makers of Tailwind CSS.", url: "https://heroicons.com/" },
  "Phosphor": { desc: "Flexible icon family for interfaces, diagrams, presentations.", url: "https://phosphoricons.com/" },
  "Tabler Icons": { desc: "Over 4,900 pixel-perfect icons for web design.", url: "https://tabler-icons.io/" },
  "Iconify": { desc: "Universal icon framework integrating multiple icon sets.", url: "https://iconify.design/" },
  "Obsidian": { desc: "Private and flexible writing app that adapts to the way you think.", url: "https://obsidian.md/" },
  "OneNote": { desc: "Digital note-taking app for your devices.", url: "https://www.onenote.com/" },
  "Jira": { desc: "Issue and project tracking software.", url: "https://www.atlassian.com/software/jira" },
  "Microsoft Planner / To Do": { desc: "Manage tasks and teamwork with Microsoft 365.", url: "https://planner.cloud.microsoft/" },
  "Trello": { desc: "Visual tool for empowering your team to manage any type of project.", url: "https://trello.com/" },
  "Tailwind CSS": { desc: "Utility-first CSS framework for rapid UI development.", url: "https://tailwindcss.com/" },
  "shadcn/ui": { desc: "Beautifully designed components built with Radix UI and Tailwind CSS.", url: "https://ui.shadcn.com/" },
  "Vite": { desc: "Next generation frontend tooling.", url: "https://vitejs.dev/" },
  "Astro": { desc: "The web framework that scales with you.", url: "https://astro.build/" },
  "React Router / Remix": { desc: "Full stack web framework that lets you focus on the user interface.", url: "https://remix.run/" },
  "SvelteKit": { desc: "Rapidly developing robust, performant web applications using Svelte.", url: "https://kit.svelte.dev/" },
  "TanStack": { desc: "High-quality open-source software for web developers.", url: "https://tanstack.com/" }
};

let content = fs.readFileSync('src/data/database.js', 'utf-8');
const objMatch = content.match(/export const database = (\{[\s\S]*\});\s*$/);
if (!objMatch) {
  console.log('Could not parse database object');
  process.exit(1);
}

const dbStr = objMatch[1];
const db = eval('(' + dbStr + ')');

let updated = 0;
for (const key in db) {
  db[key].items.forEach(item => {
    if (patches[item.name]) {
      item.description = patches[item.name].desc;
      item.url = patches[item.name].url;
      updated++;
    }
  });
}

const newDbStr = JSON.stringify(db, null, 4);
const finalContent = content.replace(objMatch[1], newDbStr);
fs.writeFileSync('src/data/database.js', finalContent);
console.log('Updated ' + updated + ' items.');
