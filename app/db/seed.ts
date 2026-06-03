import { getDb } from "../api/queries/connection";
import { users, playbooks, campaigns, sequenceSteps, prospects } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  const db = getDb();

  // Check if data already exists
  const existingUsers = await db.query.users.findMany();
  if (existingUsers.length > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  // Create a demo user
  const [userResult] = await db.insert(users).values({
    unionId: "demo-user-1",
    name: "Alex Rivera",
    email: "alex@sellscout.ai",
    role: "user",
  }).$returningId();
  const userId = userResult.id;
  console.log("Created demo user:", userId);

  // ─── Seed Playbooks ───
  const playbookData = [
    {
      userId,
      name: "SellScout Platform",
      color: "#C8A45E",
      status: "active" as const,
      description: "AI-powered outbound sales platform. Helps teams create playbooks, generate emails, and run campaigns at scale.",
      productName: "SellScout AI Platform",
      tagline: "AI-powered outbound sales that converts",
      category: "SaaS",
      valuePropositions: [
        "Increase reply rates by 3x with AI-personalized outreach",
        "Save 10+ hours per week on email writing and research",
        "Book 40% more meetings with smart multi-step sequences",
      ],
      icpTitle: "VP of Sales at Series A-C SaaS companies",
      companySizes: ["51-200", "201-500", "501-1000"],
      industries: ["SaaS", "B2B Software", "Sales Tech"],
      painPoints: [
        "Low reply rates on cold outreach",
        "Manual email personalization takes too long",
        "No visibility into what messaging works",
      ],
      tone: "Professional",
    },
    {
      userId,
      name: "DataSync Enterprise",
      color: "#5B8DB8",
      status: "active" as const,
      description: "Enterprise data synchronization and integration platform. Connects 200+ data sources with real-time syncing.",
      category: "DevTools",
      valuePropositions: [
        "Sync data across 200+ sources in real-time",
        "Reduce integration setup time from weeks to hours",
        "Enterprise-grade security and compliance",
      ],
      icpTitle: "CTO at mid-market enterprise companies",
      companySizes: ["201-500", "501-1000", "1000+"],
      industries: ["Enterprise Software", "Data Infrastructure"],
      tone: "Professional",
    },
    {
      userId,
      name: "CloudSecure Pro",
      color: "#7B8E7B",
      status: "draft" as const,
      description: "Cloud security monitoring and compliance automation. Real-time threat detection for AWS, Azure, and GCP.",
      category: "Security",
      valuePropositions: [
        "Automated compliance monitoring across all cloud providers",
        "Real-time threat detection with 99.9% accuracy",
        "Reduce security audit preparation by 80%",
      ],
      icpTitle: "CISO at cloud-first organizations",
      companySizes: ["501-1000", "1000+"],
      industries: ["Cloud Infrastructure", "Cybersecurity"],
      tone: "Direct",
    },
    {
      userId,
      name: "TeamFlow Analytics",
      color: "#C8A45E",
      status: "active" as const,
      description: "Team productivity analytics and workflow optimization. Insights for engineering and product teams.",
      category: "SaaS",
      valuePropositions: [
        "Identify bottlenecks in your engineering workflow",
        "Improve sprint velocity by up to 25%",
        "Data-driven insights for engineering managers",
      ],
      icpTitle: "Engineering Managers at tech companies",
      companySizes: ["51-200", "201-500", "501-1000"],
      industries: ["SaaS", "DevTools"],
      tone: "Casual",
    },
    {
      userId,
      name: "PayBridge API",
      color: "#9B7BB8",
      status: "paused" as const,
      description: "Payment infrastructure API for fintech companies. Process payments in 40+ currencies with 99.99% uptime.",
      category: "Fintech",
      valuePropositions: [
        "Process payments in 40+ currencies globally",
        "99.99% uptime SLA with dedicated support",
        "PCI DSS Level 1 compliant out of the box",
      ],
      icpTitle: "Head of Payments at fintech startups",
      companySizes: ["11-50", "51-200", "201-500"],
      industries: ["Fintech", "Payments"],
      tone: "Professional",
    },
    {
      userId,
      name: "HealthTrack Pro",
      color: "#4CAF7D",
      status: "draft" as const,
      description: "Healthcare compliance tracking and patient data management. HIPAA-compliant SaaS for clinics and hospitals.",
      category: "HealthTech",
      valuePropositions: [
        "HIPAA-compliant patient data management",
        "Automated compliance reporting for audits",
        "Streamline clinic operations and reduce admin time",
      ],
      icpTitle: "Practice managers at healthcare clinics",
      companySizes: ["11-50", "51-200"],
      industries: ["HealthTech", "Healthcare"],
      tone: "Consultative",
    },
  ];

  const playbookIds: number[] = [];
  for (const pb of playbookData) {
    const [result] = await db.insert(playbooks).values(pb).$returningId();
    playbookIds.push(result.id);
    console.log("Created playbook:", pb.name);
  }

  // ─── Seed Campaigns ───
  const campaignData = [
    {
      userId,
      playbookId: playbookIds[0],
      name: "Q2 Enterprise Push",
      status: "active" as const,
      totalSent: 8421,
      totalOpened: 5970,
      totalReplied: 3208,
      meetingsBooked: 89,
      launchedAt: new Date("2025-03-15"),
    },
    {
      userId,
      playbookId: playbookIds[1],
      name: "Startup Outreach",
      status: "active" as const,
      totalSent: 4102,
      totalOpened: 2665,
      totalReplied: 1206,
      meetingsBooked: 34,
      launchedAt: new Date("2025-03-28"),
    },
    {
      userId,
      playbookId: playbookIds[2],
      name: "Fintech Compliance Drive",
      status: "draft" as const,
      totalSent: 0,
      totalOpened: 0,
      totalReplied: 0,
      meetingsBooked: 0,
    },
    {
      userId,
      playbookId: playbookIds[3],
      name: "Developer Tools Launch",
      status: "paused" as const,
      totalSent: 12004,
      totalOpened: 8523,
      totalReplied: 4946,
      meetingsBooked: 52,
      launchedAt: new Date("2025-02-10"),
    },
    {
      userId,
      playbookId: playbookIds[5],
      name: "Healthcare Pilot",
      status: "completed" as const,
      totalSent: 3200,
      totalOpened: 1952,
      totalReplied: 730,
      meetingsBooked: 12,
      launchedAt: new Date("2025-01-20"),
      completedAt: new Date("2025-03-01"),
    },
  ];

  const campaignIds: number[] = [];
  for (const camp of campaignData) {
    const [result] = await db.insert(campaigns).values(camp).$returningId();
    campaignIds.push(result.id);
    console.log("Created campaign:", camp.name);
  }

  // ─── Seed Sequence Steps ───
  const stepsData = [
    { campaignId: campaignIds[0], stepOrder: 1, day: 0, type: "email" as const, label: "Introduction", subject: "Quick question about {{company}}'s outbound", body: "Hi {{first_name}},\n\nI noticed {{company}} has been growing fast in the {{industry}} space. I help teams like yours increase outbound reply rates by 3x using AI-personalized emails.\n\nWorth a quick chat?\n\nBest" },
    { campaignId: campaignIds[0], stepOrder: 2, day: 3, type: "email" as const, label: "Follow-up", subject: "Following up: {{value_prop_1}} for {{company}}", body: "Hi {{first_name}},\n\nJust following up on my last note. {{company}}'s {{pain_point}} is something we solve for 200+ teams.\n\nOne of our clients in {{industry}} saw a 40% increase in meetings booked within 30 days.\n\nOpen to a 10-min call this week?\n\nBest" },
    { campaignId: campaignIds[0], stepOrder: 3, day: 7, type: "email" as const, label: "Break-up", subject: "Should I close the loop?", body: "Hi {{first_name}},\n\nI don't want to clutter your inbox. I'll assume timing isn't right and close the loop on this.\n\nIf AI-powered outreach ever becomes a priority for {{company}}, feel free to reach out.\n\nBest of luck!\n\nBest" },
  ];

  for (const step of stepsData) {
    await db.insert(sequenceSteps).values(step);
    console.log("Created sequence step:", step.label);
  }

  // ─── Seed Prospects ───
  const prospectData = [
    { userId, firstName: "Sarah", lastName: "Chen", email: "sarah.chen@stripe.com", company: "Stripe", title: "VP of Sales", industry: "Fintech", companySize: "1000+" },
    { userId, firstName: "David", lastName: "Park", email: "david.park@notion.so", company: "Notion", title: "Head of Growth", industry: "SaaS", companySize: "201-500" },
    { userId, firstName: "Lisa", lastName: "Wong", email: "lisa.wong@figma.com", company: "Figma", title: "Sales Director", industry: "SaaS", companySize: "501-1000" },
    { userId, firstName: "Alex", lastName: "Rivera", email: "alex.rivera@linear.app", company: "Linear", title: "Engineering Manager", industry: "DevTools", companySize: "51-200" },
    { userId, firstName: "Emma", lastName: "Thompson", email: "emma.thompson@shopify.com", company: "Shopify", title: "VP of Revenue", industry: "E-commerce", companySize: "1000+" },
    { userId, firstName: "Michael", lastName: "Chen", email: "michael.chen@airtable.com", company: "Airtable", title: "Sales Lead", industry: "SaaS", companySize: "501-1000" },
    { userId, firstName: "Rachel", lastName: "Kim", email: "rachel.kim@datadog.com", company: "Datadog", title: "Director of Sales", industry: "DevTools", companySize: "1000+" },
    { userId, firstName: "Tom", lastName: "Harris", email: "tom.harris@twilio.com", company: "Twilio", title: "VP of Outbound", industry: "SaaS", companySize: "1000+" },
  ];

  for (const prospect of prospectData) {
    await db.insert(prospects).values(prospect);
  }
  console.log("Created", prospectData.length, "prospects");

  console.log("\n✅ Database seeded successfully!");
}

seed().catch(console.error);
