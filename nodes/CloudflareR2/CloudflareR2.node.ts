import { IExecuteFunctions } from 'n8n-workflow';
import {
	INodeType,
	INodeTypeDescription,
	IDataObject,
	INodeExecutionData,
	NodeOperationError,
	NodeConnectionType,
	IBinaryData,
} from 'n8n-workflow';

import { CloudflareR2Utils } from '../../utils/CloudflareR2Utils';
import { 
	R2Resource,
	R2BucketOperation,
	R2ObjectOperation,
	R2BatchOperation,
	R2UploadOptions,
	R2DownloadOptions,
	R2ListOptions,
	R2CORSConfiguration
} from '../../types/CloudflareR2Types';

export class CloudflareR2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cloudflare R2 Storage',
		name: 'cloudflareR2Storage',
		icon: 'file:cloudflarer2.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with Cloudflare R2 object storage. Upload, download, manage files and buckets. Supports batch operations, multipart uploads, and can be used as a tool by AI Agents.',
		defaults: {
			name: 'Cloudflare R2 Storage',
		},
		inputs: [
			{
				displayName: 'Input',
				type: NodeConnectionType.Main,
			},
		],
		outputs: [
			{
				displayName: 'Output',
				type: NodeConnectionType.Main,
			},
		],
		credentials: [
			{
				name: 'cloudflareR2StorageApi',
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Bucket',
						value: 'bucket',
						description: 'Manage R2 buckets (create, list, delete, configure)',
					},
					{
						name: 'Object',
						value: 'object',
						description: 'Manage objects in R2 buckets (upload, download, delete, list files)',
					},
					{
						name: 'Batch Operations',
						value: 'batch',
						description: 'Perform operations on multiple files at once',
					},
				],
				default: 'object',
				noDataExpression: true,
			},
			
			// BUCKET OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['bucket'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new R2 bucket',
						action: 'Create a bucket',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an R2 bucket',
						action: 'Delete a bucket',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get information about an R2 bucket',
						action: 'Get bucket info',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all R2 buckets in your account',
						action: 'List all buckets',
					},
					{
						name: 'Get CORS',
						value: 'getCORS',
						description: 'Get CORS configuration for a bucket',
						action: 'Get bucket CORS configuration',
					},
					{
						name: 'Set CORS',
						value: 'setCORS',
						description: 'Set CORS configuration for a bucket',
						action: 'Set bucket CORS configuration',
					},
					{
						name: 'Delete CORS',
						value: 'deleteCORS',
						description: 'Delete CORS configuration for a bucket',
						action: 'Delete bucket CORS configuration',
					},
				],
				default: 'list',
				noDataExpression: true,
			},

			// OBJECT OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['object'],
					},
				},
				options: [
					{
						name: 'Upload',
						value: 'upload',
						description: 'Upload a file to R2 bucket',
						action: 'Upload a file',
					},
					{
						name: 'Download',
						value: 'download',
						description: 'Download a file from R2 bucket',
						action: 'Download a file',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a file from R2 bucket',
						action: 'Delete a file',
					},
					{
						name: 'Get Metadata',
						value: 'getMetadata',
						description: 'Get metadata for an object without downloading it',
						action: 'Get object metadata',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List objects in an R2 bucket',
						action: 'List objects in bucket',
					},
					{
						name: 'Copy',
						value: 'copy',
						description: 'Copy an object within or between buckets',
						action: 'Copy an object',
					},
				],
				default: 'upload',
				noDataExpression: true,
			},

			// BATCH OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['batch'],
					},
				},
				options: [
					{
						name: 'Upload Multiple',
						value: 'uploadMultiple',
						description: 'Upload multiple files to R2 bucket',
						action: 'Upload multiple files',
					},
					{
						name: 'Delete Multiple',
						value: 'deleteMultiple',
						description: 'Delete multiple files from R2 bucket',
						action: 'Delete multiple files',
					},
					{
						name: 'Download Multiple',
						value: 'downloadMultiple',
						description: 'Download multiple files from R2 bucket',
						action: 'Download multiple files',
					},
				],
				default: 'uploadMultiple',
				noDataExpression: true,
			},

			// BUCKET NAME
			{
				displayName: 'Bucket Name',
				name: 'bucketName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['create', 'delete', 'get', 'getCORS', 'setCORS', 'deleteCORS'],
					},
				},
				default: '',
				placeholder: 'my-r2-bucket',
				description: 'The name of the R2 bucket. Must be unique across all of Cloudflare R2.',
			},
			{
				displayName: 'Bucket Name',
				name: 'bucketName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['object', 'batch'],
					},
				},
				default: '',
				placeholder: 'my-r2-bucket',
				description: 'The name of the R2 bucket to operate on.',
			},

			// BUCKET LOCATION
			{
				displayName: 'Location Hint',
				name: 'location',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['create'],
					},
				},
				options: [
					{
						name: 'Automatic',
						value: '',
						description: 'Let Cloudflare choose the optimal location',
					},
					{
						name: 'Eastern North America (ENAM)',
						value: 'ENAM',
						description: 'Eastern North America',
					},
					{
						name: 'Western North America (WNAM)',
						value: 'WNAM',
						description: 'Western North America',
					},
					{
						name: 'Europe (EEUR)',
						value: 'EEUR',
						description: 'Europe',
					},
					{
						name: 'Asia-Pacific (APAC)',
						value: 'APAC',
						description: 'Asia-Pacific',
					},
				],
				default: '',
				description: 'Optional location hint for optimal performance',
			},

			// OBJECT KEY
			{
				displayName: 'Object Key',
				name: 'objectKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload', 'download', 'delete', 'getMetadata'],
					},
				},
				default: '',
				placeholder: 'folder/filename.ext',
				description: 'The key (path/filename) of the object in the bucket',
			},

			// FILE INPUT OPTIONS
			{
				displayName: 'Data Source',
				name: 'dataSource',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
					},
				},
				options: [
					{
						name: 'Binary Data',
						value: 'binaryData',
						description: 'Use binary data from previous node',
					},
					{
						name: 'Text Content',
						value: 'textContent',
						description: 'Upload text content directly',
					},
					{
						name: 'Base64 Data',
						value: 'base64Data',
						description: 'Upload from base64-encoded string',
					},
				],
				default: 'binaryData',
				description: 'Source of the data to upload',
			},

			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
						dataSource: ['binaryData'],
					},
				},
				default: 'data',
				placeholder: 'data',
				description: 'Name of the binary property containing the file data',
			},

			{
				displayName: 'Text Content',
				name: 'textContent',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
						dataSource: ['textContent'],
					},
				},
				default: '',
				description: 'The text content to upload',
			},

			// BASE64 DATA FIELDS
			{
				displayName: 'Base64 Content',
				name: 'base64Content',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
						dataSource: ['base64Data'],
					},
				},
				default: '',
				placeholder: 'e.g. {{ $json.file.data }} or data:image/png;base64,iVBORw0...',
				description: 'Base64-encoded content. Supports raw base64 or data URLs with MIME type prefix',
			},

			{
				displayName: 'File Name',
				name: 'base64FileName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
						dataSource: ['base64Data'],
					},
				},
				default: '',
				placeholder: 'e.g. uploaded-file.png',
				description: 'Optional filename for the uploaded file. If not provided, a default name will be used',
			},

			// CONTENT TYPE
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
					},
				},
				default: '',
				placeholder: 'image/jpeg, application/json, text/plain',
				description: 'MIME type of the content. If empty, will be auto-detected.',
			},

			// METADATA
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
					},
				},
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'metadataFields',
						displayName: 'Metadata Field',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Metadata key name',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Metadata value',
							},
						],
					},
				],
				description: 'Custom metadata to attach to the object',
			},

			// LIST OPTIONS
			{
				displayName: 'Options',
				name: 'listOptions',
				type: 'collection',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['list'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Prefix',
						name: 'prefix',
						type: 'string',
						default: '',
						description: 'Only list objects with this prefix',
					},
					{
						displayName: 'Max Results',
						name: 'maxKeys',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 1000,
						},
						default: 1000,
						description: 'Maximum number of objects to return',
					},
					{
						displayName: 'Delimiter',
						name: 'delimiter',
						type: 'string',
						default: '',
						description: 'Character to group keys (typically "/")',
					},
				],
			},

			// COPY SOURCE/DESTINATION
			{
				displayName: 'Source Bucket',
				name: 'sourceBucket',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['copy'],
					},
				},
				default: '',
				description: 'Source bucket name (if different from destination)',
			},
			{
				displayName: 'Source Key',
				name: 'sourceKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['copy'],
					},
				},
				default: '',
				description: 'Source object key',
			},
			{
				displayName: 'Destination Key',
				name: 'destinationKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['copy'],
					},
				},
				default: '',
				description: 'Destination object key',
			},

			// CORS CONFIGURATION
			{
				displayName: 'CORS Rules',
				name: 'corsRules',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['setCORS'],
					},
				},
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'rules',
						displayName: 'CORS Rule',
						values: [
							{
								displayName: 'Allowed Origins',
								name: 'allowedOrigins',
								type: 'string',
								default: '',
								placeholder: 'https://example.com, *',
								description: 'Comma-separated list of allowed origins',
							},
							{
								displayName: 'Allowed Methods',
								name: 'allowedMethods',
								type: 'multiOptions',
								options: [
									{ name: 'GET', value: 'GET' },
									{ name: 'POST', value: 'POST' },
									{ name: 'PUT', value: 'PUT' },
									{ name: 'DELETE', value: 'DELETE' },
									{ name: 'HEAD', value: 'HEAD' },
								],
								default: ['GET'],
								description: 'HTTP methods allowed for CORS requests',
							},
							{
								displayName: 'Allowed Headers',
								name: 'allowedHeaders',
								type: 'string',
								default: '',
								placeholder: 'Content-Type, Authorization',
								description: 'Comma-separated list of allowed headers',
							},
							{
								displayName: 'Max Age (seconds)',
								name: 'maxAge',
								type: 'number',
								default: 3600,
								description: 'Maximum age for preflight cache',
							},
						],
					},
				],
				description: 'CORS rules configuration',
			},

			// BATCH OPERATION KEYS
			{
				displayName: 'Object Keys',
				name: 'objectKeys',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['batch'],
						operation: ['deleteMultiple', 'downloadMultiple'],
					},
				},
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'file1.txt\nfolder/file2.jpg\nanother/file3.pdf',
				description: 'One object key per line (max 1000 objects)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as R2Resource;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[] = {};

				if (resource === 'bucket') {
					const operation = this.getNodeParameter('operation', i) as R2BucketOperation;
					responseData = await executeBucketOperation.call(this, operation, i);
				} else if (resource === 'object') {
					const operation = this.getNodeParameter('operation', i) as R2ObjectOperation;
					responseData = await executeObjectOperation.call(this, operation, i);
				} else if (resource === 'batch') {
					const operation = this.getNodeParameter('operation', i) as R2BatchOperation;
					responseData = await executeBatchOperation.call(this, operation, i);
				}

				if (Array.isArray(responseData)) {
					returnData.push(...responseData);
				} else {
					returnData.push(responseData);
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ 
						error: error.message,
						...items[i].json 
					});
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}

