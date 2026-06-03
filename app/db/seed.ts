import { getClient } from "../api/queries/connection";

async function seed() {
  const sql = getClient();

  // Check if already seeded
  const existing = await sql`SELECT id FROM users LIMIT 1`;
  if (existing.length > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  // Create demo user
  const [user] = await sql`
    INSERT INTO users (union_id, name, email, role)
    VALUES ('demo-user-1', 'Alex Rivera', 'alex@sellscout.ai', 'user')
    RETURNING id
  `;
  const userId = user.id;
  console.log("Created demo user:", userId);

  // Seed playbooks
  const playbookData = [
    {
      name: "SellScout Platform", color: "#C8A45E", status: "active",
      description: "AI-powered outbound sales platform. Helps teams create playbooks, generate emails, and run campaigns at scale.",
      product_name: "SellScout AI Platform", tagline: "AI-powered outbound sales that converts",
      category: "SaaS",
      value_propositions: ["Increase reply rates by 3x with AI-personalized outreach", "Save 10+ hours per week on email writing and research", "Book 40% more meetings with smart multi-step sequences"],
      icp_title: "VP of Sales at Series A-C SaaS companies",
      company_sizes: ["51-200", "201-500", "501-1000"],
      industries: ["SaaS", "B2B Software", "Sales Tech"],
      pain_points: ["Low reply rates on cold outreach", "Manual email personalization takes too long", "No visibility into what messaging works"],
      tone: "Professional",
    },
    {
      name: "DataSync Enterprise", color: "#5B8DB8", status: "active",
      description: "Enterprise data synchronization and integration platform. Connects 200+ data sources with real-time syncing.",
      category: "DevTools",
      value_propositions: ["Sync data across 200+ sources in real-time", "Reduce integration setup time from weeks to hours", "Enterprise-grade security and compliance"],
      icp_title: "CTO at mid-market enterprise companies",
      company_sizes: ["201-500", "501-1000", "1000+"],
      industries: ["Enterprise Software", "Data Infrastructure"],
      tone: "Professional",
    },
    {
      name: "CloudSecure Pro", color: "#7B8E7B", status: "draft",
      description: "Cloud security monitoring and compliance automation. Real-time threat detection for AWS, Azure, and GCP.",
      category: "Security",
      value_propositions: ["Automated compliance monitoring across all cloud providers", "Real-time threat detection with 99.9% accuracy", "Reduce security audit preparation by 80%"],
      icp_title: "CISO at cloud-first organizations",
      company_sizes: ["501-1000", "1000+"],
      industries: ["Cloud Infrastructure", "Cybersecurity"],
      tone: "Direct",
    },
    {
      name: "TeamFlow Analytics", color: "#C8A45E", status: "active",
      description: "Team productivity analytics and workflow optimization. Insights for engineering and product teams.",
      category: "SaaS",
      value_propositions: ["Identify bottlenecks in your engineering workflow", "Improve sprint velocity by up to 25%", "Data-driven insights for engineering managers"],
      icp_title: "Engineering Managers at tech companies",
      company_sizes: ["51-200", "201-500", "501-1000"],
      industries: ["SaaS", "DevTools"],
      tone: "Casual",
    },
    {
      name: "PayBridge API", color: "#9B7BB8", status: "paused",
      description: "Payment infrastructure API for fintech companies. Process payments in 40+ currencies with 99.99% uptime.",
      category: "Fintech",
      value_propositions: ["Process payments in 40+ currencies globally", "99.99% uptime SLA with dedicated support", "PCI DSS Level 1 compliant out of the box"],
      icp_title: "Head of Payments at fintech startups",
      company_sizes: ["11-50", "51-200", "201-500"],
      industries: ["Fintech", "Payments"],
      tone: "Professional",
    },
    {
      name: "HealthTrack Pro", color: "#4CAF7D", status: "draft",
      description: "Healthcare compliance tracking and patient data management. HIPAA-compliant SaaS for clinics and hospitals.",
      category: "HealthTech",
      value_propositions: ["HIPAA-compliant patient data management", "Automated compliance reporting for audits", "Streamline clinic operations and reduce admin time"],
      icp_title: "Practice managers at healthcare clinics",
      company_sizes: ["11-50", "51-200"],
      industries: ["HealthTech", "Healthcare"],
      tone: "Consultative",
    },
  ];

  for (const pb of playbookData) {
    await sql`
      INSERT INTO playbooks (
        user_id, name, color, status, description, product_name, tagline, category,
        value_propositions, icp_title, company_sizes, industries, pain_points, tone
      ) VALUES (
        ${userId}, ${pb.name}, ${pb.color}, ${pb.status}, ${pb.description},
        ${pb.product_name || null}, ${pb.tagline || null}, ${pb.category},
        ${pb.value_propositions as string[]}, ${pb.icp_title}, ${pb.company_sizes as string[]},
        ${pb.industries as string[]}, ${pb.pain_points as string[]}, ${pb.tone}
      )
    `;
    console.log("Created playbook:", pb.name);
  }

  // Seed prospects
  const prospectList = [
    { first_name: "Sarah", last_name: "Chen", email: "sarah.chen@stripe.com", company: "Stripe", title: "VP of Sales", industry: "Fintech", company_size: "1000+" },
    { first_name: "David", last_name: "Park", email: "david.park@notion.so", company: "Notion", title: "Head of Growth", industry: "SaaS", company_size: "201-500" },
    { first_name: "Lisa", last_name: "Wong", email: "lisa.wong@figma.com", company: "Figma", title: "Sales Director", industry: "SaaS", company_size: "501-1000" },
    { first_name: "Alex", last_name: "Rivera", email: "alex.rivera@linear.app", company: "Linear", title: "Engineering Manager", industry: "DevTools", company_size: "51-200" },
    { first_name: "Emma", last_name: "Thompson", email: "emma.thompson@shopify.com", company: "Shopify", title: "VP of Revenue", industry: "E-commerce", company_size: "1000+" },
    { first_name: "Michael", last_name: "Chen", email: "michael.chen@airtable.com", company: "Airtable", title: "Sales Lead", industry: "SaaS", company_size: "501-1000" },
    { first_name: "Rachel", last_name: "Kim", email: "rachel.kim@datadog.com", company: "Datadog", title: "Director of Sales", industry: "DevTools", company_size: "1000+" },
    { first_name: "Tom", last_name: "Harris", email: "tom.harris@twilio.com", company: "Twilio", title: "VP of Outbound", industry: "SaaS", company_size: "1000+" },
  ];

  for (const p of prospectList) {
    await sql`
      INSERT INTO prospects (user_id, first_name, last_name, email, company, title, industry, company_size)
      VALUES (${userId}, ${p.first_name}, ${p.last_name}, ${p.email}, ${p.company}, ${p.title}, ${p.industry}, ${p.company_size})
    `;
  }
  console.log("Created", prospectList.length, "prospects");

  console.log("\n✅ Database seeded successfully!");
}

seed().catch(console.error);
