# Codebase Architecture & Design Evaluation


  ## Context
  You are evaluating the jump-to-recipe codebase - a Nextjs/TypeScript recipe application with recipe storage, exploration and managemment features.


  ## Constitutional Compliance
  Review against these NON-NEGOTIABLE principles


  1. 
**Accessibility-First**
: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
  2. 
**Test-First Development**
: TDD with Red-Green-Refactor, comprehensive test coverage
  3. 
**Privacy by Default**
: Anonymous-first, session-based tracking, no PII
  4. 
**Component-Driven Architecture**
: shadcn/Radix components, clear separation of concerns
  5. 
**Documentation-Driven Development**
: OpenSpec workflow, progress reports, architecture docs


  
## Evaluation Scope


  
### 1. Architecture Review
  - 
**Component Organization**
: Are components properly separated (presentation/logic/data)?
  - 
**State Management**
: Is recipe state handling optimal? Any unnecessary complexity?
  - 
**Type Safety**
: Are TypeScript types comprehensive and correctly applied?
  - 
**API Design**
: Is the client/server contract clean and maintainable?
  - 
**File Structure**
: Does `src/` organization follow stated patterns?


  
### 2. Code Quality
  - 
**Duplication**
: Identify repeated patterns that should be abstracted
  - 
**Large Files**
: Flag files >300 lines that should be split
  - 
**Circular Dependencies**
: Map import cycles that need breaking
  - 
**Dead Code**
: Find unused exports, components, or utilities
  - 
**Naming Conventions**
: Check consistency across codebase


  
### 3. Performance & Scalability
  - 
**Bundle Size**
: Are there optimization opportunities (code splitting, lazy loading)?
  - 
**Re-renders**
: Identify unnecessary Nextjs re-renders
  - 
**Database Queries**
: Review query efficiency and N+1 patterns
  - 
**Caching**
: Are there missing caching opportunities?


  
### 4. Testing Gaps
  - 
**Coverage**
: Where is test coverage insufficient?
  - 
**Test Quality**
: Are tests testing the right things? Any brittle tests?
  - 
**Test Types**
: Are tests properly categorized? Any missing types?
  -
**Test Patterns**
: Are tests testing the right things? Any brittle tests?


  
### 5. Technical Debt
  - 
**Dependencies**
: Outdated packages or security vulnerabilities?
  - 
**Deprecated Patterns**
: Code using outdated approaches?
  - 
**TODOs/FIXMEs**
: Catalog inline code comments needing resolution
  - 
**Error Handling**
: Where is error handling missing or inadequate?


  
### 6. Constitutional Violations
  - 
**Accessibility**
: Where does code fall short of WCAG 2.1 AA?
  - 
**Privacy**
: Any PII leakage or consent mechanism gaps?
  - 
**Component Reuse**
: Are there duplicate UI components vs. shadcn library?
  - 
**Documentation**
: Missing progress reports or architecture updates?


  
## Analysis Instructions


  1. 
**Read Key Files First**
:
     - `/package.json` - Project metadata
     - `/tsconfig.json` - TypeScript configuration
     - `/next.config.js` - Next.js configuration
     - `/next-env.d.ts` - Environment variable types
     - `/src/types/index.ts` - Type definitions


  2. 
**Scan Codebase Systematically**
:
     - Use Glob to find all TS/TSX files
     - Use Grep to search for patterns (TODOs, any, console.log, etc.)
     - Read large/complex files completely


  3. 
**Prioritize Recommendations**
:
     - 
**P0 (Critical)**
: Constitutional violations, security issues, broken functionality
     - 
**P1 (High)**
: Performance bottlenecks, major tech debt, accessibility gaps
     - 
**P2 (Medium)**
: Code quality improvements, refactoring opportunities
     - 
**P3 (Low)**
: Nice-to-haves, style consistency


  
## Deliverable Format


  Provide a structured report with:


  
### Executive Summary
  - Overall codebase health score (1-10)
  - Top 3 strengths
  - Top 5 critical issues


  
### Detailed Findings
  For each finding:
  - 
**Category**
: Architecture | Code Quality | Testing | Performance | Constitutional
  - 
**Priority**
: P0 | P1 | P2 | P3
  - 
**Location**
: File paths and line numbers
  - 
**Issue**
: What's wrong and why it matters
  - 
**Recommendation**
: Specific, actionable fix with code examples
  - 
**Effort**
: Hours/days estimate
  - 
**Impact**
: What improves when fixed


  
### Refactoring Roadmap
  - Quick wins (< 2 hours each)
  - Medium efforts (2-8 hours)
  - Large initiatives (1-3 days)
  - Suggest implementation order based on dependencies


  
### Constitutional Compliance Score
  Rate 1-10 on each principle with justification:
  - Accessibility-First: __/10
  - Test-First Development: __/10
  - Privacy by Default: __/10
  - Component-Driven Architecture: __/10
  - Documentation-Driven Development: __/10


  
### Risk Assessment
  - What will break if left unaddressed?
  - What's slowing down current development velocity?
  - What's preventing the team from meeting business KPIs (65% completion, 4.0/5 resonance)?


  
## Success Criteria
  The evaluation should enable the team to:
  1. Confidently prioritize next quarter's tech debt work
  2. Identify quick wins for immediate implementation
  3. Understand architectural patterns to reinforce vs. refactor
  4. Make informed decisions on new feature implementations