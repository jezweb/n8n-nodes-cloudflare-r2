# Changelog

All notable changes to the n8n-nodes-cloudflare-r2 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-09-02

### Added
- 🎉 **Native Base64 Data Support** for direct file uploads
  - New data source option "Base64 Data" alongside Binary Data and Text Content
  - Direct upload from base64-encoded strings without intermediate Code nodes
  - Support for both raw base64 strings and data URLs (data:image/png;base64,...)
  - Automatic MIME type detection from data URL prefixes
  - Optional filename and MIME type override parameters
  - Expression support for JSON paths (e.g., {{ $json.file.data }})
  - Comprehensive error handling for invalid base64 content

### Enhanced
- 🤖 **Improved AI Agent Compatibility**
  - AI agents can now directly pass base64 data for file uploads
  - Better integration with webhook data containing base64 files
  
- 🔗 **Webhook Integration**
  - Seamless handling of base64 file data from webhooks
  - Support for form submissions with file uploads
  - Direct processing of API responses with base64-encoded content

### Technical Details
- Automatic MIME type detection from multiple sources:
  - Data URL prefix (data:image/png;base64,...)
  - File extension from optional filename parameter
  - Fallback to application/octet-stream for unknown types
- Whitespace removal for robust base64 parsing
- Buffer conversion with proper error handling

## [0.1.2] - 2025-08-30

### Fixed
- 🔧 **Critical authentication bug** for S3-compatible API operations
  - Fixed 400 Bad Request errors when uploading/downloading objects
  - Replaced incorrect Bearer token authentication with AWS Signature V4 for object operations
  - Added proper request signing using aws4 library

### Changed
- 🔑 **Enhanced credential configuration**
  - Added Access Key ID and Secret Access Key fields for S3-compatible API
  - Retained API Token for bucket management operations
  - Updated credential descriptions with clear usage guidance

### Added
- 📦 Added `aws4` dependency for proper AWS Signature V4 request signing
- 📚 Improved documentation with detailed credential setup instructions

## [0.1.1] - 2025-08-29

### Fixed
- Fixed node name conflicts with existing Cloudflare packages
- Updated package name to avoid naming collisions

## [0.1.0] - 2025-08-28

### Added
- 🎉 **Initial release** of n8n-nodes-cloudflare-r2
- 📦 **Bucket Operations**
  - Create buckets with optional location hints
  - List all buckets in account
  - Get bucket information and metadata
  - Delete empty buckets
  - Complete CORS policy management (get, set, delete)
- 📄 **Object Operations**
  - Upload files from binary data or text content
  - Download files with automatic binary data handling
  - Delete single objects from buckets
  - List objects with prefix filtering and pagination
  - Copy objects between buckets (basic implementation)
  - Get object metadata without downloading
- ⚡ **Batch Operations**
  - Delete multiple objects (up to 1,000 at once)
  - Framework for batch uploads and downloads
- 🔐 **Security Features**
  - Secure credential management with masked API tokens
  - Comprehensive input validation (bucket names, object keys)
  - Proper error handling with meaningful messages
  - Support for custom API endpoints
- 🤖 **AI Agent Compatibility**
  - Full AI agent integration with `usableAsTool: true`
  - AI-friendly operation and parameter descriptions
  - Structured responses for easy AI interpretation
- 🛠️ **Developer Experience**
  - Complete TypeScript implementation
  - Comprehensive error handling and validation
  - Modular architecture with utilities and types
  - Extensive documentation and examples

### Technical Implementation
- **API Integration**: Cloudflare REST API + S3-compatible API
- **File Handling**: Binary data support for all file types
- **Metadata Support**: Custom metadata attachment to objects
- **Content Type Detection**: Automatic MIME type detection
- **Validation**: Bucket name and object key validation
- **Error Handling**: Comprehensive error handling with context

### Documentation
- 📚 Complete README with usage examples
- 🏗️ Architecture documentation with design decisions
- 🚀 Deployment guide with production considerations
- 📝 Inline code documentation for all functions
- 🎯 AI agent integration examples

### Development Tools
- TypeScript configuration with strict type checking
- ESLint configuration for code quality
- Prettier for code formatting
- Gulp build system for assets
- Comprehensive type definitions

## [Unreleased] - Future Enhancements

### Planned Features
- 📤 **Multipart Upload Support**
  - Large file upload capabilities (>5GB)
  - Resume interrupted uploads
  - Progress tracking for large files

- 🔄 **Lifecycle Management**
  - Object lifecycle policy configuration
  - Automatic object expiration and transitions
  - Storage class management (Standard, IA)

- 📡 **Event Notifications**
  - Webhook integration for bucket events
  - Real-time notifications for object changes
  - Integration with n8n trigger nodes

- 🌐 **Public Bucket Features**
  - Public bucket configuration
  - Custom domain integration
  - CDN integration and caching

- 🔗 **Advanced Object Operations**
  - Pre-signed URL generation for temporary access
  - Server-side object encryption configuration
  - Object tagging and advanced metadata

- 🚀 **Performance Enhancements**
  - Connection pooling for multiple operations
  - Streaming support for large files
  - Optimized batch operations

- 📊 **Monitoring & Analytics**
  - Operation metrics and statistics
  - Error rate monitoring
  - Performance tracking

### Potential Improvements
- Enhanced error messages with recovery suggestions
- More granular permission handling
- Support for additional Cloudflare R2 features as they're released
- Integration with other Cloudflare services (Workers, Pages)

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Bug reports and feature requests
- Code contributions and pull requests  
- Documentation improvements
- Testing and quality assurance

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/jezweb/n8n-nodes-cloudflare-r2/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/jezweb/n8n-nodes-cloudflare-r2/discussions)
- 📖 **Documentation**: [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

---

**Legend:**
- 🎉 Major feature or milestone
- 📦 Bucket-related features
- 📄 Object-related features
- ⚡ Performance improvements
- 🔐 Security enhancements
- 🤖 AI/automation features
- 🛠️ Developer tools
- 🐛 Bug fixes
- 📚 Documentation
- 🚀 Deployment/infrastructure