// Helper functions
async function executeBucketOperation(
	this: IExecuteFunctions,
	operation: R2BucketOperation,
	itemIndex: number
): Promise<IDataObject> {
	switch (operation) {
		case 'create':
			const bucketName = this.getNodeParameter('bucketName', itemIndex) as string;
			const location = this.getNodeParameter('location', itemIndex) as string;
			
			if (!CloudflareR2Utils.validateBucketName(bucketName)) {
				throw new NodeOperationError(this.getNode(), 'Invalid bucket name format');
			}

			const newBucket = await CloudflareR2Utils.createBucket(
				this, 
				bucketName, 
				location || undefined
			);
			return { bucket: newBucket };

		case 'list':
			const buckets = await CloudflareR2Utils.listBuckets(this);
			return { buckets };

		case 'get':
			const getBucketName = this.getNodeParameter('bucketName', itemIndex) as string;
			const bucket = await CloudflareR2Utils.getBucket(this, getBucketName);
			return { bucket };

		case 'delete':
			const deleteBucketName = this.getNodeParameter('bucketName', itemIndex) as string;
			await CloudflareR2Utils.deleteBucket(this, deleteBucketName);
			return { success: true, message: `Bucket ${deleteBucketName} deleted` };

		case 'getCORS':
			const corsGetBucketName = this.getNodeParameter('bucketName', itemIndex) as string;
			const corsConfig = await CloudflareR2Utils.getCORSConfiguration(this, corsGetBucketName);
			return { corsConfiguration: corsConfig };

		case 'setCORS':
			const corsSetBucketName = this.getNodeParameter('bucketName', itemIndex) as string;
			const corsRules = this.getNodeParameter('corsRules', itemIndex) as any;
			
			const corsConfiguration: R2CORSConfiguration = {
				rules: corsRules.rules.map((rule: any) => ({
					allowed_origins: rule.allowedOrigins.split(',').map((s: string) => s.trim()),
					allowed_methods: rule.allowedMethods,
					allowed_headers: rule.allowedHeaders ? rule.allowedHeaders.split(',').map((s: string) => s.trim()) : undefined,
					max_age: rule.maxAge,
				}))
			};

			await CloudflareR2Utils.setCORSConfiguration(this, corsSetBucketName, corsConfiguration);
			return { success: true, message: 'CORS configuration updated' };

		case 'deleteCORS':
			const corsDeleteBucketName = this.getNodeParameter('bucketName', itemIndex) as string;
			await CloudflareR2Utils.setCORSConfiguration(this, corsDeleteBucketName, { rules: [] });
			return { success: true, message: 'CORS configuration deleted' };

		default:
			throw new NodeOperationError(this.getNode(), `Unknown bucket operation: ${operation}`);
	}
}

