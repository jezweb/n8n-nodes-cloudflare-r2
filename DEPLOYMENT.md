# n8n-nodes-cloudflare-r2 Deployment Guide

## Overview

This guide covers deployment strategies, configuration, and operational considerations for the n8n-nodes-cloudflare-r2 community node.

## Installation Methods

### Method 1: n8n Community Nodes (Recommended)

**For n8n Cloud users:**
1. Navigate to **Settings** → **Community Nodes**
2. Enter package name: `n8n-nodes-cloudflare-r2`
3. Click **Install**
4. Restart your n8n instance

**For Self-hosted n8n:**
```bash
# Via n8n CLI
n8n community-nodes install n8n-nodes-cloudflare-r2

# Or via npm in n8n directory
cd ~/.n8n
npm install n8n-nodes-cloudflare-r2
```

### Method 2: Manual Installation

```bash
# Download and install
cd ~/.n8n/custom
npm install n8n-nodes-cloudflare-r2

# Restart n8n
pm2 restart n8n  # or your process manager
```

### Method 3: Development Installation

```bash
# Clone repository
git clone https://github.com/jezweb/n8n-nodes-cloudflare-r2.git
cd n8n-nodes-cloudflare-r2

# Install dependencies and build
npm install
npm run build

# Link for local development
npm link
cd ~/.n8n/custom
npm link n8n-nodes-cloudflare-r2
```

## Environment Configuration

### Required Environment Variables

```bash
# n8n configuration
N8N_CUSTOM_EXTENSIONS="n8n-nodes-cloudflare-r2"

# Optional: Enable community nodes (for self-hosted)
N8N_COMMUNITY_PACKAGES_ENABLED=true
```

### Docker Configuration

#### Docker Compose

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_COMMUNITY_PACKAGES_ENABLED=true
    volumes:
      - n8n_data:/home/node/.n8n
    command: >
      /bin/sh -c "
        npm install -g n8n-nodes-cloudflare-r2 &&
        n8n start
      "
```

#### Dockerfile

```dockerfile
FROM n8nio/n8n:latest

USER root
RUN npm install -g n8n-nodes-cloudflare-r2
USER node

CMD ["n8n", "start"]
```

### Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n-with-cloudflare-r2
spec:
  template:
    spec:
      initContainers:
      - name: install-community-nodes
        image: n8nio/n8n:latest
        command: ['npm', 'install', '-g', 'n8n-nodes-cloudflare-r2']
        volumeMounts:
        - name: n8n-data
          mountPath: /home/node/.n8n
      containers:
      - name: n8n
        image: n8nio/n8n:latest
        env:
        - name: N8N_COMMUNITY_PACKAGES_ENABLED
          value: "true"
```

## Cloudflare Configuration

### API Token Creation

1. **Access Cloudflare Dashboard**
   - Navigate to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Go to **My Profile** → **API Tokens**

2. **Create Custom Token**
   ```
   Token Name: n8n-r2-access
   Permissions:
     - Account: Cloudflare R2:Edit
     - Zone: Zone:Read (if using custom domains)
   Account Resources:
     - Include: All accounts (or specific account)
   Zone Resources:
     - Include: All zones (if using custom domains)
   ```

3. **Token Verification**
   ```bash
   curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
        -H "Authorization: Bearer YOUR_API_TOKEN" \
        -H "Content-Type:application/json"
   ```

### R2 Bucket Setup

#### Via Wrangler CLI
```bash
# Install Wrangler
npm install -g wrangler

# Authenticate
wrangler login

# Create bucket
wrangler r2 bucket create my-n8n-storage --location=auto

# List buckets
wrangler r2 bucket list
```

#### Via Dashboard
1. Navigate to **R2 Object Storage**
2. Click **Create bucket**
3. Choose bucket name and location hint
4. Configure settings as needed

## Node Configuration

### Credential Setup in n8n

1. **Add New Credential**
   - Type: "Cloudflare R2 API"
   - Account ID: Found in Cloudflare dashboard sidebar
   - API Token: The token created above
   - API Endpoint: `https://api.cloudflare.com/client/v4` (default)

2. **Test Connection**
   - Use "List Buckets" operation to verify connectivity
   - Check for successful response with your buckets

### Operation Examples

#### Basic Upload Configuration
```json
{
  "resource": "object",
  "operation": "upload",
  "bucketName": "my-storage-bucket",
  "objectKey": "uploads/{{$json.filename}}",
  "dataSource": "binaryData",
  "binaryPropertyName": "data",
  "contentType": "auto-detect"
}
```

#### Batch Delete Configuration
```json
{
  "resource": "batch", 
  "operation": "deleteMultiple",
  "bucketName": "temp-storage",
  "objectKeys": "{{$json.filesToDelete.join('\\n')}}"
}
```

## Production Deployment

### Performance Tuning

#### n8n Configuration
```bash
# Increase memory for large files
export NODE_OPTIONS="--max-old-space-size=4096"

# Optimize for high throughput
export N8N_EXECUTIONS_PROCESS=main
export N8N_EXECUTIONS_TIMEOUT=300
export N8N_EXECUTIONS_MAX_TIMEOUT=600
```

