Of course. Here is a comprehensive guide to creating n8n nodes, covering both standard nodes for workflows and the specific requirements for creating AI-powered tool nodes for use with the AI Agent and MCP Trigger.

---

### **Comprehensive Guide to Creating n8n Nodes**

This document provides a detailed walkthrough for developers on how to build, test, and publish custom n8n nodes. It is divided into three parts:
1.  **Part 1: The Foundation:** Building a standard node for use in any n8n workflow.
2.  **Part 2: The Evolution:** Adapting a standard node to become a "tool" for AI Agents.
3.  **Part 3: The Publication:** Packaging and publishing your node to npm for the community.

### **Prerequisites**

Before you begin, ensure you have the following installed and set up:
*   **Node.js and npm:** A recent LTS version is recommended.
*   **Git:** For cloning the starter repository.
*   **A Code Editor:** Such as VS Code.
*   **A local n8n instance:** For testing your node during development. You can run n8n locally using Docker, npm, or n8n Desktop.

---

### **Part 1: The Foundation - Building a Standard Workflow Node**

A standard node is the most common type. It takes input, performs an action (like making an API call), and produces an output.

#### **Step 1: Project Setup**

The best way to start is with the official `n8n-nodes-starter` template.

```bash
# 1. Clone the starter template with a descriptive name
git clone https://github.com/n8n-io/n8n-nodes-starter.git n8n-nodes-mynode

# 2. Navigate into the new directory
cd n8n-nodes-mynode

# 3. Install the necessary dependencies
npm install```

This creates a project with the correct structure:
*   `nodes/`: Contains the core logic for your node(s).
*   `credentials/`: Contains the definitions for handling API keys and other secrets.
*   `icons/`: Contains SVG icons for your node(s).

#### **Step 2: Defining Credentials**

Almost every node interacts with a service and needs credentials. Defining a credential type ensures that keys are stored securely and encrypted in the n8n database.

**File:** `credentials/MyApi.credentials.ts`
```typescript
import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MyApi implements ICredentialType {
	name = 'myApi';
	displayName = 'My Awesome API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true, // This masks the input in the n8n UI
			},
			default: '',
			required: true,
		},
		{
			displayName: 'API Host',
			name: 'apiHost',
			type: 'string',
			default: 'https://api.example.com',
			description: 'The base URL of the API',
		},
	];
}
```

#### **Step 3: Creating the Node**

This is where you define the node's user interface (properties) and its core logic.

**File:** `nodes/MyNode/MyNode.node.ts`
```typescript
import { IExecuteFunctions } from 'n8n-workflow';
import {
	INodeType,
	INodeTypeDescription,
	IDataObject,
	INodeExecutionData,
} from 'n8n-workflow';

export class MyNode implements INodeType {
	description: INodeTypeDescription = {
		// Basic node metadata
		displayName: 'My Awesome Node',
		name: 'myNode',
		icon: 'file:myNode.svg', // Assumes an icon in the icons/ folder
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Fetches data from the Awesome API',

		// Standard n8n node configuration
		defaults: {
			name: 'My Node',
		},
		inputs: ['main'],
		outputs: ['main'],

		// Link the credential created in Step 2
		credentials: [
			{
				name: 'myApi',
				required: true,
			},
		],

		// Define the UI fields for the node
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Get User',
						value: 'getUser',
						description: 'Retrieve a single user by ID',
					},
					{
						name: 'List Users',
						value: 'listUsers',
						description: 'Retrieve a list of all users',
					},
				],
				default: 'getUser',
				noDataExpression: true,
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getUser'], // Only show this field if "Get User" is selected
					},
				},
				description: 'The ID of the user to retrieve',
			},
		],
	};

	// The 'execute' method is the heart of the node's functionality
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			const credentials = await this.getCredentials('myApi');
			const { apiKey, apiHost } = credentials;

			let endpoint = '';
			if (operation === 'getUser') {
				const userId = this.getNodeParameter('userId', i) as string;
				endpoint = `${apiHost}/users/${userId}`;
			} else if (operation === 'listUsers') {
				endpoint = `${apiHost}/users`;
			}

			const options = {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'X-Api-Key': apiKey,
				},
				uri: endpoint,
				json: true, // Automatically parse response as JSON
			};

			try {
				const responseData = await this.helpers.httpRequest(options);
				returnData.push(responseData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: this.getInputData(i)[0].json, error: error.message });
				} else {
					throw error;
				}
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
```

#### **Step 4: Local Development and Testing**