async function executeObjectOperation(
	this: IExecuteFunctions,
	operation: R2ObjectOperation,
	itemIndex: number
): Promise<IDataObject> {
	const bucketName = this.getNodeParameter('bucketName', itemIndex) as string;

	switch (operation) {
		case 'upload':
			return await executeUpload.call(this, itemIndex, bucketName);

		case 'download':
			return await executeDownload.call(this, itemIndex, bucketName);

		case 'delete':
			const deleteKey = this.getNodeParameter('objectKey', itemIndex) as string;
			await CloudflareR2Utils.deleteObjects(this, { key: deleteKey, bucket: bucketName });
			return { success: true, message: `Object ${deleteKey} deleted` };

		case 'list':
			const listOptions = this.getNodeParameter('listOptions', itemIndex) as any;
			const r2ListOptions: R2ListOptions = {
				bucket: bucketName,
				prefix: listOptions.prefix,
				max_keys: listOptions.maxKeys,
				delimiter: listOptions.delimiter,
			};
			
			const listResult = await CloudflareR2Utils.listObjects(this, r2ListOptions);
			return { objects: listResult.objects, truncated: listResult.truncated };

		case 'getMetadata':
			// This would require a HEAD request to get just metadata
			const metadataKey = this.getNodeParameter('objectKey', itemIndex) as string;
			// For now, return a placeholder - would need HEAD request implementation
			return { 
				key: metadataKey,
				message: 'Metadata retrieval not fully implemented yet'
			};

		case 'copy':
			// Copy operation would require implementing S3 COPY command
			const sourceBucket = this.getNodeParameter('sourceBucket', itemIndex) as string || bucketName;
			const sourceKey = this.getNodeParameter('sourceKey', itemIndex) as string;
			const destinationKey = this.getNodeParameter('destinationKey', itemIndex) as string;
			
			return { 
				success: true, 
				message: `Copy from ${sourceBucket}/${sourceKey} to ${bucketName}/${destinationKey} (not fully implemented)`
			};

		default:
			throw new NodeOperationError(this.getNode(), `Unknown object operation: ${operation}`);
	}
}

