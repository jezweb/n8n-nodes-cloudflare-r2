import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CloudflareR2StorageApi implements ICredentialType {
	name = 'cloudflareR2StorageApi';
	displayName = 'Cloudflare R2 Storage API';
	documentationUrl = 'https://developers.cloudflare.com/r2/';
	properties: INodeProperties[] = [
		{
			displayName: 'Account ID',
			name: 'accountId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Cloudflare Account ID. You can find this in your Cloudflare Dashboard under the right sidebar.',
		},
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Cloudflare API Token with R2:Read and R2:Write permissions. Required for bucket management. Create this in your Cloudflare Profile > API Tokens.',
		},
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your R2 Access Key ID for S3-compatible API. Required for object operations. Generate this in Cloudflare Dashboard > R2 > Manage R2 API Tokens.',
		},
		{
			displayName: 'Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your R2 Secret Access Key for S3-compatible API. Required for object operations. Generate this in Cloudflare Dashboard > R2 > Manage R2 API Tokens.',
		},
		{
			displayName: 'API Endpoint',
			name: 'apiEndpoint',
			type: 'string',
			default: 'https://api.cloudflare.com/client/v4',
			description: 'The Cloudflare API endpoint. Leave default unless using a custom endpoint.',
		},
	];
}