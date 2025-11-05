# Contributing to Peerpay Ledger

Thank you for your interest in contributing to Peerpay Ledger! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, gender identity, sexual orientation, disability, personal appearance, race, ethnicity, age, religion, or nationality.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, trolling, or derogatory comments
- Publishing others' private information
- Any conduct that could be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18+ installed
- **MongoDB** 6+ running locally or accessible remotely
- **Git** for version control
- **pnpm** package manager (recommended) or npm
- A code editor (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Peerpay.git
   cd Peerpay
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Celestial-0/Peerpay.git
   ```

### Setup Development Environment

1. **Navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**:
   ```bash
   pnpm run start:dev
   ```

5. **Run tests**:
   ```bash
   pnpm run test
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

**Examples:**
```bash
git checkout -b feature/add-group-transactions
git checkout -b fix/transaction-balance-calculation
git checkout -b docs/update-api-reference
```

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test your changes**:
   ```bash
   pnpm run test
   pnpm run test:e2e
   ```

4. **Commit your changes** (see commit message guidelines)

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Coding Standards

### TypeScript Style Guide

- **Use TypeScript** for all new code
- **Enable strict mode** in tsconfig.json
- **Use explicit types** - avoid `any` unless absolutely necessary
- **Use interfaces** for object shapes
- **Use enums** for fixed sets of values

**Example:**
```typescript
// ✅ Good
interface CreateTransactionDto {
  receiverId: string;
  amount: number;
  type: TransactionType;
  remarks?: string;
}

// ❌ Bad
function createTransaction(data: any) {
  // ...
}
```

### NestJS Conventions

- **Use decorators** appropriately (`@Injectable()`, `@Controller()`, etc.)
- **Follow module structure** - each feature should be a module
- **Use DTOs** for request/response validation
- **Use Zod** for runtime validation
- **Implement proper error handling** with custom exceptions

**Example:**
```typescript
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto, @User() user: UserDocument) {
    return this.transactionService.create(dto, user);
  }
}
```

### File Naming

- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **Modules**: `*.module.ts`
- **DTOs**: `*.dto.ts`
- **Entities**: `*.entity.ts`
- **Tests**: `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e)

### Code Formatting

- **Use Prettier** for code formatting
- **2 spaces** for indentation
- **Single quotes** for strings
- **Trailing commas** where valid
- **Semicolons** at end of statements

Run formatter before committing:
```bash
pnpm run format
```

## Testing Guidelines

### Test Coverage Requirements

- **Minimum 80% coverage** for new code
- **Unit tests** for all services and utilities
- **E2E tests** for critical API endpoints
- **Integration tests** for complex workflows

### Writing Tests

**Unit Test Example:**
```typescript
describe('TransactionService', () => {
  let service: TransactionService;
  let mockRepository: MockRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: getRepositoryToken(Transaction), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should create a transaction', async () => {
    const dto = { receiverId: '123', amount: 100, type: 'lent' };
    const result = await service.create(dto, mockUser);
    expect(result).toBeDefined();
    expect(result.amount).toBe(100);
  });
});
```

### Running Tests

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(transaction): add settlement tracking

Implement settlement tracking for completed transactions.
Includes database schema updates and API endpoints.

Closes #123
```

```
fix(auth): resolve token refresh race condition

Fix race condition when multiple requests attempt to refresh
the access token simultaneously.
```

```
docs(api): update transaction endpoint documentation

Add examples and clarify request/response formats.
```

### Best Practices

- **Use imperative mood** ("add" not "added")
- **Keep subject line under 72 characters**
- **Capitalize subject line**
- **No period at the end of subject**
- **Separate subject from body with blank line**
- **Reference issues and PRs** in footer

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass (tests, linting)
2. **At least one approval** required from maintainers
3. **Address review comments** promptly
4. **Squash commits** if requested
5. **Maintainer will merge** after approval

## Reporting Bugs

### Before Reporting

- **Search existing issues** to avoid duplicates
- **Test with latest version** to ensure bug still exists
- **Gather relevant information** (logs, screenshots, etc.)

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 11]
- Node.js: [e.g., 18.17.0]
- MongoDB: [e.g., 6.0.5]
- Version: [e.g., 0.0.1]

## Additional Context
Screenshots, logs, or other relevant information
```

## Suggesting Features

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives Considered
What other solutions did you consider?

## Additional Context
Mockups, examples, or references
```

### Feature Discussion

- **Open an issue** for discussion before implementing
- **Explain the use case** and benefits
- **Consider backwards compatibility**
- **Be open to feedback** and alternative approaches

## Development Tips

### Debugging

- Use **VS Code debugger** with launch configurations
- Add **console.log** or use **NestJS Logger**
- Check **MongoDB logs** for database issues
- Use **Postman** or **Thunder Client** for API testing

### Common Issues

**MongoDB Connection:**
```bash
# Ensure MongoDB is running
mongod --dbpath /path/to/data
```

**Port Already in Use:**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Dependency Issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Questions?

If you have questions or need help:

- **Open a discussion** on GitHub
- **Join our community** (if available)
- **Contact maintainers** via email

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Peerpay Ledger! 🎉
