import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	JsonObject,
	IHttpRequestOptions,
} from 'n8n-workflow';
import {
     
     NodeApiError, 
     NodeOperationError 
} from 'n8n-workflow';


export class MatoolTrigger implements INodeType {
	description: INodeTypeDescription = {
		usableAsTool: true,
		displayName: 'MATOOL Webhook Trigger',
		name: 'matoolTrigger',
		icon: 'file:logo.svg',
		group: ['trigger'],
		version: 1,
		subtitle:
			'={{$parameter["events"].length ? $parameter["events"].join(", ") : "No events selected"}}',
		description: 'Starts the workflow when webhook events occur from a MATOOL',
		defaults: {
			name: 'MATOOL Webhook Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'matoolApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Prospect Created',
						value: 'new_prospect',  //trigger name from MATOOL API documentation
						description: 'Receive notifications for newly created prospects',
					},
				],
				default: 'new_prospect',
				required: true,
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId === undefined) return false;
				this.logger.debug('Checking n8n webhook in MATOOL', { webhookId: webhookData.webhookId });

				let responseData;
				try {
					responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'matoolApi', {
						method: 'GET',
						url: `https://api.matool.de/service/?todo=hook&hookid=${webhookData.webhookId}`,
						json: true,
					});
					if (responseData?.hookId === undefined) {
						delete webhookData.webhookId;

						this.logger.debug('MATOOL webhook Response empty - deleting n8n Webhook data', { webhookId: webhookData.webhookId });

						return false;
					}
				} catch (error) {
						throw new NodeOperationError(
						this.getNode(),
						`Failed to check webhook: ${error.message + ' --- ' + error.description}`,
						{ level: 'warning' },
					);
				}
				this.logger.debug('n8n Webhook found in MATOOL', { webhookId: webhookData.webhookId });
				return true;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const event = this.getNodeParameter('event', 0) as string;

				if (webhookUrl.includes('//localhost')) {
					throw new NodeOperationError(
						this.getNode(),
						'The Webhook can not work on "localhost". Please use a public URL.',
					);
				}

				const data: IDataObject = {
					targetUrl: webhookUrl,
					triggerName: event,
				};

				this.logger.debug('Creating MATOOL webhook', data);
		
				const options: IHttpRequestOptions = {
					headers: {
						'Accept': 'application/json',
					},
					method: 'POST',
					url: 'https://api.matool.de/service/?todo=hook',
					body: data, // send object; with json: true it will be serialized
					json: true,
				};

				let responseData;
				try {
					responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'matoolApi',	options);
					this.logger.debug(responseData.body, responseData.statusCode);
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to create webhook: ${error.message + ' --- ' + error.description}`,
						{ level: 'warning' },
					);
				}

				if (!responseData?.hookId) {
					throw new NodeApiError(this.getNode(), responseData as JsonObject, {
						message: 'Webhook creation response did not contain the expected data.',
					});
				}

				webhookData.webhookId = responseData.hookId as string;
                
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					try {
						await this.helpers.httpRequestWithAuthentication.call(this, 'matoolApi', {
							method: 'DELETE',
							url: `https://api.matool.de/service/?todo=hook&hookid=${webhookData.webhookId}`,
							json: true,
						});
					} catch {
						return false;
					}

					delete webhookData.webhookId;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        this.logger.debug('MATOOL Webhook request details', { method: this.getRequestObject().method, query: this.getRequestObject().query, headers: this.getHeaderData() });
		const req = this.getRequestObject();
		const bodyData = this.getBodyData();
		const httpMethod = req.method?.toUpperCase() || 'POST';

		if (httpMethod === 'GET') {
			if (req.query?.url) {
                this.logger.debug('MATOOL Webhook verification request', { url: req.query.url });
				return { webhookResponse: 'OK' };
			}
            this.logger.debug('MATOOL Health check GET request received');
			return {
				webhookResponse: JSON.stringify({
					status: 'healthy',
					message: 'Webhook endpoint is active',
					timestamp: new Date().toISOString(),
					endpoint: 'matool-webhook-trigger',
				}),
			};
		}

		if (httpMethod === 'POST') {
			if (!bodyData || (typeof bodyData === 'object' && Object.keys(bodyData).length === 0)) {
                this.logger.warn('MATOOL Empty POST request received');
				return { webhookResponse: 'OK' };
			}

            this.logger.debug('MATOOL Webhook processing event', { body: bodyData });
			const returnData: IDataObject []= [];

			let jsonBody;
			jsonBody = bodyData;

			//if Body Json comes as text, parse it
			if (bodyData.toString().includes('\\')) {
				jsonBody = JSON.parse(bodyData.toString());
			}

			returnData.push({
				body: jsonBody,
				headers: this.getHeaderData(),
				query: this.getQueryData(),
			});

			return {
				workflowData: [this.helpers.returnJsonArray(returnData)],
			};
		}

        this.logger.warn('MATOOL Unsupported HTTP method received', { method: httpMethod });
		return {
			webhookResponse: JSON.stringify({
				error: 'Method not allowed',
				message: `HTTP method ${httpMethod} is not supported`,
				supportedMethods: ['GET', 'POST'],
			}),
		};
	}
}