1.  **Build your node:** Transpile the TypeScript to JavaScript.
    ```bash
    npm run build
    ```

2.  **Link your node to n8n:** This creates a symbolic link so your local n8n instance can find your node.
    ```bash
    # In your node's project directory
    npm link

    # Find your n8n user folder (e.g., ~/.n8n/) and navigate to its `custom` sub-directory
    # If it doesn't exist, create it: mkdir ~/.n8n/custom
    cd ~/.n8n/custom

    # Link the package
    npm link n8n-nodes-mynode
    ```

3.  **Restart n8n:** After restarting, your new node ("My Awesome Node") will appear in the nodes panel. You can now add it to a workflow and test it.

---

### **Part 2: The Evolution - Creating an AI Tool Node**

An AI Agent in n8n can use other nodes as "tools" to perform actions. To make your node usable as a tool, you need to provide metadata that the AI can understand.

The core `execute` logic **does not change**. The modifications are entirely within the `INodeTypeDescription` object.

#### **Step 1: Enable Tool Functionality**

Add one critical property to your node's description object:

**File:** `nodes/MyNode/MyNode.node.ts`
```typescript
// ... inside the description object
export class MyNode implements INodeType {
	description: INodeTypeDescription = {
		// ... all other properties from Part 1
		
		// This property is REQUIRED to make the node usable as an AI tool.
		usableAsTool: true,
		
		// ...
	};
// ...
}
```

#### **Step 2: Write AI-Friendly Descriptions**

This is the most important step. The AI model **reads the text descriptions** of your node and its properties to decide *when* and *how* to use it. Make them clear, descriptive, and unambiguous.

**Poor Descriptions (for AI):**
*   **Node Description:** "Fetches data from the Awesome API"
*   **User ID Description:** "The ID of the user to retrieve"

**Excellent Descriptions (for AI):**
*   **Node Description:** "Use this tool to retrieve user information from the company's internal user database. It can get a single user by their unique ID or list all users."
*   **User ID Description:** "The unique identifier (UUID) for a specific user. For example: 'usr_12345'."

Let's update our `MyNode.node.ts` file with these better descriptions:

```typescript
// ... inside the description object
export class MyNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'My Awesome Node',
		name: 'myNode',
		// ...
		description: 'Use this tool to retrieve user information from the company\'s internal user database. It can get a single user by their unique ID or list all users.',
		usableAsTool: true,
		// ...
		properties: [
			{
				// ...
				options: [
					{
						name: 'Get User',
						value: 'getUser',
						description: 'Use this operation when you need to find a specific user and you have their ID.',
					},
					// ...
				],
				// ...
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getUser'],
					},
				},
				description: 'The unique identifier (UUID) for a specific user. For example: \'usr_12345\'.',
			},
		],
	};
// ...
}
```

After making these changes, rebuild your node (`npm run build`) and restart n8n. Your node can now be used as a tool by connecting it to an **MCP Server Trigger**.

---

### **Part 3: The Publication**

Once your node is complete and tested, you can publish it to npm for the community.

#### **Step 1: Configure `package.json`**

This file is the manifest for your project. Ensure it's configured correctly.

```json
{
  "name": "n8n-nodes-mynode",
  "version": "0.1.0",
  "description": "An n8n node to interact with the Awesome API, usable in workflows and by AI Agents.",
  "license": "MIT",
  "author": "Your Name <your-email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/n8n-nodes-mynode.git"
  },
  "main": "dist/nodes/MyNode/MyNode.node.js",
  "scripts": {
    "build": "tsc && gulp build:icons",
    "dev": "tsc --watch"
  },
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/MyApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/MyNode/MyNode.node.js"
    ]
  },
  "devDependencies": {
    // ...
  },
  "keywords": [
    "n8n-community-node-package"
  ]
}
```
**Critical Fields:**
*   **`name`**: Must follow the convention `n8n-nodes-<your-node-name>`.
*   **`keywords`**: Must include `n8n-community-node-package`. This is how n8n's community node discovery system finds your package.
*   **`n8n` object**: Points n8n to the compiled JavaScript files for your credentials and nodes.

#### **Step 2: Create a `README.md`**

A good README is essential. Include installation instructions, how to configure credentials, and examples of how to use the node.

#### **Step 3: Publish to npm**

1.  **Build your node for production:**
    ```bash
    npm run build
    ```
2.  **Log in to npm:**
    ```bash
    npm login
    ```
3.  **Publish:**
    ```bash
    npm publish
    ```

Your node is now live! Users can install it directly from the n8n UI under **Settings > Community Nodes**.
