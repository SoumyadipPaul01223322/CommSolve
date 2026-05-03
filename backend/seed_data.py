import json
from dotenv import load_dotenv
load_dotenv()

from app.db.connection import get_db, init_db


def seed_database():
    db = get_db()

    # Drop old tables (order matters due to FK)
    for t in ["notifications", "group_messages", "group_members", "groups", "profiles", "messages", "connections", "answers", "questions", "build_paths", "templates", "users"]:
        db.execute(f"DROP TABLE IF EXISTS {t}")
    db.commit()

    # Recreate tables with new schema (user_id TEXT)
    init_db()
    db = get_db()
    
    # Insert sample users
    for u in [
        (1, "Alice Seeker", "alice@example.com", "seeker", 0),
        (2, "Bob Helper", "bob@example.com", "helper", 150),
        (3, "Carol Creator", "carol@example.com", "creator", 500),
    ]:
        db.execute("INSERT INTO users (id, name, email, role, reputation) VALUES (?, ?, ?, ?, ?)", u)

    # Insert templates (Level 0: Instant Solutions)
    templates = [
        (1, "Personal Portfolio Template", "A clean, modern portfolio template perfect for developers, designers, and creatives.", "Online Presence", "Beginner", "HTML + CSS + GitHub Pages", 3, 0),
        (2, "Small Business Landing Page", "Professional landing page for small businesses with services, testimonials, and contact form.", "Online Presence", "Beginner", "WordPress + Elementor", 3, 0),
        (3, "Simple Online Store", "Basic e-commerce setup for selling digital or physical products with payment integration.", "Sell Something", "Intermediate", "Shopify", 3, 0),
        (4, "Community Event Page", "Event registration and information page for community gatherings, workshops, or meetups.", "Organize Community", "Beginner", "Notion + Super", 3, 0),
        (5, "Email Automation Recipe", "Automated email workflow for welcome sequences and follow-ups.", "Automate Something", "Intermediate", "Zapier + Gmail", 3, 0),
    ]
    for t in templates:
        db.execute("INSERT INTO templates (id, title, description, category, difficulty, stack, author_id, usage_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", t)

    # Insert build paths (Level 1: Guided Recipes)
    bp1_steps = json.dumps([
        {"step": 1, "title": "Set up GitHub account", "description": "Create a GitHub account if you don't have one", "time": "5 minutes"},
        {"step": 2, "title": "Create repository", "description": "Create a new repository named 'your-username.github.io'", "time": "2 minutes"},
        {"step": 3, "title": "Clone the template", "description": "Download the portfolio template files and upload to your repository", "time": "10 minutes"},
        {"step": 4, "title": "Customize content", "description": "Replace placeholder text with your information", "time": "10 minutes"},
        {"step": 5, "title": "Deploy", "description": "Wait 2-3 minutes for GitHub Pages to deploy your site", "time": "3 minutes"},
    ])
    bp2_steps = json.dumps([
        {"step": 1, "title": "Get domain and hosting", "description": "Purchase a domain and WordPress hosting", "time": "15 minutes"},
        {"step": 2, "title": "Install WordPress", "description": "Follow hosting provider's WordPress installation guide", "time": "10 minutes"},
        {"step": 3, "title": "Install Elementor", "description": "Install and activate the Elementor page builder plugin", "time": "5 minutes"},
        {"step": 4, "title": "Choose a theme", "description": "Select and install a bakery-friendly WordPress theme", "time": "10 minutes"},
        {"step": 5, "title": "Add your content", "description": "Create pages for Home, Menu, About, and Contact", "time": "30 minutes"},
    ])
    bp3_steps = json.dumps([
        {"step": 1, "title": "Create email account", "description": "Set up a professional email address", "time": "5 minutes"},
        {"step": 2, "title": "Sign up for Zapier", "description": "Create a free Zapier account", "time": "3 minutes"},
        {"step": 3, "title": "Connect Gmail", "description": "Connect your Gmail account to Zapier", "time": "2 minutes"},
        {"step": 4, "title": "Create welcome email template", "description": "Draft your welcome email in Gmail drafts", "time": "10 minutes"},
        {"step": 5, "title": "Set up trigger", "description": "Configure form submission as trigger", "time": "5 minutes"},
        {"step": 6, "title": "Test automation", "description": "Submit a test form to verify the automation works", "time": "5 minutes"},
    ])
    for bp in [
        (1, "Build Your Portfolio in 30 Minutes", "Step-by-step guide to creating a professional portfolio using HTML, CSS, and GitHub Pages.", "Online Presence", bp1_steps, 1, 3),
        (2, "Launch a Bakery Website", "Complete guide to setting up a WordPress site for your bakery business.", "Online Presence", bp2_steps, 2, 3),
        (3, "Set Up Email Welcome Sequence", "Automate new subscriber onboarding with email automation.", "Automate Something", bp3_steps, 5, 3),
    ]:
        db.execute("INSERT INTO build_paths (id, title, description, category, steps, template_id, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)", bp)

    # Insert sample questions (Level 2: Micro-Help)
    for q in [
        (1, "1", "My portfolio images aren't loading", "I followed the portfolio template but when I deploy to GitHub Pages, the images show as broken links.", "Fix Something", "open", "Load portfolio images correctly", "Checked file paths in HTML", "Images show as broken/404 error"),
        (2, "1", "How do I change the color scheme?", "I want to customize the portfolio template colors to match my brand.", "Online Presence", "open", "Customize portfolio color scheme", "Looked at files but couldn't find CSS", "Don't know which file to edit"),
        (3, "1", "Domain not pointing to GitHub Pages", "I bought a domain but it's not showing my GitHub Pages site.", "Fix Something", "open", "Connect custom domain to GitHub Pages", "Added A records in DNS settings", "Domain shows default page or error"),
    ]:
        db.execute("INSERT INTO questions (id, user_id, title, description, category, status, structured_goal, structured_attempted, structured_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", q)

    # Insert sample answers (user_id=2 is Bob Helper, user_id=1 is Alice)
    for a in [
        (1, 1, "2", "Check that your image paths are relative to the HTML file. Use './images/photo.jpg' not '/images/photo.jpg'. Also verify case-sensitivity.", 0, 1),
        (2, 2, "2", "The CSS file is usually named 'style.css'. Look for --primary-color or hex codes. Use browser inspector (F12) to identify elements.", 0, 0),
        (3, 3, "2", "DNS changes take 24-48 hours. Verify A records point to GitHub IPs: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153.", 0, 0),
    ]:
        db.execute("INSERT INTO answers (id, question_id, user_id, content, is_accepted, is_ai_generated) VALUES (?, ?, ?, ?, ?, ?)", a)

    # More questions for a populated feel
    more_questions = [
        (4, "2", "Best way to accept payments on my site?", "I have a small bakery and want to sell cakes online. What's the easiest payment setup for someone non-technical?", "Sell Something", "open", "Accept online payments for bakery", "Looked at Stripe and PayPal", "Don't understand the integration process"),
        (5, "2", "How to set up email newsletter?", "I want to send weekly updates to my customers but don't know which tool to use or how to start.", "Automate Something", "open", "Send weekly email newsletters", "Tried Mailchimp but got confused", "Too many options and settings"),
        (6, "1", "My website is really slow", "Pages take 5-10 seconds to load. I have lots of images of my products.", "Fix Something", "open", "Make website load faster", "Compressed a few images", "Still takes too long to load"),
        (7, "2", "How to get more traffic to my site?", "I launched my portfolio 2 weeks ago but only my friends visit it. How do I get discovered?", "Online Presence", "open", "Increase website traffic", "Shared on social media", "Very few visitors"),
    ]
    for q in more_questions:
        db.execute("INSERT INTO questions (id, user_id, title, description, category, status, structured_goal, structured_attempted, structured_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", q)

    # More community answers
    more_answers = [
        (4, 4, "2", "For a small bakery, Stripe is the easiest. Their checkout can be embedded with just a link — no coding. You can also use Square Online which has built-in payment processing.", 0, 0),
        (5, 5, "1", "Try Buttondown or MailerLite — both have free tiers and are much simpler than Mailchimp. Just collect emails with a signup form and write your updates.", 0, 0),
        (6, 6, "2", "Use tinypng.com to compress your images. Also consider lazy loading — images only load when the user scrolls to them. This alone can cut load time by 60%.", 0, 0),
        (7, 7, "1", "SEO basics: add meta descriptions, use descriptive page titles, submit your sitemap to Google Search Console. Also write blog posts about your work — Google loves fresh content.", 0, 0),
    ]
    for a in more_answers:
        db.execute("INSERT INTO answers (id, question_id, user_id, content, is_accepted, is_ai_generated) VALUES (?, ?, ?, ?, ?, ?)", a)

    # Insert default community groups
    groups = [
        (1, "Web Dev Beginners", "A friendly space for people starting their web development journey. No question is too simple!", "Beginners", "🌐", "blue", "", 12),
        (2, "No-Code Builders", "For makers who build without code — Zapier, Bubble, Webflow, Notion, and more.", "No-Code", "🚀", "purple", "", 8),
        (3, "Design & UX", "Discuss UI/UX design, Figma, color theory, and making things look great.", "Design", "🎨", "pink", "", 5),
        (4, "Marketing Hub", "SEO, social media, content marketing, growth hacking — all things marketing.", "Marketing", "📈", "emerald", "", 6),
        (5, "AI & Automation", "Explore AI tools, ChatGPT workflows, automation recipes, and the future of work.", "Tech Help", "🤖", "amber", "", 15),
        (6, "Small Business Help", "For entrepreneurs and small business owners navigating the digital world.", "Business", "💡", "cyan", "", 9),
    ]
    for g in groups:
        db.execute("INSERT INTO groups (id, name, description, category, icon, color, creator_id, member_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", g)

    # Seed some group messages for a populated feel
    group_msgs = [
        (1, 1, "seed_alice", "Alice", "", "Hey everyone! Just deployed my first portfolio site using the template here. Super easy! 🎉"),
        (2, 1, "seed_bob", "Bob", "", "Welcome Alice! Great to hear. If you need help customizing it, just ask."),
        (3, 1, "seed_carol", "Carol", "", "Has anyone tried using Tailwind CSS for their portfolio? I'm thinking of switching from vanilla CSS."),
        (4, 5, "seed_bob", "Bob", "", "Just discovered that you can use AI to auto-generate alt text for images. Game changer for accessibility!"),
        (5, 5, "seed_alice", "Alice", "", "That's awesome! Which tool are you using for that?"),
        (6, 5, "seed_bob", "Bob", "", "I'm using the OpenRouter API with a vision model. Works really well."),
        (7, 2, "seed_carol", "Carol", "", "Built an entire e-commerce site on Webflow without writing a single line of code. Happy to share my experience!"),
        (8, 6, "seed_alice", "Alice", "", "What's the best way to handle inventory for a small online store?"),
    ]
    for m in group_msgs:
        db.execute("INSERT INTO group_messages (id, group_id, user_id, user_name, user_picture, content) VALUES (?, ?, ?, ?, ?, ?)", m)

    # Seed profiles for demo users
    profiles = [
        ("seed_alice", "Alice Seeker", "alice@example.com", "", "Aspiring web developer learning to build my first portfolio. Love design and cats!", 1, json.dumps(["Web Development", "UI/UX Design"]), json.dumps(["HTML", "CSS", "Figma"]), "San Francisco, CA", "", "alice-codes", ""),
        ("seed_bob", "Bob Helper", "bob@example.com", "", "Full-stack developer with 5 years experience. Here to help the community grow.", 1, json.dumps(["Web Development", "Cloud Computing", "DevOps"]), json.dumps(["JavaScript", "Python", "React", "AWS"]), "New York, NY", "https://bobhelper.dev", "bob-helper", "bobhelper"),
        ("seed_carol", "Carol Creator", "carol@example.com", "", "No-code enthusiast and small business consultant. Building digital solutions for everyone.", 0, json.dumps(["No-Code/Low-Code", "E-Commerce", "Digital Marketing"]), json.dumps(["Webflow", "Zapier", "Notion", "Shopify"]), "Austin, TX", "", "", "carolcreator"),
    ]
    for p in profiles:
        db.execute("INSERT INTO profiles (user_id, name, email, picture, bio, is_technical, domains, skills, location, website, github, linkedin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", p)

    db.commit()

    print("Database seeded successfully on Turso!")
    print(f"  Users: 3 | Templates: {len(templates)} | Build Paths: 3 | Questions: 7 | Answers: 7 | Groups: {len(groups)} | Group Messages: {len(group_msgs)} | Profiles: {len(profiles)}")


if __name__ == "__main__":
    seed_database()
