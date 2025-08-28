# Claude Code Instructions for n8n-nodes-cloudflare-r2

## Project Overview

This is an n8n community node for Cloudflare R2 object storage integration. The project follows the successful pattern established by our n8n-nodes-cloudflare-d1 project, providing comprehensive file storage capabilities with full AI agent compatibility.

## Development Guidelines

### Code Style and Standards

1. **TypeScript First**
   - All code must be written in TypeScript with strict type checking
   - Use proper interfaces from n8n-workflow package
   - Maintain comprehensive type definitions in `types/CloudflareR2Types.ts`

2. **Architecture Patterns**
   - Follow resource-based operation structure (bucket/object/batch)
   - Use utility classes for API interactions (`CloudflareR2Utils.ts`)
   - Maintain separation between node logic and API operations
   - Implement proper error handling with `NodeOperationError`

3. **AI Agent Compatibility**
   - Always include `usableAsTool: true` in node descriptions
   - Write clear, AI-friendly descriptions for all operations and parameters
   - Provide comprehensive examples in parameter descriptions
   - Use structured error messages that AI can understand

### Project Structure

```
n8n-nodes-cloudflare-r2/
├── credentials/CloudflareR2Api.credentials.ts    # Secure credential handling
├── nodes/CloudflareR2/CloudflareR2.node.ts       # Main node implementation  
├── types/CloudflareR2Types.ts                    # TypeScript type definitions
├── utils/CloudflareR2Utils.ts                    # API utility functions
├── package.json                                  # Package configuration
├── tsconfig.json                                 # TypeScript configuration
└── docs/                                         # Comprehensive documentation
```

### API Integration Strategy

1. **Dual API Approach**
   - Use Cloudflare REST API for bucket management operations
   - Use S3-compatible API for object operations
   - Handle authentication with Bearer tokens
   - Implement proper error handling for both APIs

2. **Security Considerations**
   - Never log or expose API credentials
   - Validate all user inputs (bucket names, object keys)
   - Use HTTPS-only API communications
   - Implement proper error handling without leaking sensitive data

### Testing and Quality

1. **Build Process**
   - Always run `npm run build` before testing
   - Use `npm run lint` to check code quality
   - Format code with `npm run format`

2. **Error Handling**
   - Use `NodeOperationError` for user-facing errors
   - Provide clear error messages with actionable guidance
   - Include relevant context in error descriptions
   - Support `continueOnFail` for batch operations

### Documentation Standards

1. **Code Documentation**
   - Document all public methods with JSDoc comments
   - Include parameter descriptions and examples
   - Document error conditions and return types

2. **User Documentation**
   - Keep README.md comprehensive with examples
   - Update ARCHITECTURE.md for design changes
   - Maintain DEPLOYMENT.md for operational guidance
   - Update CHANGELOG.md for all changes

## Development Workflow

### Making Changes

1. **Update SCRATCHPAD.md** with your development notes
2. **Test locally** using npm link in ~/.n8n/custom/
3. **Update documentation** for any new features
4. **Run build and lint** before committing
5. **Update CHANGELOG.md** for all changes

### Commit Guidelines

- Use conventional commit format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Include detailed commit messages for complex changes
- Reference issues/tickets where applicable

### File Modification Guidelines

1. **Core Files** (require careful consideration):
   - `CloudflareR2.node.ts` - Main node implementation
   - `CloudflareR2Utils.ts` - API utility functions
   - `CloudflareR2Types.ts` - Type definitions
   - `package.json` - Package configuration

2. **Documentation Files** (update regularly):
   - `README.md` - User-facing documentation
   - `ARCHITECTURE.md` - Technical architecture
   - `DEPLOYMENT.md` - Operational guidance
   - `CHANGELOG.md` - Version history
   - `SCRATCHPAD.md` - Development notes

### Cloudflare R2 Feature Implementation

When implementing new R2 features:

1. **Research the API** using Cloudflare documentation
2. **Add type definitions** to CloudflareR2Types.ts
3. **Implement utilities** in CloudflareR2Utils.ts
4. **Add node operations** in CloudflareR2.node.ts
5. **Update documentation** with examples
6. **Test thoroughly** with real R2 buckets

### AI Agent Considerations

This node is designed for AI agent use. When adding features:

1. **Clear descriptions** that explain what the operation does
2. **Parameter examples** that show expected input formats
3. **Error messages** that provide guidance for AI decision-making
4. **Structured responses** that AI can easily parse and use

### Dependencies and Versions

- **n8n-workflow**: Peer dependency for n8n integration
- **TypeScript**: Development dependency for type checking
- **ESLint**: Development dependency for code quality
- **Node.js**: Minimum version 20.15 for modern JavaScript features

### Environment Setup

For development, ensure you have:
- Node.js 20.15 or later
- npm or yarn package manager
- TypeScript globally installed
- Access to a Cloudflare account with R2 enabled
- Valid Cloudflare API token with R2 permissions

## Troubleshooting Common Issues

### Build Issues
- Ensure TypeScript is properly configured
- Check that all dependencies are installed
- Verify file permissions for build output

### API Integration Issues
- Verify Cloudflare API token has correct permissions
- Check account ID is correct format
- Ensure network connectivity to Cloudflare APIs
- Validate bucket names follow R2 naming rules

### n8n Integration Issues
- Confirm node is properly linked in ~/.n8n/custom/
- Restart n8n after making changes
- Check n8n logs for detailed error information
- Verify credentials are properly configured

## Future Development

### Planned Features
- Multipart upload support for large files
- Object lifecycle management
- Event notification integration
- Public bucket and custom domain support
- Advanced CORS and security policies

### Performance Optimization
- Connection pooling for multiple operations
- Streaming support for large files
- Efficient batch operations
- Memory optimization for large datasets

This project maintains high standards for code quality, security, and user experience. Always consider the impact on both human users and AI agents when making changes.