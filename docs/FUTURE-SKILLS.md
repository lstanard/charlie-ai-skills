# Future Skill Recommendations

Potential skills to add to this repository, organized by priority. These recommendations are for a full-stack engineer with frontend focus and AWS backend experience.

---

## 🎯 High Priority (Foundational)

Skills that apply universally regardless of tech stack and are critical for production systems.

### 1. api-design
**Applies to:** Backend, Full-stack
**Why foundational:** Affects every backend service you build; mistakes are hard to fix later; complements data-layer and graphql-testing skills

**Potential coverage:**
- REST API conventions (resource naming, HTTP methods, status codes)
- GraphQL schema design (types, queries, mutations, resolvers)
- API versioning strategies (URL, header, or query param)
- Error response formats (consistent structure, error codes)
- Pagination patterns (cursor vs offset)
- Request/response validation
- API documentation (OpenAPI/Swagger)

**Examples:**
- Before/after: inconsistent endpoint naming → consistent REST conventions
- GraphQL schema evolution patterns
- Pagination implementations (cursor-based vs offset-based)

---

### 2. code-review
**Applies to:** Universal
**Why foundational:** Improves all code that goes into production; establishes team standards

**Potential coverage:**
- What to look for (security, performance, maintainability, test coverage)
- How to give constructive feedback (specific, actionable, kind)
- When to approve vs request changes
- Review scope (don't review everything in one pass; focus areas)
- Handling disagreements (escalation paths)
- Self-review checklist (before requesting review)
- Automated checks vs human review
- Review for different PR sizes (small vs large changes)

**Examples:**
- Good vs bad code review comments
- Self-review checklist template
- How to review refactoring PRs

---

### 3. security-fundamentals
**Applies to:** Frontend, Backend, Universal
**Why foundational:** Non-negotiable; security bugs are expensive; legal/compliance requirements

**Potential coverage:**
- Input validation and sanitization (prevent injection attacks)
- Authentication patterns (JWT, session, OAuth flows)
- Authorization patterns (RBAC, ABAC, resource ownership)
- Secrets management (never commit secrets, use environment vars, AWS Secrets Manager)
- Common vulnerabilities (XSS, CSRF, SQL injection prevention)
- CORS and security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting and abuse prevention
- Dependency scanning (npm audit, Dependabot)

**Examples:**
- XSS prevention in React vs backend
- JWT vs session tokens (when to use each)
- RBAC implementation patterns

---

## 🔧 Medium Priority (AWS-Focused)

Skills specific to AWS stack but highly valuable for that context.

### 4. aws-lambda-patterns
**Applies to:** Backend (AWS)
**Why useful:** Specific to AWS serverless; common mistakes are avoidable; improves cold start performance

**Potential coverage:**
- Handler structure (separate handler from business logic)
- Cold start optimization (init outside handler, lazy loading, provisioned concurrency)
- Error handling (when to return 200 vs 500; API Gateway integration)
- Event parsing (API Gateway, EventBridge, S3, SQS, DynamoDB Streams)
- Middleware pattern (for validation, auth, logging)
- Environment variables and configuration
- Testing Lambda handlers (mock events, local testing with SAM)
- Memory/timeout tuning

**Examples:**
- Before/after: handler with everything vs layered handler
- Cold start optimization techniques
- Middleware pattern for auth/validation

---

### 5. dynamodb-patterns
**Applies to:** Backend (AWS, NoSQL)
**Why useful:** DynamoDB requires different thinking than SQL; mistakes are costly to fix

**Potential coverage:**
- Single-table design (when and why)
- Access patterns first (design around queries, not entities)
- Primary key and sort key design
- GSI/LSI patterns (when to use each)
- Avoid scans (use queries; sparse indexes)
- Batch operations (BatchGetItem, BatchWriteItem)
- Optimistic locking (version attributes)
- DynamoDB Streams for change tracking
- Cost optimization (on-demand vs provisioned)

**Examples:**
- Multi-table vs single-table design
- Access pattern modeling (e.g., user profile + posts + comments)
- GSI design for query flexibility

---

## 📊 Lower Priority (Nice to Have)

Valuable skills but less foundational or more specialized.

### 6. caching-patterns
**Applies to:** Backend, Full-stack, Performance
**Why useful:** Performance optimization; reduces load on databases and APIs

**Potential coverage:**
- When to cache (read-heavy, expensive computations, rarely-changing data)
- Where to cache (browser, CDN, API layer, database query cache)
- Cache invalidation strategies (TTL, manual invalidation, cache tags)
- TTL patterns (aggressive vs conservative)
- Cache-aside vs read-through vs write-through
- Stale-while-revalidate
- Cache warming
- Cache key design

**Examples:**
- CDN caching with CloudFront
- Redis caching patterns
- Browser cache headers

---

### 7. graphql-schema-design
**Applies to:** Backend, Full-stack
**Why useful:** Complements graphql-testing; schema design affects frontend consumption

**Potential coverage:**
- Schema-first vs code-first
- Type design (avoid over-fetching, proper nullable vs non-nullable)
- Resolver patterns (N+1 prevention with DataLoader)
- Error handling in resolvers (field errors vs query errors)
- Pagination (relay-style cursor pagination, offset pagination)
- Authentication/authorization in resolvers (context injection)
- Schema stitching and federation
- Versioning GraphQL schemas (deprecation)

**Examples:**
- Before/after: N+1 query problem → DataLoader solution
- Pagination implementation patterns
- Error handling in resolvers

---

### 8. performance-optimization
**Applies to:** Frontend, Backend, Universal
**Why useful:** Production performance issues; cost optimization

**Potential coverage:**
- Profiling first (don't guess; measure)
- Database query optimization (indexing, explain plans, query analysis)
- N+1 query prevention (eager loading, DataLoader)
- Lazy loading vs eager loading (images, code splitting)
- Rate limiting and throttling
- Connection pooling (database connections)
- Memory optimization (avoid leaks)
- Bundle size optimization (webpack/vite analysis)
- Frontend performance (lighthouse, web vitals)

**Examples:**
- Database query optimization with EXPLAIN
- Code splitting strategies
- Image optimization patterns

---

### 9. database-design
**Applies to:** Backend
**Why useful:** Schema design affects everything; hard to change later

**Potential coverage:**
- Normalization vs denormalization (when to use each)
- Primary keys and foreign keys
- Indexing strategies (when and what to index)
- Schema migrations (up/down migrations, zero-downtime deploys)
- Soft deletes vs hard deletes
- Audit trails (created_at, updated_at, who changed)
- Handling time zones (always UTC in database)
- Full-text search patterns

**Examples:**
- E-commerce schema design
- Multi-tenant database patterns
- Migration strategies

---

## 📝 Implementation Notes

### When to Add a Skill

Add a skill when:
- ✅ You find yourself repeatedly explaining the same concept
- ✅ You've made the same mistake multiple times
- ✅ The pattern applies to multiple projects
- ✅ It fills a foundational gap

Don't add a skill when:
- ❌ It's too specific to one project
- ❌ It's a framework-specific detail (unless widely used)
- ❌ The pattern is still evolving (wait for it to stabilize)

### Skill Creation Process

1. **Identify the gap** - What knowledge is missing?
2. **Define scope** - What's included/excluded (non-goals)?
3. **Create skill.json** - Triggers, guarantees, notes
4. **Add examples** (if applicable) - Before/after code
5. **Generate files** - Run `npm run gen`
6. **Test with AI** - Use the skill in a conversation
7. **Iterate** - Refine based on usage

### Prioritization Framework

**High Priority = Universal + Foundational**
- Applies to many contexts (frontend + backend)
- Affects system design or production quality
- Hard to change later if done wrong

**Medium Priority = Specific but Valuable**
- Applies to your specific stack (AWS)
- Prevents common mistakes
- Improves specific outcomes (performance, security)

**Low Priority = Nice to Have**
- Specialized knowledge
- Can be learned on-demand
- Not blocking day-to-day work

---

## 🚀 Recommended Implementation Order

If implementing incrementally:

1. **security-fundamentals** - Non-negotiable, affects everything
2. **api-design** - Complements existing data-layer skill
3. **code-review** - Improves all future code
4. **aws-lambda-patterns** - High value for AWS stack
5. **dynamodb-patterns** - If DynamoDB is heavily used
6. Others as needed based on pain points

---

## 📚 Related Resources

- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

---

**Last Updated:** 2026-02-20
**Status:** Living document - update as skills are added or priorities change
