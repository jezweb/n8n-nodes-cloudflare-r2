import { IExecuteFunctions, IDataObject, IHttpRequestOptions, NodeOperationError } from 'n8n-workflow';
import * as aws4 from 'aws4';
import { XMLParser } from 'fast-xml-parser';
import {
	R2ApiCredentials,
	R2ApiResponse,
	R2Bucket,
	R2Object,
	R2ListResponse,
	R2BucketListResponse,
	R2UploadOptions,
	R2DownloadOptions,
	R2ListOptions,
	R2DeleteOptions,
	R2CORSConfiguration,
	R2CopyOptions
} from '../types/CloudflareR2Types';

export class CloudflareR2Utils {
	
	/**
	 * Make authenticated request to Cloudflare API
	 */
	static async makeApiRequest<T = any>(
		executeFunctions: IExecuteFunctions,
		method: string,
		endpoint: string,
		body?: IDataObject,
		headers?: IDataObject,
	): Promise<R2ApiResponse<T>> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as R2ApiCredentials;
		
		const options: IHttpRequestOptions = {
			method: method as any,
			url: `${credentials.apiEndpoint}${endpoint}`,
			headers: {
				'Authorization': `Bearer ${credentials.apiToken}`,
				'Content-Type': 'application/json',
				...headers,
			},
			json: true,
		};

		if (body) {
			options.body = body;
		}

