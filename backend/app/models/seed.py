import random
from datetime import datetime, timedelta, date, timezone
from sqlalchemy.orm import Session
from app.models.database import (
    Company, Employee, Candidate, Job, Lead,
    Customer, FinancialTransaction, Document, Task,
    Approval, AuditLogEntry
)

def seed_demo_company(session: Session):
    print("Checking if database seeding is required...")
    
    # 1. Clean existing records for a fresh state (FitFlow demo workspace reset)
    session.query(AuditLogEntry).delete()
    session.query(Approval).delete()
    session.query(Task).delete()
    session.query(Document).delete()
    session.query(FinancialTransaction).delete()
    session.query(Customer).delete()
    session.query(Lead).delete()
    session.query(Job).delete()
    session.query(Candidate).delete()
    session.query(Employee).delete()
    session.query(Company).delete()
    session.commit()
    
    print("Database cleared. Starting seeding...")

    # 2. Seed Company
    fitflow = Company(
        name="FitFlow",
        industry="AI-powered gym-management SaaS",
        location="Hyderabad, India",
        description="FitFlow is a next-generation SaaS startup providing AI-driven scheduling, automated billing, and member engagement metrics to modern fitness centers.",
        cash_balance=500000.0,  # ₹5,00,000
        monthly_burn=75000.0,   # ₹75,000
        created_at=datetime.now(timezone.utc) - timedelta(days=120)
    )
    session.add(fitflow)
    session.commit()
    session.refresh(fitflow)

    # 3. Seed Key Managers & Employees
    employees_data = [
        ("Dhanush R", "dhanushr672@gmail.com", "Hiring Manager & Head of Talent", "Hiring", 85000.0, date(2025, 1, 15)),
        ("Ajay Kumar", "bogguajaykumar0@gmail.com", "Finance Manager & Head of Treasury", "Finance", 95000.0, date(2025, 1, 10)),
        ("Prashanth Kumar", "guntiprashanthkumar646@gmail.com", "Legal Manager & General Counsel", "Legal", 90000.0, date(2025, 1, 20)),
        ("Sneha Reddy", "sneha.reddy@fitflow.ai", "CTO", "Engineering", 100000.0, date(2025, 1, 20)),
        ("Amit Verma", "amit.verma@fitflow.ai", "Head of Sales", "GTM", 75000.0, date(2025, 2, 10))
    ]
    for name, email, role, dept, sal, join_date in employees_data:
        emp = Employee(
            company_id=fitflow.company_id,
            name=name,
            email=email,
            role=role,
            department=dept,
            salary=sal,
            joining_date=join_date,
            status="active"
        )
        session.add(emp)
    
    # 4. Seed Open Jobs (2 positions)
    jobs_data = [
        ("React Developer", "React, TypeScript, Tailwind CSS, State Management", "1-3 years", 60000.0, "Hyderabad"),
        ("Python/FastAPI Developer", "Python, FastAPI, SQLAlchemy, PostgreSQL, LangGraph", "2-4 years", 75000.0, "Hyderabad")
    ]
    for title, skills, exp, budget, loc in jobs_data:
        job = Job(
            title=title,
            skills=skills,
            experience=exp,
            salary_budget=budget,
            location=loc,
            status="open"
        )
        session.add(job)
    session.commit()

    # 5. Seed Candidates (50 candidates)
    first_names = ["Rohan", "Vikram", "Anjali", "Neha", "Arjun", "Aditya", "Pooja", "Siddharth", "Meera", "Karan", 
                   "Divya", "Suresh", "Ramesh", "Deepak", "Swati", "Nikhil", "Preeti", "Sunil", "Rajesh", "Sandhya"]
    last_names = ["Verma", "Reddy", "Sharma", "Nair", "Rao", "Joshi", "Kumar", "Patel", "Singh", "Choudhury",
                  "Mishra", "Gupta", "Sen", "Bose", "Das", "Deshmukh", "Pillai", "Kulkarni", "Mehta", "Grover"]
    
    skills_pool = [
        ["React", "JavaScript", "CSS", "Tailwind CSS"],
        ["React", "TypeScript", "Redux", "HTML"],
        ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL"],
        ["Python", "Django", "Flask", "MongoDB"],
        ["JavaScript", "Node.js", "Express", "React"],
        ["React Native", "iOS", "Android", "JavaScript"],
        ["AWS", "Docker", "Kubernetes", "CI/CD"],
        ["SQL", "Data Analysis", "Python", "Tableau"],
        ["Product Management", "Agile", "User Research", "Wireframing"],
        ["Sales", "CRM", "Lead Generation", "Negotiation"]
    ]
    
    locations = ["Hyderabad", "Bengaluru", "Pune", "Remote", "Chennai", "Mumbai", "Delhi"]
    
    for i in range(1, 51):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{i}@example.com"
        phone = f"+91 98765 {random.randint(10000, 99999)}"
        skills = ", ".join(random.choice(skills_pool))
        exp = round(random.uniform(0.5, 6.0), 1)
        expected_sal = round(random.uniform(30000, 90000), -3)
        loc = random.choice(locations)
        score = random.randint(35, 95)
        
        # Determine status based on score to make it look realistic
        if score > 85:
            status = random.choice(["screened", "interviewed", "offered"])
        elif score > 60:
            status = random.choice(["applied", "screened", "interviewed"])
        else:
            status = random.choice(["applied", "rejected"])
            
        candidate = Candidate(
            name=name,
            email=email,
            phone=phone,
            skills=skills,
            experience=exp,
            expected_salary=expected_sal,
            location=loc,
            resume=f"Resume summary for {name}. Strong background with {exp} years of industry experience. Core competencies in {skills}.",
            status=status,
            match_score=score
        )
        session.add(candidate)
    
    # 6. Seed Leads (150 leads)
    gym_prefixes = ["Alpha", "Fit", "Iron", "Gold's", "Pulse", "Evolution", "ProFit", "Elite", "Titan", "Core", "Vibe", "Zest", "Cross", "Body", "Peak"]
    gym_suffixes = ["Gym", "Fitness Studio", "Wellness Center", "Crossfit Box", "Club", "Arena", "Zone", "House"]
    
    industries = ["Gym", "Yoga Studio", "Pilates Studio", "Crossfit Center", "Personal Training Studio"]
    pain_points = [
        "Currently using manual excel sheets to track member subscriptions and attendance.",
        "Experiencing high churn rate because they lack automated payment reminders.",
        "Frustrated with their current heavy/clunky software which takes too long to load.",
        "Wants to expand but lacks member engagement stats and metrics to verify profitability.",
        "Struggling to schedule personal training sessions and manage trainer timetables."
    ]
    
    for i in range(1, 151):
        comp_name = f"{random.choice(gym_prefixes)} {random.choice(gym_suffixes)}"
        email_prefix = comp_name.lower().replace(" ", "").replace("'", "")
        contact_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        
        # Ensure a cluster of leads in Hyderabad for the demo scenario
        loc = "Hyderabad" if i <= 40 else random.choice(locations)
        score = random.randint(10, 95)
        status = "new"
        
        if score > 80:
            status = random.choice(["new", "contacted", "qualified"])
        elif score > 50:
            status = random.choice(["new", "contacted"])
        else:
            status = random.choice(["new", "lost"])
            
        lead = Lead(
            company_name=comp_name,
            industry=random.choice(industries),
            location=loc,
            phone=f"+91 91234 {random.randint(10000, 99999)}",
            email=f"owner@{email_prefix}.com",
            lead_score=score,
            status=status,
            pain_point=random.choice(pain_points),
            last_contacted=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)) if status != "new" else None
        )
        session.add(lead)

    # 7. Seed Customers (20 customers)
    plans = [("Starter", 2500.0), ("Growth", 6000.0), ("Enterprise", 12000.0)]
    for i in range(1, 21):
        comp_name = f"Active {random.choice(gym_prefixes)} {random.choice(gym_suffixes)}"
        plan_name, revenue = random.choice(plans)
        customer = Customer(
            company_name=comp_name,
            plan=plan_name,
            revenue=revenue,
            status="active"
        )
        session.add(customer)

    # 8. Seed Financial Transactions (50 transactions)
    categories = {
        "payroll": "Monthly salary payout",
        "marketing": "Facebook & Google Ad Campaigns",
        "software": "Supabase & AWS Cloud Hosting infrastructure",
        "office": "WeWork workspace rent",
        "misc": "Hardware and office supplies"
    }
    
    # Add revenue transaction (subscriptions)
    for i in range(1, 26):
        date_tx = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))
        tx = FinancialTransaction(
            type="revenue",
            category="subscription",
            amount=random.choice([2500.0, 6000.0, 12000.0]),
            description=f"SaaS Monthly Subscription Fee payment received",
            date=date_tx
        )
        session.add(tx)
        
    # Add expense transaction
    for i in range(1, 26):
        cat = random.choice(list(categories.keys()))
        date_tx = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))
        amt = random.randint(2000, 35000) if cat != "payroll" else 75000
        tx = FinancialTransaction(
            type="expense",
            category=cat,
            amount=float(amt),
            description=categories[cat],
            date=date_tx
        )
        session.add(tx)

    # 9. Seed Documents (10 documents)
    doc_types = [
        ("NDA", "Standard Mutual NDA", "This Mutual Non-Disclosure Agreement is made and entered into..."),
        ("Employment Agreement", "Software Engineer Employment Offer", "This Employment Contract sets forth terms for developers joining FitFlow..."),
        ("IP Assignment", "Proprietary Information and Inventions Agreement", "Employee agrees to assign all intellectual property developed under FitFlow...")
    ]
    for i in range(1, 11):
        dtype, title, content = random.choice(doc_types)
        doc = Document(
            type=dtype,
            title=f"{title} - Draft v{i}",
            content=content + f"\n\nDocument serial hash verification ref: #{random.randint(1000, 9999)}.",
            status=random.choice(["draft", "pending_review", "approved"]),
            created_by="Legal Agent",
            approval_status=random.choice(["pending", "signed"])
        )
        session.add(doc)

    # 10. Seed Tasks (20 tasks)
    tasks_pool = [
        ("GTM", "Qualify leads in Hyderabad", "Analyze lead pool of gyms in Hyderabad and identify top 20 prospects.", "high", "completed"),
        ("Hiring", "Screen React resumes", "Filter React developer candidates based on experience and budget limits.", "medium", "completed"),
        ("Finance", "Runway and Burn projection", "Compute runaway projection adjusting for potential new engineer hires.", "high", "completed"),
        ("Legal", "Draft NDA templates", "Generate NDA files for business development vendor evaluations.", "low", "completed"),
        ("GTM", "Cold email campaign", "Draft marketing email templates tailored to gym pain points.", "medium", "pending"),
        ("Hiring", "Schedule developer interviews", "Arrange screening interviews for top 3 ranked React applicants.", "high", "pending"),
        ("Legal", "Hiring Document Review", "Inspect Draft employment agreement clauses for state labor law compliance.", "high", "awaiting_approval")
    ]
    for i in range(1, 21):
        agent, title, desc, prio, status = random.choice(tasks_pool)
        task = Task(
            agent=agent,
            title=f"{title} #{i}",
            description=desc,
            priority=prio,
            status=status,
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 15))
        )
        session.add(task)

    # 11. Seed Approvals (3 approvals - from initial company state specification)
    approvals_pool = [
        ("Sign Employment Agreement", "Hiring", "High", "Approve contract offer for shortlisted Frontend React Developer (Rahul Sharma)."),
        ("Sign NDA for Gym Corp", "Legal", "Medium", "Mutual Non-Disclosure Agreement for vendor partner evaluations."),
        ("Disburse Marketing Ad Spend", "Finance", "High", "Approve ₹50,000 budget allocation for local Meta advertisement campaigns.")
    ]
    for action, agent, risk, desc in approvals_pool:
        app = Approval(
            action=action,
            agent=agent,
            risk_level=risk,
            description=desc,
            status="pending",
            timestamp=datetime.now(timezone.utc) - timedelta(hours=random.randint(4, 48))
        )
        session.add(app)

    # 12. Seed Audit Logs (20 logs)
    log_actions = [
        ("GTM", "Retrieved 150 leads", "Ran lead qualifier script on local workspace directories.", "success"),
        ("Hiring", "Parsed candidate resumes", "Ranked and scored 50 candidate profiles.", "success"),
        ("Finance", "Calculated company runway", "Runway calculated as 6.7 months based on current ₹500,000 cash balance.", "success"),
        ("Legal", "Drafted Employment Contract", "Created standard employment agreement template.", "success"),
        ("System", "Initial DB Setup", "Successfully migrated database models to PostgreSQL.", "success")
    ]
    for i in range(1, 21):
        agent, action, output, status = random.choice(log_actions)
        log = AuditLogEntry(
            agent=agent,
            action=action,
            input=f"Goal: Run workspace tasks session #{i}",
            output=output,
            status=status,
            timestamp=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 10))
        )
        session.add(log)

    session.commit()
    print("Database seeding completed successfully!")
