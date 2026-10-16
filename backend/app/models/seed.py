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
    
    # 1. Clean existing records for a fresh state (ManO demo workspace reset)
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

    # 2. Seed Mission Organization
    mano_company = Company(
        name="SpaceXOS",
        industry="Orbital Telemetry Monitoring & Space Situational Awareness",
        location="Bengaluru / ISTRAC Ground Station, India",
        description="SpaceXOS is an AI decision-support platform for flight operations leads, providing concurrent aerospace specialist agents and human-in-the-loop mission controls.",
        cash_balance=45000000.0,
        monthly_burn=1250000.0,
        created_at=datetime.now(timezone.utc) - timedelta(days=120)
    )
    session.add(mano_company)
    session.commit()
    session.refresh(mano_company)

    # 3. Seed Key Managers & Employees
    employees_data = [
        ("Dhanush R", "dhanushr672@gmail.com", "Hiring Manager & Head of Talent", "Hiring", 85000.0, date(2025, 1, 15)),
        ("Ajay Kumar", "bogguajaykumar0@gmail.com", "Finance Manager & Head of Treasury", "Finance", 95000.0, date(2025, 1, 10)),
        ("Prashanth Kumar", "guntiprashanthkumar646@gmail.com", "Legal Manager & General Counsel", "Legal", 90000.0, date(2025, 1, 20)),
        ("Sneha Reddy", "sneha.reddy@mano.ai", "CTO", "Engineering", 100000.0, date(2025, 1, 20)),
        ("Amit Verma", "amit.verma@mano.ai", "Head of Sales", "GTM", 75000.0, date(2025, 2, 10))
    ]
    for name, email, role, dept, sal, join_date in employees_data:
        emp = Employee(
            company_id=mano_company.company_id,
            name=name,
            email=email,
            role=role,
            department=dept,
            salary=sal,
            joining_date=join_date,
            status="active"
        )
        session.add(emp)
    
    # 4. Seed Open Jobs (Flight Operations & Space Mission Roles)
    jobs_data = [
        ("Orbital Flight Dynamics Controller", "Astrodynamics, Orbit Determination, TLE Ephemeris, SGP4, Python", "3-5 years", 140000.0, "Bengaluru / ISTRAC"),
        ("Satellite ADCS & Propulsion Specialist", "Attitude Determination, Star Trackers, Reaction Wheels, Cold Gas Thrusters", "4-6 years", 160000.0, "Bengaluru")
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

    # 5. Seed Candidates (50 aerospace & flight operations specialists)
    first_names = ["Rohan", "Vikram", "Anjali", "Neha", "Arjun", "Aditya", "Pooja", "Siddharth", "Meera", "Karan", 
                   "Divya", "Suresh", "Ramesh", "Deepak", "Swati", "Nikhil", "Preeti", "Sunil", "Rajesh", "Sandhya"]
    last_names = ["Verma", "Reddy", "Sharma", "Nair", "Rao", "Joshi", "Kumar", "Patel", "Singh", "Choudhury",
                  "Mishra", "Gupta", "Sen", "Bose", "Das", "Deshmukh", "Pillai", "Kulkarni", "Mehta", "Grover"]
    
    skills_pool = [
        ["Astrodynamics", "Orbit Determination", "TLE", "SGP4 Propagation"],
        ["Satellite ADCS", "Star Trackers", "Reaction Wheels", "Attitude Quaternions"],
        ["Spacecraft EPS", "Solar Array Regulators", "Lithium-Ion Battery Balancing"],
        ["TT&C", "X-Band Downlink", "S-Band Telemetry", "CCSDS Packet Protocol"],
        ["Thermal Control Subsystem", "Heat Pipes", "MLI Blankets", "Radiator Panels"],
        ["Space Situational Awareness", "Conjunction Screening", "Debris Tracking", "TLE Ephemeris"],
        ["Space Radiation Hardening", "Single-Event Upsets (SEU)", "Total Ionizing Dose"],
        ["Aerospace Guidance & Navigation", "Kalman Filters", "Orbital Maneuver Optimization"],
        ["Satellite Flight Director", "Mission Control Operations", "Ground Station Passes"],
        ["Space Propulsion", "Hydrazine Monopropellant", "Hall Effect Thrusters"]
    ]
    
    locations = ["Bengaluru / ISTRAC", "Hyderabad", "Thiruvananthapuram / VSSC", "Sriharikota / SDSC", "Ahmedabad / SAC", "Pune"]
    
    for i in range(1, 51):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{i}@isro-defense.gov.in"
        phone = f"+91 98765 {random.randint(10000, 99999)}"
        skills = ", ".join(random.choice(skills_pool))
        exp = round(random.uniform(2.5, 10.0), 1)
        expected_sal = round(random.uniform(70000, 180000), -3)
        loc = random.choice(locations)
        score = random.randint(55, 98)
        
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
            resume=f"Flight Operations Dossier for {name}. Aerospace background with {exp} years mission control experience. Core competencies in {skills}.",
            status=status,
            match_score=score
        )
        session.add(candidate)
    
    # 6. Seed Mission Partners & Defense Leads (150 aerospace and constellation leads)
    space_partners = [
        ("Defence Space Agency (DSA)", "Integrated Tri-Services Space Command", "New Delhi"),
        ("ISRO Telemetry, Tracking and Command (ISTRAC)", "Sovereign Satellite Ground Station", "Bengaluru"),
        ("IN-SPACe Authorization Authority", "National Space Promotion Center", "Ahmedabad"),
        ("Pixxel Space Technologies", "Hyperspectral Constellation Operations", "Bengaluru"),
        ("Dhruva Space Mission Operations", "Satellite Bus & In-Orbit Test Grid", "Hyderabad"),
        ("Skyroot Aerospace Orbital Logistics", "Upper Stage Orbital Injection", "Hyderabad"),
        ("Bellatrix Aerospace In-Orbit Propulsion", "Satellite Mobility & Orbit Elevation", "Bengaluru"),
        ("Agnikul Cosmos Mission Control", "Custom Orbital Insertion Control", "Chennai"),
        ("Planet Labs Earth Observation", "Dove Satellite Constellation Fleet", "Bengaluru / Global"),
        ("Satellogic High-Resolution Imaging", "Autonomous Sub-Meter Orbit Constellation", "Global"),
        ("OneWeb LEO Network Operations", "Broadband Constellation SSA Triage", "New Delhi / Global"),
        ("National Remote Sensing Centre (NRSC)", "Strategic Geospatial Earth Reconnaissance", "Hyderabad"),
        ("Space Applications Centre (SAC)", "Payload Sensor Development & Telemetry", "Ahmedabad"),
        ("GalaxEye Space SAR Constellations", "Multi-Sensor Optical & Radar Constellation", "Bengaluru"),
        ("US Space Command Commercial SSA", "Space Track Conjunction Data Messages", "Colorado / International")
    ]
    
    industries = [
        "Sovereign Space Command",
        "Space Situational Awareness (SSA)",
        "Commercial Mega-Constellation",
        "Hyperspectral Earth Observation",
        "Satellite Propulsion & Bus Logistics"
    ]
    
    pain_points = [
        "Requires automated telemetry anomaly classification to prevent false operator panic during solar eclipse transits.",
        "Needs real-time orbital conjunction assessment with <500m miss distance alerts to automate collision avoidance burns.",
        "Struggling with high operator fatigue monitoring concurrent multi-satellite telemetry streams at ISTRAC.",
        "Requires automated cross-correlation between solar weather flares (Kp index) and sensor single-event upsets.",
        "Seeking automated ITU radio frequency coordination and IADC 25-year space debris mitigation compliance dossier generation."
    ]
    
    for i in range(1, 151):
        partner_tpl = random.choice(space_partners)
        comp_name = f"{partner_tpl[0]} - Unit #{random.randint(1, 9)}" if i > 15 else partner_tpl[0]
        email_prefix = comp_name.lower().replace(" ", "").replace("'", "").replace("(", "").replace(")", "").replace("-", "")[:12]
        contact_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        
        loc = partner_tpl[2]
        score = random.randint(40, 99)
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
            phone=f"+91 80 2800 {random.randint(1000, 9999)}",
            email=f"operations@{email_prefix}.space",
            lead_score=score,
            status=status,
            pain_point=random.choice(pain_points),
            last_contacted=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)) if status != "new" else None
        )
        session.add(lead)

    # 7. Seed Mission Operational Contracts (20 active space contracts)
    contracts = [
        ("ISRO ISTRAC Ground Station Telemetry Grid", "Enterprise Orbit Grid", 1200000.0),
        ("Defence Space Agency (DSA) Sentinel Node", "Defense Mission Tier", 600000.0),
        ("Pixxel Hyperspectral Constellation Monitor", "Constellation Tier", 350000.0),
        ("Dhruva Space Orbital Bus Operations", "Constellation Tier", 280000.0),
        ("National Remote Sensing Centre (NRSC)", "Defense Mission Tier", 550000.0),
        ("Planet Labs Dove Fleet Conjunction Node", "Constellation Tier", 420000.0),
        ("GalaxEye Space SAR Early Warning", "Defense Mission Tier", 500000.0),
        ("Bellatrix Propulsion Health Telemetry", "Constellation Tier", 250000.0)
    ]
    for i in range(1, 21):
        ct = random.choice(contracts)
        comp_name = f"{ct[0]} #{i}" if i > 8 else ct[0]
        customer = Customer(
            company_name=comp_name,
            plan=ct[1],
            revenue=ct[2],
            status="active"
        )
        session.add(customer)

    # 8. Seed Financial Transactions (Spacecraft operations & ground tracking)
    categories = {
        "ground_station": "ISTRAC & Svalbard Downlink Dish Antenna Array Rental",
        "propellant": "High-Purity Hydrazine & Xenon Propulsion Resupply",
        "software": "Orbital Ephemeris & Conjunction Supercomputing Cloud Cluster",
        "payload": "Optical Star Tracker & Multispectral Sensor Calibration",
        "payroll": "Flight Operations Specialists & Mission Control Engineers"
    }
    
    for i in range(1, 26):
        date_tx = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))
        tx = FinancialTransaction(
            type="revenue",
            category="contract",
            amount=random.choice([350000.0, 600000.0, 1200000.0]),
            description="Mission Telemetry Monitoring & Conjunction Screening Contract Revenue",
            date=date_tx
        )
        session.add(tx)
        
    for i in range(1, 26):
        cat = random.choice(list(categories.keys()))
        date_tx = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))
        amt = random.randint(25000, 150000) if cat != "payroll" else 350000
        tx = FinancialTransaction(
            type="expense",
            category=cat,
            amount=float(amt),
            description=categories[cat],
            date=date_tx
        )
        session.add(tx)

    # 9. Seed Space Mission Documents (10 flight directives & compliance dossiers)
    doc_types = [
        ("Flight Directive", "Collision Avoidance Burn Procedure (COLA-2026-08)", "Flight operations procedure authorizing 12-second delta-V burn to increase orbital radial separation by +4.2 km..."),
        ("ITU Coordination", "X-Band Payload Frequency Allocation Accord", "International Telecommunication Union frequency assignment for 8.2 GHz high-throughput telemetry downlink..."),
        ("Compliance Dossier", "IADC Space Debris Mitigation Certification", "Certification confirming post-mission disposal compliance within 25-year deorbit timeline per UN COPUOS guidelines..."),
        ("Nominal Envelope", "Cartosat-3 Subsystem Operating Telemetry Baseline", "Baseline power curves, battery charging C-rate limits, and ADCS pointing jitter tolerances (+/- 0.05 deg)...")
    ]
    for i in range(1, 11):
        dtype, title, content = random.choice(doc_types)
        doc = Document(
            type=dtype,
            title=f"{title} - Rev {i}.0",
            content=content + f"\n\nSpaceXOS Cryptographic Signature: #SXOS-{random.randint(10000, 99999)}-ORBIT.",
            status=random.choice(["draft", "pending_review", "approved"]),
            created_by="Orbital Compliance Agent",
            approval_status=random.choice(["pending", "signed"])
        )
        session.add(doc)

    # 10. Seed Tasks (20 space mission tasks)
    tasks_pool = [
        ("Detection Agent", "Process ISTRAC Telemetry Stream", "Ingest 42ms telemetry packet stream for Cartosat-3 and RISAT-2BR1.", "high", "completed"),
        ("Incident Agent", "Subsystem Diagnostics Envelope", "Verify EPS solar bus voltages against ISRO baseline power envelope.", "high", "completed"),
        ("Risk Agent", "Conjunction Screening Pass", "Screen 42 space objects in LEO orbit corridor for miss-distance violations.", "high", "completed"),
        ("Reporting Agent", "Draft Incident Dossier EVT-C3", "Compile multi-agent findings and executive incident voice briefing.", "medium", "completed"),
        ("Detection Agent", "Downlink SNR Jitter Tracking", "Filter Kalman residual deviations on GSAT-7A X-band transponder.", "medium", "pending"),
        ("Risk Agent", "Orbital Decay Propagation", "Model atmospheric drag trajectory across SSO 505km perigee.", "high", "pending"),
        ("Incident Agent", "Reaction Wheel 3 Health Review", "Analyze fine pointing gyro rate jitter exceeding 0.08 deg threshold.", "high", "awaiting_approval")
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

    # 11. Seed Approvals (Space Mission Operational Approvals)
    approvals_pool = [
        ("Collision Avoidance Burn", "Risk Agent", "High", "Authorize 0.8 m/s delta-v thruster burn on RISAT-2BR1 to clear Cosmos-2251 orbital debris conjunction."),
        ("EPS Shunt Regulator Failover", "Incident Agent", "High", "Authorize automated EPS bus failover on Cartosat-3 following 58% voltage sag detection on primary shunt."),
        ("Flight Director Emergency Call", "Reporting Agent", "Medium", "Authorize automated Twilio voice briefing dispatch to Flight Operations Director for GSAT-7A SNR carrier margin drop.")
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