#### File Size Limits
```bash
# Increase payload size limits
export N8N_PAYLOAD_SIZE_MAX=268435456  # 256MB
export N8N_BINARY_DATA_TTL=1440        # 24 hours
```

### Monitoring Setup

#### Health Check Endpoint
```bash
# Basic health check
curl -X GET "http://your-n8n-instance:5678/healthz"

# R2 connectivity check
curl -X POST "http://your-n8n-instance:5678/webhook/r2-health-check"
```

#### Logging Configuration
```javascript
// n8n logging setup
{
  "logging": {
    "level": "info",
    "outputs": ["console", "file"],
    "file": {
      "location": "/var/log/n8n/n8n.log",
      "maxsize": "10m",
      "maxFiles": "10"
    }
  }
}
```

### Security Hardening

#### Network Security
```yaml
# Firewall rules
- Allow outbound HTTPS (443) to api.cloudflare.com
- Allow outbound HTTPS (443) to *.r2.cloudflarestorage.com
- Restrict inbound access to n8n admin interface
```

#### Credential Protection
```bash
# Use environment variables for sensitive data
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"

# Set proper file permissions
chmod 600 /home/node/.n8n/config
```

#### API Security
- Use least-privilege API tokens
- Rotate API tokens regularly
- Monitor API usage and quotas
- Implement rate limiting where possible

### Backup and Recovery

#### n8n Data Backup
```bash
# Backup n8n data directory
tar -czf n8n-backup-$(date +%Y%m%d).tar.gz ~/.n8n/

# Database backup (if using external DB)
pg_dump n8n_db > n8n-db-backup-$(date +%Y%m%d).sql
```

#### R2 Data Backup
```bash
# Using rclone for R2 backup
rclone copy r2:source-bucket local:./backup/

# Using Wrangler for R2 operations
wrangler r2 object get bucket-name object-key --file=backup-file
```

### Scaling Considerations

#### Horizontal Scaling
- Use external database (PostgreSQL/MySQL)
- Deploy multiple n8n instances behind load balancer
- Share community nodes across instances
- Implement proper session management

#### Vertical Scaling
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

#### Queue Management
```bash
# Redis for job queuing
export N8N_QUEUE_BULL_REDIS_HOST=redis-server
export N8N_QUEUE_BULL_REDIS_PORT=6379
export N8N_EXECUTIONS_PROCESS=own
```

## Troubleshooting

### Common Deployment Issues

#### Community Node Not Found
```bash
# Check if node is installed
npm list -g n8n-nodes-cloudflare-r2

# Verify in n8n logs
grep -i "cloudflare-r2" /var/log/n8n/n8n.log

# Restart n8n after installation
pm2 restart n8n
```

#### Permission Issues
```bash
# Check file permissions
ls -la ~/.n8n/custom/

# Fix ownership issues
chown -R node:node ~/.n8n/
```

#### API Connectivity Issues
```bash
# Test Cloudflare API connectivity
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
     -H "Authorization: Bearer YOUR_TOKEN"

# Check DNS resolution
nslookup api.cloudflare.com
nslookup your-account.r2.cloudflarestorage.com
```

### Performance Issues

#### Memory Problems
```bash
# Monitor memory usage
ps aux | grep n8n
top -p $(pgrep n8n)

# Check for memory leaks
node --inspect=0.0.0.0:9229 ~/.n8n/index.js
```

#### Large File Handling
```bash
# Increase timeouts for large uploads
export N8N_EXECUTIONS_TIMEOUT=1800  # 30 minutes
export N8N_EXECUTIONS_MAX_TIMEOUT=3600  # 1 hour
```

### Log Analysis

#### Important Log Patterns
```bash
# R2 operation logs
grep "CloudflareR2" /var/log/n8n/n8n.log

# Error patterns
grep -i "error.*cloudflare" /var/log/n8n/n8n.log

# Performance metrics
grep "execution.*time" /var/log/n8n/n8n.log
```

#### Debug Mode
```bash
# Enable debug logging
export N8N_LOG_LEVEL=debug
export DEBUG=n8n:*

# Start with debug output
n8n start --verbose
```

## Maintenance

### Update Procedures

#### Community Node Updates
```bash
# Check for updates
npm outdated n8n-nodes-cloudflare-r2

# Update to latest version
npm update n8n-nodes-cloudflare-r2

# Restart n8n
pm2 restart n8n
```

#### n8n Platform Updates
```bash
# Update n8n
npm update -g n8n

# Verify community node compatibility
n8n --version
npm list n8n-nodes-cloudflare-r2
```

### Health Monitoring

#### Automated Health Checks
```bash
#!/bin/bash
# health-check.sh

# Check n8n process
if ! pgrep -f "n8n" > /dev/null; then
    echo "n8n is not running"
    exit 1
fi

# Check R2 connectivity
if ! curl -s -f "https://api.cloudflare.com/client/v4" > /dev/null; then
    echo "Cannot reach Cloudflare API"
    exit 1
fi

echo "All systems operational"
exit 0
```

#### Monitoring Dashboard
- Set up monitoring for n8n process health
- Monitor Cloudflare API response times
- Track R2 operation success rates
- Alert on error rate thresholds

This deployment guide ensures reliable, secure, and performant operation of the n8n-nodes-cloudflare-r2 community node in production environments.