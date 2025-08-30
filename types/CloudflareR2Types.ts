// Cloudflare R2 Node Types and Interfaces

export type R2Resource = 'bucket' | 'object' | 'batch';

export type R2BucketOperation = 
	| 'create'
	| 'list'
	| 'get'
	| 'delete'
	| 'update'
	| 'getCORS'
	| 'setCORS'
	| 'deleteCORS';

export type R2ObjectOperation = 
	| 'upload'
	| 'download'
	| 'delete'
	| 'get'
	| 'list'
	| 'copy'
	| 'getMetadata'
	| 'multipartCreate'
	| 'multipartUpload'
	| 'multipartComplete'
	| 'multipartAbort';

export type R2BatchOperation = 
	| 'uploadMultiple'
	| 'deleteMultiple'
	| 'downloadMultiple';

// Cloudflare R2 API Response Types
export interface R2Bucket {
	name: string;
	creation_date: string;
	location?: string;
	jurisdiction?: string;
}

export interface R2Object {
	key: string;
	size: number;
	etag: string;
	last_modified: string;
	storage_class?: string;
	content_type?: string;
	metadata?: { [key: string]: string };
}

export interface R2ListResponse {
	objects: R2Object[];
	truncated: boolean;
	continuation_token?: string;
}

export interface R2BucketListResponse {
	buckets: R2Bucket[];
}

export interface R2MultipartUpload {
	upload_id: string;
	key: string;
	bucket: string;
}

export interface R2UploadedPart {
	part_number: number;
	etag: string;
}

export interface R2CORSRule {
	allowed_origins: string[];
	allowed_methods: string[];
	allowed_headers?: string[];
	expose_headers?: string[];
	max_age?: number;
}

export interface R2CORSConfiguration {
	rules: R2CORSRule[];
}

// Node operation parameters
export interface R2UploadOptions {
	key: string;
	bucket: string;
	content_type?: string;
	content_encoding?: string;
	metadata?: { [key: string]: string };
	storage_class?: 'STANDARD' | 'REDUCED_REDUNDANCY' | 'STANDARD_IA';
}

export interface R2DownloadOptions {
	key: string;
	bucket: string;
	range?: string;
}

export interface R2ListOptions {
	bucket: string;
	prefix?: string;
	delimiter?: string;
	max_keys?: number;
	continuation_token?: string;
}

export interface R2DeleteOptions {
	key: string | string[];
	bucket: string;
}

export interface R2CopyOptions {
	source_bucket: string;
	source_key: string;
	destination_bucket: string;
	destination_key: string;
	metadata_directive?: 'COPY' | 'REPLACE';
	metadata?: { [key: string]: string };
}

// Utility types
export interface R2ApiCredentials {
	accountId: string;
	apiToken: string;
	apiEndpoint: string;
	accessKeyId: string;
	secretAccessKey: string;
}

export interface R2ApiResponse<T = any> {
	success: boolean;
	errors: Array<{
		code: number;
		message: string;
	}>;
	messages: Array<{
		code: number;
		message: string;
	}>;
	result: T;
}

// File upload types for n8n binary data handling
export interface R2FileUpload {
	data: Buffer | string;
	filename: string;
	mimeType: string;
	metadata?: { [key: string]: string };
}

export interface R2BatchUpload {
	files: R2FileUpload[];
	bucket: string;
	prefix?: string;
}