export const TEMPLATE_CATEGORIES = ['Software', 'Marketing', 'Design', 'Operations'];

export const predefinedTemplates = [
  {
    _id: 'predefined-1',
    name: 'Website Development',
    description: 'Complete website development project covering design, development, testing, and deployment phases.',
    category: 'Software',
    defaultDuration: 45,
    usageCount: 14,
    createdBy: { name: 'System' },
    tasks: [
      { title: 'Requirements Gathering', description: 'Collect and document project requirements', priority: 'High', estimatedDays: 3 },
      { title: 'UI/UX Design', description: 'Create wireframes and design mockups', priority: 'High', estimatedDays: 7 },
      { title: 'Frontend Development', description: 'Implement user interface with modern frameworks', priority: 'Medium', estimatedDays: 15 },
      { title: 'Backend Development', description: 'Develop server-side functionality and APIs', priority: 'Medium', estimatedDays: 12 },
      { title: 'Testing & QA', description: 'Test functionality and fix bugs', priority: 'High', estimatedDays: 5 },
      { title: 'Deployment', description: 'Deploy to production environment', priority: 'Medium', estimatedDays: 3 }
    ]
  },
  {
    _id: 'predefined-2',
    name: 'Marketing Campaign',
    description: 'Comprehensive marketing campaign workflow from market research to multi-channel execution and tracking.',
    category: 'Marketing',
    defaultDuration: 30,
    usageCount: 8,
    createdBy: { name: 'System' },
    tasks: [
      { title: 'Market Research', description: 'Research target audience and competitors', priority: 'High', estimatedDays: 5 },
      { title: 'Campaign Strategy', description: 'Develop campaign strategy and messaging', priority: 'High', estimatedDays: 3 },
      { title: 'Content Creation', description: 'Create marketing materials and copy', priority: 'Medium', estimatedDays: 10 },
      { title: 'Campaign Launch', description: 'Execute campaign across channels', priority: 'High', estimatedDays: 2 },
      { title: 'Performance Monitoring', description: 'Track conversion metrics and ROI', priority: 'Medium', estimatedDays: 10 }
    ]
  },
  {
    _id: 'predefined-3',
    name: 'Mobile App Development',
    description: 'End-to-end mobile application sprint plan for iOS and Android native and cross-platform clients.',
    category: 'Software',
    defaultDuration: 60,
    usageCount: 19,
    createdBy: { name: 'System' },
    tasks: [
      { title: 'App Concept & Architecture', description: 'Define app concept and technical architecture', priority: 'High', estimatedDays: 5 },
      { title: 'UI/UX Mobile Design', description: 'Design app interface and navigation flow', priority: 'High', estimatedDays: 10 },
      { title: 'Client Development', description: 'Develop mobile screens and offline storage', priority: 'Medium', estimatedDays: 20 },
      { title: 'Backend API Integration', description: 'Connect REST/GraphQL endpoints', priority: 'Medium', estimatedDays: 15 },
      { title: 'Device Matrix Testing', description: 'Test performance across device sizes', priority: 'High', estimatedDays: 7 },
      { title: 'Store Release', description: 'Submit app bundle to App Store and Google Play', priority: 'Medium', estimatedDays: 3 }
    ]
  },
  {
    _id: 'predefined-4',
    name: 'SaaS Microservices Migration',
    description: 'Decompose monolithic backend services into decoupled microservices with distributed caching and event streaming.',
    category: 'Software',
    defaultDuration: 45,
    usageCount: 23,
    createdBy: { name: 'System' },
    tasks: [
      { title: 'API Gateway Setup', description: 'Configure routing, rate limiting, and JWT validation', priority: 'High', estimatedDays: 5 },
      { title: 'Distributed Cache Layer', description: 'Implement Redis caching with cache-aside pattern', priority: 'High', estimatedDays: 8 },
      { title: 'Database Read-Replica Split', description: 'Configure master-replica database connections', priority: 'High', estimatedDays: 10 },
      { title: 'Event-Driven Message Queues', description: 'Deploy message broker pipelines for async tasks', priority: 'Medium', estimatedDays: 12 },
      { title: 'Zero-Downtime Deployment', description: 'Configure rolling updates and blue-green staging', priority: 'High', estimatedDays: 6 },
      { title: 'Observability & Alerting', description: 'Setup Prometheus metrics and health check probes', priority: 'Medium', estimatedDays: 4 }
    ]
  },
  {
    _id: 'predefined-5',
    name: 'Security & Compliance Audit',
    description: 'Comprehensive enterprise security hardening, vulnerability scanning, and SOC-2 access control validation.',
    category: 'Operations',
    defaultDuration: 30,
    usageCount: 11,
    createdBy: { name: 'System' },
    tasks: [
      { title: 'IAM & RBAC Access Review', description: 'Audit user roles and enforce principle of least privilege', priority: 'High', estimatedDays: 5 },
      { title: 'Dependency Vulnerability Triage', description: 'Audit package vulnerabilities and apply security patches', priority: 'High', estimatedDays: 7 },
      { title: 'Encryption & Secrets Audit', description: 'Verify TLS enforcement and encrypted secrets rotation', priority: 'High', estimatedDays: 6 },
      { title: 'Penetration Testing & Fixes', description: 'Run automated OWASP penetration tests and address findings', priority: 'High', estimatedDays: 8 },
      { title: 'Incident Response Protocol', description: 'Document disaster recovery and data retention runbooks', priority: 'Medium', estimatedDays: 4 }
    ]
  },
  {
    _id: 'predefined-6',
    name: 'Design System & Component Kit',
    description: 'Build a scalable, accessible design system with tokenized color palettes, reusable primitives, and documentation.',
    category: 'Design',
    defaultDuration: 25,
    usageCount: 16,
    createdBy: { name: 'System' },
    tasks: [
      { title: 'Design Token Specification', description: 'Define spacing, typography, and semantic color tokens', priority: 'High', estimatedDays: 4 },
      { title: 'Accessible Primitives Library', description: 'Build WCAG AA compliant buttons, modals, and inputs', priority: 'High', estimatedDays: 8 },
      { title: 'Interactive Storybook Setup', description: 'Publish interactive component documentation and sandbox', priority: 'Medium', estimatedDays: 5 },
      { title: 'Complex Form Components', description: 'Implement validation states and password toggles', priority: 'Medium', estimatedDays: 5 },
      { title: 'Visual Regression Testing', description: 'Configure Playwright visual snapshot test suite', priority: 'Medium', estimatedDays: 3 }
    ]
  },
  {
    _id: 'predefined-7',
    name: 'Payment Gateway Integration',
    description: 'Production payment pipeline with webhook verification, distributed idempotency, and transactional ledger entries.',
    category: 'Software',
    defaultDuration: 20,
    usageCount: 27,
    createdBy: { name: 'System' },
    tasks: [
      { title: 'Gateway SDK Configuration', description: 'Initialize secure client SDK and checkout session handlers', priority: 'High', estimatedDays: 3 },
      { title: 'Webhook Idempotency Handler', description: 'Validate signatures and store unique transaction hashes', priority: 'High', estimatedDays: 5 },
      { title: 'Double-Entry Ledger Records', description: 'Record immutable debit and credit ledger rows atomically', priority: 'High', estimatedDays: 5 },
      { title: 'Retry & Dead-Letter Pipeline', description: 'Handle exponential backoff for failed webhook deliveries', priority: 'Medium', estimatedDays: 4 },
      { title: 'Sandbox Reconciliation Tests', description: 'Verify end-to-end payment flows and refund scenarios', priority: 'High', estimatedDays: 3 }
    ]
  }
];

export const getPredefinedTemplateById = (id) => {
  return predefinedTemplates.find((t) => t._id === id) || null;
};

export const getCategoryBadgeClass = (category) => {
  switch (category?.toLowerCase()) {
    case 'software':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'marketing':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'design':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'operations':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};
