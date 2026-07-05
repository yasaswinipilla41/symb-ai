import json
import re

with open('data.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

database = {}
current_category_slug = None
current_category_name = None

for line in lines:
    line = line.strip()
    if not line:
        continue
    
    # Check for category header: ### **Category Name (`slug`)**
    header_match = re.match(r'###\s+\*\*([^\(]+)\s+\(`([^`]+)`\)\*\*', line)
    if header_match:
        current_category_name = header_match.group(1).strip()
        current_category_slug = header_match.group(2).strip()
        database[current_category_slug] = {
            "title": current_category_name,
            "sectionTitle": current_category_name,
            "items": []
        }
        continue
    
    # Check for item name: 1. **Name**
    name_match = re.match(r'\d+\.\s+\*\*([^*]+)\*\*', line)
    if name_match:
        current_item = {
            "name": name_match.group(1).strip(),
            "badges": [],
            "description": "",
            "url": "",
            "tags": [current_category_name] if current_category_name else []
        }
        database[current_category_slug]["items"].append(current_item)
        continue
    
    # Check for properties
    if line.startswith('* **Badges:**'):
        badges_str = line.split('`')[1] # extract the array string
        try:
            badges = json.loads(badges_str)
            database[current_category_slug]["items"][-1]["badges"] = badges
        except:
            pass
    elif line.startswith('* **Description:**'):
        desc = line.replace('* **Description:**', '').strip()
        database[current_category_slug]["items"][-1]["description"] = desc
    elif line.startswith('* **URL:**'):
        # Extract from markdown link [url](url)
        url_match = re.search(r'\[.*\]\((.*)\)', line)
        if url_match:
            database[current_category_slug]["items"][-1]["url"] = url_match.group(1)
        else:
            database[current_category_slug]["items"][-1]["url"] = line.replace('* **URL:**', '').strip()

# Now create script.js
script_content = f"""const database = {json.dumps(database, indent=4)};

document.addEventListener('DOMContentLoaded', () => {{
    // Theme toggle logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {{
        document.documentElement.setAttribute('data-theme', 'dark');
    }} else {{
        document.documentElement.removeAttribute('data-theme');
    }}

    themeToggleBtn.addEventListener('click', () => {{
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {{
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }} else {{
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }}
    }});

    // Navigation logic
    const navLinks = document.querySelectorAll('.nav-link');
    const contentArea = document.getElementById('content-area');

    function renderCategory(categoryId, categoryName, countText) {{
        let data = database[categoryId];
        
        // Fallback for "All Resources" or missing categories
        if (!data) {{
            if (categoryId === 'all') {{
                // Aggregate everything
                data = {{
                    title: "All Resources",
                    sectionTitle: "All Resources",
                    items: []
                }};
                for (const key in database) {{
                    data.items.push(...database[key].items);
                }}
            }} else {{
                // Fallback empty
                data = {{
                    title: categoryName,
                    sectionTitle: categoryName,
                    items: []
                }};
            }}
        }}
        
        let itemsHtml = data.items.map(item => `
            <a href="${{item.url}}" target="_blank" rel="noopener noreferrer" class="resource-card" style="text-decoration: none; color: inherit;">
                <div class="resource-header">
                    <div class="resource-brand">
                        <div class="resource-logo">${{item.name.charAt(0)}}</div>
                        <div class="resource-title">${{item.name}}</div>
                    </div>
                    ${{item.badges.length > 0 ? `
                        <div class="resource-badges">
                            ${{item.badges.map(b => `<span class="badge-${{b.toLowerCase()}}">${{b}}</span>`).join('')}}
                        </div>
                    ` : ''}}
                </div>
                <p class="resource-desc">${{item.description}}</p>
                <div class="resource-footer">
                    ${{item.tags.map(t => `<span class="resource-tag">${{t}}</span>`).join('')}}
                </div>
            </a>
        `).join('');

        contentArea.innerHTML = `
            <header class="page-header">
                <h1 class="page-title">${{data.title}}</h1>
                <p class="page-subtitle">${{data.items.length}} resources</p>
                
                <div class="search-container">
                    <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" class="search-input" placeholder="Search resources…">
                </div>
            </header>

            <div style="margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${{data.sectionTitle}}</h2>
                <p style="color: var(--text-muted);">${{data.items.length}} resources</p>
            </div>

            <div class="resources-grid">
                ${{itemsHtml}}
            </div>
        `;
        window.scrollTo({{ top: 0, behavior: 'smooth' }});
    }}

    navLinks.forEach(link => {{
        link.addEventListener('click', (e) => {{
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const categoryId = link.getAttribute('data-category');
            let categoryName = "Resources";
            let countText = "0";
            
            if (link.querySelector('span:first-child')) {{
                categoryName = link.querySelector('span:first-child').textContent;
                countText = link.querySelector('.badge').textContent;
            }}

            renderCategory(categoryId, categoryName, countText);
        }});
    }});

    // Render default view
    renderCategory('frameworks-agents', 'Frameworks & Agents', '5');
}});
"""

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(script_content)

print("Generated script.js successfully!")
