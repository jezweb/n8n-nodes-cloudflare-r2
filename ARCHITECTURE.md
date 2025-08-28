# n8n-nodes-cloudflare-r2 Architecture

## Overview

This document describes the architecture, design decisions, and implementation details of the n8n-nodes-cloudflare-r2 community node.

## Design Principles

### 1. Resource-Based Operations
Following n8n best practices, operations are organized by resource type:
- **Bucket**: Bucket management operations
- **Object**: Individual file operations  
- **Batch**: Multiple file operations

### 2. AI Agent Compatibility
- `usableAsTool: true` enables AI agent integration
- Comprehensive, AI-friendly descriptions for all operations
- Clear parameter documentation with examples
- Structured error messages for AI understanding

### 3. Cloudflare API Integration
- REST API for bucket management
- S3-compatible API for object operations
- Proper authentication using Bearer tokens
- Comprehensive error handling and validation

## Project Structure

```
n8n-nodes-cloudflare-r2/
├── credentials/                    # Authentication configuration
│   └── CloudflareR2Api.credentials.ts
├── nodes/                          # Node implementations
│   └── CloudflareR2/
│       ├── CloudflareR2.node.ts    # Main node logic
│       └── cloudflarer2.svg        # Node icon
├── types/                          # TypeScript type definitions
│   └── CloudflareR2Types.ts
├── utils/                          # Utility functions
│   └── CloudflareR2Utils.ts
├── package.json                    # Package configuration
├── tsconfig.json                   # TypeScript configuration
├── gulpfile.js                     # Build configuration
└── index.js                       # Package entry point
```

## Core Components

### 1. CloudflareR2Api.credentials.ts

**Purpose**: Secure credential management for Cloudflare API access.

**Configuration**:
- Account ID (required)
- API Token (required, masked input)
- API Endpoint (optional, defaults to Cloudflare API)

**Security Features**:
- Password-masked API token input
- Validation of required fields
- Support for custom endpoints

### 2. CloudflareR2Types.ts

**Purpose**: Comprehensive TypeScript type definitions for R2 operations.

**Key Types**:
- `R2Resource`, `R2BucketOperation`, `R2ObjectOperation` - Operation types
- `R2Bucket`, `R2Object` - API response types
- `R2UploadOptions`, `R2DownloadOptions` - Operation parameter types
- `R2ApiResponse<T>` - Generic API response wrapper

**Benefits**:
- Type safety throughout the codebase
- Better IDE support and autocomplete
- Clear API contracts
- Easier maintenance and refactoring

### 3. CloudflareR2Utils.ts

**Purpose**: Centralized utility functions for R2 API interactions.

**Key Functions**:
- `makeApiRequest()` - Authenticated Cloudflare API requests
- `uploadObject()` - S3-compatible object upload
- `downloadObject()` - S3-compatible object download
- `listBuckets()` - Bucket enumeration
- `createBucket()` - Bucket creation with location hints
- `deleteBucket()` - Safe bucket deletion
- `deleteObjects()` - Single/batch object deletion
- `getCORSConfiguration()` - CORS policy retrieval
- `setCORSConfiguration()` - CORS policy management

**Design Features**:
- Static methods for easy testing
- Consistent error handling with NodeOperationError
- Validation utilities for bucket names and object keys
- Support for both REST API and S3-compatible endpoints

### 4. CloudflareR2.node.ts

**Purpose**: Main node implementation with user interface and operation logic.

**Architecture**:
- Resource-based operation routing
- Comprehensive parameter validation
- Binary data handling for file operations
- Batch operation support
- AI-friendly descriptions and error messages

**Operation Routing**:
```typescript
async execute(): Promise<INodeExecutionData[][]> {
    // Route by resource type
    if (resource === 'bucket') {
        responseData = await this.executeBucketOperation(i);
    } else if (resource === 'object') {
        responseData = await this.executeObjectOperation(i);
    } else if (resource === 'batch') {
        responseData = await this.executeBatchOperation(i);
    }
}
```

## API Integration Strategy

### Cloudflare REST API
Used for bucket management operations:
- Base URL: `https://api.cloudflare.com/client/v4`
- Authentication: `Bearer {api_token}`
- Endpoints: `/accounts/{account_id}/r2/buckets/*`

