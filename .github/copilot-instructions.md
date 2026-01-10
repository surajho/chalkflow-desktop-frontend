# Chalkflow Desktop Frontend - Electron Application

This is a TypeScript-based Electron application for Chalkflow.

## Architecture

- Main process: Handles system-level operations and communicates with Python FastAPI backend
- Renderer process: React-based UI with TypeScript
- Preload script: Secure IPC bridge using contextBridge

## Development Guidelines

- Follow Electron security best practices
- Use TypeScript for all code
- Maintain strict type checking
- Keep IPC communication well-documented
- Coding standards SOLID, DRY and YAGNI should be adhered
- We're working through Test Driven Development
- **Use Yarn** as the package manager (not npm) for all commands

## TypeScript Strict Typing

**Always use explicit, specific types. Avoid vague types.**

### Forbidden Types (unless absolutely necessary)

- ❌ `any` - Never use. This defeats the purpose of TypeScript
- ❌ `unknown` - Avoid. Use specific types or union types instead
- ❌ `object` - Too vague. Define the actual shape with an interface
- ❌ `Function` - Use specific function signatures: `(param: string) => void`

### Required Practices

- ✅ Define interfaces for all data structures
- ✅ Use union types for variables that can be multiple specific types
- ✅ Type all function parameters and return values explicitly
- ✅ Use generics when creating reusable components/functions
- ✅ Prefer `interface` over `type` for object shapes
- ✅ Use `Record<string, SpecificType>` instead of `Record<string, any>`
- ✅ Type React component props with explicit interfaces
- ✅ Use proper types for API responses, not just `data: any`

### Examples

```typescript
// ❌ Bad
const data: any = await fetch();
function process(item: any): any {}

// ✅ Good
interface UserData {
  id: string;
  name: string;
  email: string;
}
const data: UserData = await fetch();
function process(item: UserData): ProcessedResult {}

// ❌ Bad
const config: Record<string, any> = {};

// ✅ Good
interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}
const config: Config = {};
```

## Build Verification

After making changes and running tests successfully, **always run `yarn build`** to verify
the TypeScript compilation succeeds. Tests passing does not guarantee the build will succeed
due to:

- Type errors that only appear during full compilation
- Import/export issues across modules
- Missing type definitions
- Configuration mismatches

**Workflow:**

1. Make code changes
2. Run tests: `yarn test`
3. If tests pass, run build: `yarn build`
4. Fix any build errors before considering the work complete

## Testing Strategy

Each test type should only test what it's designed for. Avoid over-testing and redundancy.

### Unit Tests

- Business logic only
- Pure functions and utilities
- No DOM, no external dependencies
- Use mocks for all dependencies

### Component Tests

- React component rendering and behavior
- User interactions within isolated components
- Props and state management
- No API calls, no IPC communication

### Integration Tests

- IPC communication between main and renderer processes
- Preload script and contextBridge functionality
- Multiple components working together
- Mock external APIs

### E2E Tests

- Complete user workflows only
- Critical paths (login → scrape → export)
- Real interactions, minimal mocking
- Test the complete system, not individual features

### Security Tests

- Electron security configuration
- Context isolation enforcement
- Exposed API surface validation
- No duplication of unit/integration tests
