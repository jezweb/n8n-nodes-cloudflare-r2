# Changelog

All notable changes to the n8n-nodes-cloudflare-r2 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-09-28

### Changed
- 🔄 **BREAKING**: Split list and search into separate operations for better AI compatibility
  - **List Operation**: Now focuses on prefix-based listing (fast, server-side)
    - Removed client-side filtering options
    - Ideal for browsing folders and getting all objects with a prefix
  - **New Search Operation**: Dedicated operation for finding files
    - Supports filename contains, file extension, and wildcard patterns
    - Searches through up to 10,000 objects (configurable)
    - Returns detailed search criteria in results

### Why This Change?
- AI agents were getting confused with overlapping search options
- Clear separation: use 'list' for browsing, 'search' for finding specific files
- Better performance: list operation is now pure server-side
- More intuitive for both AI and human users

## [0.2.6] - 2025-09-28

### Fixed
- 🐛 **AI Tool Compatibility**: Fixed error when AI agents use list operation
  - Added default empty object for `listOptions` parameter when not provided
  - Prevents "Cannot read property 'prefix' of undefined" errors
  - AI agents can now call list operation without specifying filters

## [0.2.5] - 2025-09-28

### Added
- 🔍 **Enhanced List Objects Filtering**: Major improvements for easier file discovery
  - **File Extension Filter**: Simple field to filter by file type (pdf, jpg, docx, etc.)
  - **Filename Contains Search**: Find files containing specific text anywhere in the name
  - **Wildcard Pattern Support**: Use patterns like `*.pdf`, `invoice-*.docx`, `*-2024-*`
  - **Start After Parameter**: Support for pagination through large result sets
  - **Better Parameter Descriptions**: Added helpful examples and placeholders for all fields
  - **Results Count**: Returns count of filtered results

### Improved
- 📝 **AI Agent Compatibility**: Much easier for AI agents to find specific files
  - Clear examples in all parameter descriptions
  - Multiple search methods available (prefix, contains, pattern, extension)
  - Intuitive parameter names and placeholders
  - Client-side filtering for complex searches

### Technical Details
- Filters are applied client-side after S3 API call for maximum flexibility
- Pattern matching supports simple wildcards (* for any characters)
- Case-insensitive matching for contains and pattern filters
- Extension filter works without the dot (use "pdf" not ".pdf")

## [0.2.4] - 2025-09-27

### Added
- ✨ **Get Metadata Operation**: Fully implemented object metadata retrieval
  - Uses S3 HEAD request to get metadata without downloading content
  - Returns size, last_modified, etag, content_type, storage_class, and custom metadata
  - Efficient operation for checking object existence and properties

- ✨ **Copy Object Operation**: Fully implemented object copying
  - Supports copying within same bucket or between buckets
  - Uses S3 CopyObject API with proper source/destination handling
  - Preserves or replaces metadata based on directive
  - Returns copy operation results with new object metadata

- ✨ **Upload Multiple Operation**: Batch upload functionality
  - Processes all binary properties from input data
  - Uploads multiple files in parallel for better performance
  - Individual error handling with continueOnFail support
  - Returns success/failure status for each uploaded file

- ✨ **Download Multiple Operation**: Batch download functionality
  - Downloads multiple files specified by object keys (max 100)
  - Creates separate binary properties for each downloaded file
  - Parallel downloads for improved performance
  - Graceful error handling for missing files

### Fixed
- 🔧 Replaced placeholder implementations with fully functional code
- 🔧 All operations now properly use AWS4 signing for authentication
- 🔧 Improved error messages with detailed context

## [0.2.3] - 2025-09-27

### Fixed
- 🐛 **List Objects Operation**: Implemented proper S3-compatible ListObjectsV2 API call
  - Fixed issue where list objects was returning empty arrays
  - Added XML response parsing using fast-xml-parser library
  - Properly handles S3 ListObjectsV2 response structure
  - Returns actual bucket contents with object metadata (key, size, last_modified, etag)
  - Supports pagination via continuation tokens for large buckets
  - Maintains all list parameters (prefix, delimiter, max-keys)

### Added
- 📦 Added `fast-xml-parser` dependency for parsing S3 XML responses

## [0.2.2] - 2025-09-10

### Fixed
- 🐛 **Download Operation**: Fixed critical issue where download operation would fail with "undefined" error
  - Corrected Buffer.from() to handle httpRequest arraybuffer response correctly
  - Enhanced error messages with more context for debugging
  - Download now works correctly in both workflows and as AI tool

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