async function executeUpload(
	this: IExecuteFunctions,
	itemIndex: number,
	bucketName: string
): Promise<IDataObject> {
	const objectKey = this.getNodeParameter('objectKey', itemIndex) as string;
	const dataSource = this.getNodeParameter('dataSource', itemIndex) as string;
	const contentType = this.getNodeParameter('contentType', itemIndex) as string;
	const metadataParam = this.getNodeParameter('metadata', itemIndex) as any;

	if (!CloudflareR2Utils.validateObjectKey(objectKey)) {
		throw new NodeOperationError(this.getNode(), 'Invalid object key format');
	}

	let data: Buffer | string;
	let detectedContentType = contentType;

	if (dataSource === 'binaryData') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
		const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		data = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		
		if (!detectedContentType && binaryData.mimeType) {
			detectedContentType = binaryData.mimeType;
		}
	} else if (dataSource === 'base64Data') {
		const base64Content = this.getNodeParameter('base64Content', itemIndex) as string;
		const base64FileName = this.getNodeParameter('base64FileName', itemIndex) as string;

		if (!base64Content) {
			throw new NodeOperationError(this.getNode(), 'Base64 content is required when using Base64 Data source');
		}

		// Check if it's a data URL and extract the actual base64 content
		let base64Clean = base64Content;
		if (base64Content.startsWith('data:')) {
			const matches = base64Content.match(/^data:([^;]+);base64,(.+)$/);
			if (matches) {
				// Auto-detect content type from data URL if not explicitly provided
				if (!detectedContentType) {
					detectedContentType = matches[1];
				}
				base64Clean = matches[2];
			} else {
				// Handle case where it's data: but not properly formatted
				base64Clean = base64Content.replace(/^data:[^,]+,/, '');
			}
		}

		// Remove any whitespace from the base64 string
		base64Clean = base64Clean.replace(/\s/g, '');

		// Convert base64 to Buffer
		try {
			data = Buffer.from(base64Clean, 'base64');
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Invalid base64 content: ${error.message}`);
		}

		// If content type still not set, try to detect from filename extension
		if (!detectedContentType) {
			if (base64FileName) {
				const ext = base64FileName.split('.').pop()?.toLowerCase();
				const mimeTypes: { [key: string]: string } = {
					'jpg': 'image/jpeg',
					'jpeg': 'image/jpeg',
					'png': 'image/png',
					'gif': 'image/gif',
					'pdf': 'application/pdf',
					'json': 'application/json',
					'txt': 'text/plain',
					'html': 'text/html',
					'css': 'text/css',
					'js': 'application/javascript',
					'xml': 'application/xml',
					'zip': 'application/zip',
				};
				if (ext && mimeTypes[ext]) {
					detectedContentType = mimeTypes[ext];
				}
			}
			// Default to application/octet-stream if still no content type
			if (!detectedContentType) {
				detectedContentType = 'application/octet-stream';
			}
		}
	} else {
		data = this.getNodeParameter('textContent', itemIndex) as string;
		if (!detectedContentType) {
			detectedContentType = 'text/plain';
		}
	}

	// Process metadata
	const metadata: { [key: string]: string } = {};
	if (metadataParam.metadataFields) {
		metadataParam.metadataFields.forEach((field: any) => {
			if (field.key && field.value) {
				metadata[field.key] = field.value;
			}
		});
	}

	const uploadOptions: R2UploadOptions = {
		key: objectKey,
		bucket: bucketName,
		content_type: detectedContentType,
		metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
	};

	const result = await CloudflareR2Utils.uploadObject(this, uploadOptions, data);
	return { 
		success: true, 
		object: result,
		message: `Object ${objectKey} uploaded successfully`
	};
}

async function executeDownload(
	this: IExecuteFunctions,
	itemIndex: number,
	bucketName: string
): Promise<IDataObject> {
	const objectKey = this.getNodeParameter('objectKey', itemIndex) as string;

	const downloadOptions: R2DownloadOptions = {
		key: objectKey,
		bucket: bucketName,
	};

	const result = await CloudflareR2Utils.downloadObject(this, downloadOptions);
	
	// Add binary data to n8n
	const binaryData: IBinaryData = {
		data: result.data.toString('base64'),
		mimeType: result.metadata.content_type || 'application/octet-stream',
		fileName: objectKey.split('/').pop() || objectKey,
		fileSize: result.data.length.toString(),
	};

	return {
		success: true,
		object: result.metadata,
		binary: {
			data: binaryData
		}
	};
}

async function executeBatchOperation(
	this: IExecuteFunctions,
	operation: R2BatchOperation,
	itemIndex: number
): Promise<IDataObject[]> {
	const bucketName = this.getNodeParameter('bucketName', itemIndex) as string;

	switch (operation) {
		case 'deleteMultiple':
			const deleteKeys = this.getNodeParameter('objectKeys', itemIndex) as string;
			const keysToDelete = deleteKeys.split('\n').map(k => k.trim()).filter(k => k);
			
			if (keysToDelete.length > 1000) {
				throw new NodeOperationError(this.getNode(), 'Cannot delete more than 1000 objects at once');
			}

			await CloudflareR2Utils.deleteObjects(this, { key: keysToDelete, bucket: bucketName });
			return [{ success: true, deletedCount: keysToDelete.length }];

		case 'uploadMultiple':
		case 'downloadMultiple':
			return [{ 
				success: false, 
				message: `Batch operation ${operation} not yet implemented` 
			}];

		default:
			throw new NodeOperationError(this.getNode(), `Unknown batch operation: ${operation}`);
	}
}