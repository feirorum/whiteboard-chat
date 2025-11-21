import type { ExampleScenario } from '../types';

export const ecommerceExample: ExampleScenario = {
  id: 'ecommerce',
  name: 'E-Commerce System',
  description: 'A basic client-server-database architecture that can evolve into a microservices system with caching, queues, and more.',
  initialDiagram: `flowchart TB
    subgraph Client
        Web[Web Browser]
        Mobile[Mobile App]
    end

    subgraph Backend
        API[API Server]
        DB[(Database)]
    end

    Web --> API
    Mobile --> API
    API --> DB`,
  suggestedPrompts: [
    'Add a caching layer between the API and database to improve read performance',
    'Split the monolithic API into separate Product, Order, and User services',
    'Add a message queue for handling order processing asynchronously',
    'Introduce a CDN for static assets and an API gateway for routing',
    'Add authentication service with OAuth support',
  ],
  expectedEvolution: [
    'Adding Redis cache',
    'Microservices decomposition',
    'RabbitMQ/Kafka integration',
    'API Gateway pattern',
    'Auth service with JWT',
  ],
};

export const authFlowExample: ExampleScenario = {
  id: 'auth-flow',
  name: 'Authentication Flow',
  description: 'A simple login flow that can evolve to include OAuth, MFA, session management, and security features.',
  initialDiagram: `sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant D as Database

    U->>C: Enter credentials
    C->>S: POST /login
    S->>D: Validate credentials
    D-->>S: User data
    S-->>C: JWT Token
    C-->>U: Login success`,
  suggestedPrompts: [
    'Add OAuth2 flow for social login (Google, GitHub)',
    'Implement multi-factor authentication with TOTP',
    'Add session management with refresh tokens',
    'Include rate limiting and brute force protection',
    'Add password reset flow with email verification',
  ],
  expectedEvolution: [
    'OAuth provider integration',
    'TOTP/SMS verification step',
    'Refresh token rotation',
    'Rate limiter middleware',
    'Email service integration',
  ],
};

export const dataPipelineExample: ExampleScenario = {
  id: 'data-pipeline',
  name: 'Data Pipeline',
  description: 'A basic ETL pipeline that can evolve to include validation, error handling, monitoring, and parallel processing.',
  initialDiagram: `flowchart LR
    subgraph Sources
        S1[API Source]
        S2[File Upload]
        S3[Database Sync]
    end

    subgraph Processing
        ETL[ETL Service]
    end

    subgraph Storage
        DW[(Data Warehouse)]
    end

    S1 --> ETL
    S2 --> ETL
    S3 --> ETL
    ETL --> DW`,
  suggestedPrompts: [
    'Add data validation and schema checking before processing',
    'Implement error handling with dead letter queue',
    'Add monitoring and alerting for pipeline health',
    'Enable parallel processing with worker pools',
    'Add data quality checks and anomaly detection',
  ],
  expectedEvolution: [
    'Schema validator component',
    'DLQ for failed records',
    'Metrics and alerting service',
    'Worker pool architecture',
    'Quality scoring system',
  ],
};

export const chatbotArchExample: ExampleScenario = {
  id: 'chatbot-arch',
  name: 'Chatbot Architecture',
  description: 'A basic chatbot that can evolve to include RAG, multi-model routing, conversation memory, and tool use.',
  initialDiagram: `flowchart TB
    subgraph Frontend
        UI[Chat Interface]
    end

    subgraph Backend
        API[Chat API]
        LLM[LLM Service]
    end

    UI <--> API
    API <--> LLM`,
  suggestedPrompts: [
    'Add RAG with vector database for knowledge retrieval',
    'Implement conversation memory with context window management',
    'Add multi-model router for different query types',
    'Include tool/function calling capabilities',
    'Add streaming responses and typing indicators',
  ],
  expectedEvolution: [
    'Vector DB + embedding service',
    'Conversation store with summarization',
    'Model router with intent classification',
    'Tool registry and executor',
    'SSE/WebSocket streaming',
  ],
};

export const microservicesExample: ExampleScenario = {
  id: 'microservices',
  name: 'Microservices Migration',
  description: 'Plan the decomposition of a monolith into microservices with proper boundaries and communication patterns.',
  initialDiagram: `flowchart TB
    subgraph Monolith
        App[Application Server]
        subgraph Modules
            Users[User Module]
            Products[Product Module]
            Orders[Order Module]
            Payments[Payment Module]
            Notifications[Notification Module]
        end
        DB[(Shared Database)]
    end

    Client[Client] --> App
    Users --> DB
    Products --> DB
    Orders --> DB
    Payments --> DB
    Notifications --> DB`,
  suggestedPrompts: [
    'Extract the User module into a separate service with its own database',
    'Add an API gateway for routing and authentication',
    'Implement event-driven communication between services',
    'Add service discovery and load balancing',
    'Implement the saga pattern for distributed transactions',
  ],
  expectedEvolution: [
    'User service extraction',
    'API Gateway layer',
    'Event bus (Kafka/RabbitMQ)',
    'Service mesh/discovery',
    'Saga orchestrator',
  ],
};

export const allExamples: ExampleScenario[] = [
  ecommerceExample,
  authFlowExample,
  dataPipelineExample,
  chatbotArchExample,
  microservicesExample,
];

export function getExampleById(id: string): ExampleScenario | undefined {
  return allExamples.find(e => e.id === id);
}