### S3-Compatible API  
Used for object operations:
- Base URL: `https://{account_id}.r2.cloudflarestorage.com`
- Authentication: `Bearer {api_token}`
- Operations: PUT, GET, DELETE, HEAD

### Dual API Benefits
- **REST API**: Rich metadata, CORS management, lifecycle policies
- **S3 API**: Efficient object operations, multipart uploads, streaming

## Data Flow

### Upload Operation
1. **Input Validation**: Validate bucket name, object key, data source
2. **Data Preparation**: Handle binary data or text content
3. **Metadata Processing**: Extract and format custom metadata
4. **Content Type Detection**: Auto-detect or use provided MIME type
5. **S3 API Upload**: PUT request to S3-compatible endpoint
6. **Response Processing**: Return object metadata to n8n

### Download Operation
1. **Input Validation**: Validate bucket name and object key
2. **S3 API Download**: GET request to S3-compatible endpoint
3. **Binary Data Creation**: Convert response to n8n binary data format
4. **Metadata Extraction**: Parse response headers for object metadata
5. **Response Formatting**: Return both binary data and metadata

### Bucket Operations
1. **Credential Validation**: Ensure proper API access
2. **REST API Request**: Use Cloudflare REST API endpoints
3. **Response Validation**: Check API success status
4. **Error Handling**: Convert API errors to n8n-friendly format
5. **Data Transformation**: Format response for n8n consumption

## Error Handling Strategy

### Validation Errors
- Bucket name format validation
- Object key validation  
- Parameter requirement checks
- Data type validation

### API Errors
- Authentication failures
- Permission denied
- Resource not found
- Rate limiting
- Network timeouts

### Error Response Format
```typescript
{
    name: 'NodeOperationError',
    message: 'Human-readable error description',
    description: 'Technical details and context',
    cause: originalError
}
```

## Performance Considerations

### Efficient Operations
- Batch operations for multiple files
- Streaming downloads for large files
- Connection reuse for multiple requests
- Proper timeout handling

### Memory Management
- Binary data streaming where possible
- Proper cleanup of temporary data
- Efficient JSON parsing
- Minimal memory footprint

### Rate Limiting
- Exponential backoff for rate limits
- Queue management for batch operations
- Proper error messages for rate limit hits

## Security Considerations

### Credential Protection
- API tokens masked in UI
- Secure credential storage in n8n
- No credential logging or exposure
- Support for credential rotation

### Data Security
- HTTPS-only API communications
- Proper TLS certificate validation
- Secure temporary file handling
- No sensitive data in error messages

### Access Control
- Bucket-level permissions supported
- Object-level access control
- CORS policy management
- Temporary credential support (future)

## Extensibility

### Future Enhancements
- **Multipart Uploads**: Large file support
- **Lifecycle Policies**: Automated object management  
- **Event Notifications**: Webhook integrations
- **Custom Domains**: Public bucket hosting
- **Signed URLs**: Temporary access links

### Plugin Architecture
- Modular utility functions
- Type-safe API contracts
- Consistent error handling patterns
- Extensible operation routing

## Testing Strategy

### Unit Testing
- Individual utility function testing
- Parameter validation testing
- Error handling verification
- Type safety validation

### Integration Testing  
- End-to-end operation testing
- API integration verification
- Authentication testing
- Error scenario testing

### Performance Testing
- Large file upload/download
- Batch operation limits
- Memory usage profiling
- Network timeout handling

## Monitoring and Observability

### Logging Strategy
- Structured error logging
- Operation timing metrics
- API response logging
- Performance monitoring

### Debug Information
- Request/response tracing
- Parameter validation details
- Authentication status
- Network connectivity info

## Deployment Considerations

### n8n Integration
- Community node installation process
- Version compatibility requirements
- Dependency management
- Update procedures

### Production Readiness
- Error recovery mechanisms
- Resource cleanup procedures
- Connection pooling
- Graceful degradation

This architecture ensures a robust, scalable, and maintainable integration between n8n and Cloudflare R2, while providing excellent developer and user experience.