		try {
			const response = await executeFunctions.helpers.httpRequest(options);
			return response as R2ApiResponse<T>;
		} catch (error) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Cloudflare R2 API request failed: ${error.message}`,
				{ description: `Endpoint: ${method} ${endpoint}` }
			);
		}
	}

	/**
	 * Upload object to R2 using S3-compatible API
	 */
	static async uploadObject(
		executeFunctions: IExecuteFunctions,
		options: R2UploadOptions,
		data: Buffer | string
	): Promise<R2Object> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as any;
		
		const uploadHeaders: IDataObject = {
			'Content-Type': options.content_type || 'application/octet-stream',
		};

		if (options.content_encoding) {
			uploadHeaders['Content-Encoding'] = options.content_encoding;
		}

		// Add metadata headers
		if (options.metadata) {
			Object.keys(options.metadata).forEach(key => {
				uploadHeaders[`x-amz-meta-${key}`] = options.metadata![key];
			});
		}

		if (options.storage_class) {
			uploadHeaders['x-amz-storage-class'] = options.storage_class;
		}

		const hostname = `${credentials.accountId}.r2.cloudflarestorage.com`;
		const path = `/${options.bucket}/${options.key}`;
		
		// Convert headers to plain object for aws4
		const plainHeaders: { [key: string]: string } = {};
		Object.keys(uploadHeaders).forEach(key => {
			plainHeaders[key] = String(uploadHeaders[key]);
		});
		
		// Prepare request for AWS4 signing
		const requestOptions = {
			method: 'PUT',
			host: hostname,
			path: path,
			headers: plainHeaders,
			body: data,
			service: 's3',
			region: 'auto',
		};

		// Sign the request
		const signedRequest = aws4.sign(requestOptions, {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		});

		const uploadOptions: IHttpRequestOptions = {
			method: 'PUT',
			url: `https://${hostname}${path}`,
			headers: signedRequest.headers as IDataObject,
			body: data,
		};

		try {
			const response = await executeFunctions.helpers.httpRequest(uploadOptions);
			
			// Return object metadata
			return {
				key: options.key,
				size: Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data.toString()),
				etag: response.headers?.etag || '',
				last_modified: new Date().toISOString(),
				content_type: options.content_type,
				metadata: options.metadata,
			};
		} catch (error) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to upload object to R2: ${error.message}`
			);
		}
	}

	/**
	 * Download object from R2
	 */
	static async downloadObject(
		executeFunctions: IExecuteFunctions,
		options: R2DownloadOptions
	): Promise<{ data: Buffer; metadata: R2Object }> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as any;
		
		const downloadHeaders: IDataObject = {};
		if (options.range) {
			downloadHeaders['Range'] = options.range;
		}

		const hostname = `${credentials.accountId}.r2.cloudflarestorage.com`;
		const path = `/${options.bucket}/${options.key}`;
		
		// Convert headers to plain object for aws4
		const plainHeaders: { [key: string]: string } = {};
		Object.keys(downloadHeaders).forEach(key => {
			plainHeaders[key] = String(downloadHeaders[key]);
		});
		
		// Prepare request for AWS4 signing
		const requestOptions = {
			method: 'GET',
			host: hostname,
			path: path,
			headers: plainHeaders,
			service: 's3',
			region: 'auto',
		};

		// Sign the request
		const signedRequest = aws4.sign(requestOptions, {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		});

		const downloadOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `https://${hostname}${path}`,
			headers: signedRequest.headers as IDataObject,
			encoding: 'arraybuffer', // Get binary data
		};

		try {
			const response = await executeFunctions.helpers.httpRequest(downloadOptions);
			
			const metadata: R2Object = {
				key: options.key,
				size: parseInt(response.headers?.['content-length'] || '0'),
				etag: response.headers?.etag || '',
				last_modified: response.headers?.['last-modified'] || '',
				content_type: response.headers?.['content-type'],
			};

			return {
				data: Buffer.from(response),
				metadata
			};
		} catch (error) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to download object from R2: ${error.message}`,
				{ description: `Error downloading object ${options.key} from bucket ${options.bucket}` }
			);
		}
	}

	/**
	 * List buckets
	 */
	static async listBuckets(executeFunctions: IExecuteFunctions): Promise<R2Bucket[]> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as R2ApiCredentials;
		
		const response = await this.makeApiRequest<R2BucketListResponse>(
			executeFunctions,
			'GET',
			`/accounts/${credentials.accountId}/r2/buckets`
		);

		if (!response.success) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to list buckets: ${response.errors?.[0]?.message || 'Unknown error'}`
			);
		}

		return response.result.buckets;
	}

	/**
	 * Create bucket
	 */
	static async createBucket(
		executeFunctions: IExecuteFunctions, 
		bucketName: string,
		location?: string
	): Promise<R2Bucket> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as R2ApiCredentials;
		
		const body: IDataObject = { name: bucketName };
		if (location) {
			body.location = location;
		}

		const response = await this.makeApiRequest<R2Bucket>(
			executeFunctions,
			'POST',
			`/accounts/${credentials.accountId}/r2/buckets`,
			body
		);

		if (!response.success) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to create bucket: ${response.errors?.[0]?.message || 'Unknown error'}`
			);
		}

		return response.result;
	}

	/**
	 * Delete bucket
	 */
	static async deleteBucket(executeFunctions: IExecuteFunctions, bucketName: string): Promise<void> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as R2ApiCredentials;
		
		const response = await this.makeApiRequest(
			executeFunctions,
			'DELETE',
			`/accounts/${credentials.accountId}/r2/buckets/${bucketName}`
		);

		if (!response.success) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to delete bucket: ${response.errors?.[0]?.message || 'Unknown error'}`
			);
		}
	}

	/**
	 * Get bucket info
	 */
	static async getBucket(executeFunctions: IExecuteFunctions, bucketName: string): Promise<R2Bucket> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as R2ApiCredentials;
		
		const response = await this.makeApiRequest<R2Bucket>(
			executeFunctions,
			'GET',
			`/accounts/${credentials.accountId}/r2/buckets/${bucketName}`
		);

		if (!response.success) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to get bucket info: ${response.errors?.[0]?.message || 'Unknown error'}`
			);
		}

		return response.result;
	}

	/**
	 * List objects in bucket
	 */
	static async listObjects(
		executeFunctions: IExecuteFunctions,
		options: R2ListOptions
	): Promise<R2ListResponse> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as any;

		// Build query parameters for ListObjectsV2
		const params = new URLSearchParams();
		params.append('list-type', '2'); // Use ListObjectsV2

		if (options.prefix) {
			params.append('prefix', options.prefix);
		}
		if (options.delimiter) {
			params.append('delimiter', options.delimiter);
		}
		if (options.max_keys) {
			params.append('max-keys', options.max_keys.toString());
		}
		if (options.continuation_token) {
			params.append('continuation-token', options.continuation_token);
		}
		if (options.start_after) {
			params.append('start-after', options.start_after);
		}

		const hostname = `${credentials.accountId}.r2.cloudflarestorage.com`;
		const path = `/${options.bucket}?${params.toString()}`;

		// Prepare request for AWS4 signing
		const requestOptions = {
			method: 'GET',
			host: hostname,
			path: path,
			headers: {},
			service: 's3',
			region: 'auto',
		};

		// Sign the request
		const signedRequest = aws4.sign(requestOptions, {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		});

		const listOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `https://${hostname}${path}`,
			headers: signedRequest.headers as IDataObject,
			returnFullResponse: true,
		};

		try {
			const response = await executeFunctions.helpers.httpRequest(listOptions);

			// Parse XML response
			const parser = new XMLParser({
				ignoreAttributes: false,
				parseTagValue: true,
				trimValues: true,
			});

			const parsedResponse = parser.parse(response.body);
			const listBucketResult = parsedResponse.ListBucketResult || {};

			// Extract objects from the response
			const contents = listBucketResult.Contents || [];
			const objects: R2Object[] = [];

			// Handle both single object and array of objects
			const contentsArray = Array.isArray(contents) ? contents : (contents.Key ? [contents] : []);

			for (const item of contentsArray) {
				if (item.Key) {
					objects.push({
						key: item.Key,
						size: parseInt(item.Size || '0', 10),
						last_modified: item.LastModified || '',
						etag: item.ETag ? item.ETag.replace(/"/g, '') : '',
						storage_class: item.StorageClass || 'STANDARD',
					});
				}
			}

			// Check if response is truncated
			const isTruncated = listBucketResult.IsTruncated === true || listBucketResult.IsTruncated === 'true';

			return {
				objects,
				truncated: isTruncated,
				continuation_token: listBucketResult.NextContinuationToken,
			};
		} catch (error) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to list objects: ${error.message}`,
				{ description: `Error listing objects in bucket ${options.bucket}` }
			);
		}
	}

	/**
	 * Get object metadata without downloading the content
	 */
	static async getObjectMetadata(
		executeFunctions: IExecuteFunctions,
		options: { key: string; bucket: string }
	): Promise<R2Object> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as any;

		const hostname = `${credentials.accountId}.r2.cloudflarestorage.com`;
		const path = `/${options.bucket}/${options.key}`;

		// Prepare request for AWS4 signing
		const requestOptions = {
			method: 'HEAD',
			host: hostname,
			path: path,
			headers: {},
			service: 's3',
			region: 'auto',
		};

		// Sign the request
		const signedRequest = aws4.sign(requestOptions, {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		});

		const headOptions: IHttpRequestOptions = {
			method: 'HEAD',
			url: `https://${hostname}${path}`,
			headers: signedRequest.headers as IDataObject,
			returnFullResponse: true,
		};

		try {
			const response = await executeFunctions.helpers.httpRequest(headOptions);
			const headers = response.headers;

			// Extract metadata from headers
			const customMetadata: { [key: string]: string } = {};
			Object.keys(headers).forEach(key => {
				if (key.toLowerCase().startsWith('x-amz-meta-')) {
					const metaKey = key.substring(11); // Remove 'x-amz-meta-' prefix
					customMetadata[metaKey] = headers[key] as string;
				}
			});

			return {
				key: options.key,
				size: parseInt(headers['content-length'] as string || '0', 10),
				last_modified: headers['last-modified'] as string || '',
				etag: (headers['etag'] as string || '').replace(/"/g, ''),
				content_type: headers['content-type'] as string || 'application/octet-stream',
				storage_class: headers['x-amz-storage-class'] as string || 'STANDARD',
				metadata: Object.keys(customMetadata).length > 0 ? customMetadata : undefined,
			};
		} catch (error) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to get object metadata: ${error.message}`,
				{ description: `Error getting metadata for ${options.key} from bucket ${options.bucket}` }
			);
		}
	}

	/**
	 * Copy object within or between buckets
	 */
	static async copyObject(
		executeFunctions: IExecuteFunctions,
		options: R2CopyOptions
	): Promise<R2Object> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as any;

		const hostname = `${credentials.accountId}.r2.cloudflarestorage.com`;
		const path = `/${options.destination_bucket}/${options.destination_key}`;

		// Prepare headers
		const headers: { [key: string]: string } = {
			'x-amz-copy-source': `/${options.source_bucket}/${options.source_key}`,
		};

		if (options.metadata_directive) {
			headers['x-amz-metadata-directive'] = options.metadata_directive;
		}

		// Add custom metadata if replacing
		if (options.metadata && options.metadata_directive === 'REPLACE') {
			Object.keys(options.metadata).forEach(key => {
				headers[`x-amz-meta-${key}`] = options.metadata![key];
			});
		}

		// Prepare request for AWS4 signing
		const requestOptions = {
			method: 'PUT',
			host: hostname,
			path: path,
			headers: headers,
			service: 's3',
			region: 'auto',
		};

		// Sign the request
		const signedRequest = aws4.sign(requestOptions, {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		});

		const copyOptions: IHttpRequestOptions = {
			method: 'PUT',
			url: `https://${hostname}${path}`,
			headers: signedRequest.headers as IDataObject,
			returnFullResponse: true,
		};

		try {
			const response = await executeFunctions.helpers.httpRequest(copyOptions);

			// Parse XML response
			const parser = new XMLParser({
				ignoreAttributes: false,
				parseTagValue: true,
				trimValues: true,
			});

			const parsedResponse = parser.parse(response.body);
			const copyResult = parsedResponse.CopyObjectResult || {};

			return {
				key: options.destination_key,
				size: 0, // Size is not returned in CopyObject response, would need separate HEAD request
				last_modified: copyResult.LastModified || new Date().toISOString(),
				etag: copyResult.ETag ? copyResult.ETag.replace(/"/g, '') : '',
				metadata: options.metadata,
			};
		} catch (error) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to copy object: ${error.message}`,
				{ description: `Error copying from ${options.source_bucket}/${options.source_key} to ${options.destination_bucket}/${options.destination_key}` }
			);
		}
	}

	/**
	 * Delete object(s)
	 */
	static async deleteObjects(
		executeFunctions: IExecuteFunctions,
		options: R2DeleteOptions
	): Promise<void> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as any;
		
		const keys = Array.isArray(options.key) ? options.key : [options.key];
		
		for (const key of keys) {
			const hostname = `${credentials.accountId}.r2.cloudflarestorage.com`;
			const path = `/${options.bucket}/${key}`;
			
			// Prepare request for AWS4 signing
			const requestOptions = {
				method: 'DELETE',
				host: hostname,
				path: path,
				headers: {},
				service: 's3',
				region: 'auto',
			};

			// Sign the request
			const signedRequest = aws4.sign(requestOptions, {
				accessKeyId: credentials.accessKeyId,
				secretAccessKey: credentials.secretAccessKey,
			});

			const deleteOptions: IHttpRequestOptions = {
				method: 'DELETE',
				url: `https://${hostname}${path}`,
				headers: signedRequest.headers as IDataObject,
			};

			try {
				await executeFunctions.helpers.httpRequest(deleteOptions);
			} catch (error) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Failed to delete object ${key}: ${error.message}`
				);
			}
		}
	}

	/**
	 * Get CORS configuration
	 */
	static async getCORSConfiguration(
		executeFunctions: IExecuteFunctions, 
		bucketName: string
	): Promise<R2CORSConfiguration> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as R2ApiCredentials;
		
		const response = await this.makeApiRequest<R2CORSConfiguration>(
			executeFunctions,
			'GET',
			`/accounts/${credentials.accountId}/r2/buckets/${bucketName}/cors`
		);

		if (!response.success) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to get CORS configuration: ${response.errors?.[0]?.message || 'Unknown error'}`
			);
		}

		return response.result;
	}

	/**
	 * Set CORS configuration
	 */
	static async setCORSConfiguration(
		executeFunctions: IExecuteFunctions, 
		bucketName: string,
		corsConfig: R2CORSConfiguration
	): Promise<void> {
		const credentials = await executeFunctions.getCredentials('cloudflareR2StorageApi') as R2ApiCredentials;
		
		const response = await this.makeApiRequest(
			executeFunctions,
			'PUT',
			`/accounts/${credentials.accountId}/r2/buckets/${bucketName}/cors`,
			corsConfig as unknown as IDataObject
		);

		if (!response.success) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Failed to set CORS configuration: ${response.errors?.[0]?.message || 'Unknown error'}`
			);
		}
	}

	/**
	 * Validate bucket name
	 */
	static validateBucketName(bucketName: string): boolean {
		// R2 bucket naming rules
		if (!bucketName || bucketName.length < 3 || bucketName.length > 63) {
			return false;
		}
		
		// Must start and end with letter or number
		if (!/^[a-z0-9]/.test(bucketName) || !/[a-z0-9]$/.test(bucketName)) {
			return false;
		}
		
		// Only lowercase letters, numbers, hyphens, periods
		if (!/^[a-z0-9.-]+$/.test(bucketName)) {
			return false;
		}
		
		// Cannot be formatted as IP address
		if (/^\d+\.\d+\.\d+\.\d+$/.test(bucketName)) {
			return false;
		}
		
		return true;
	}

	/**
	 * Validate object key
	 */
	static validateObjectKey(key: string): boolean {
		if (!key || key.length === 0 || key.length > 1024) {
			return false;
		}
		
		// Cannot start with ../
		if (key.startsWith('../')) {
			return false;
		}
		
		return true;
	}
}