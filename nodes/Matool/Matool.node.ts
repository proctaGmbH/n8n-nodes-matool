import {
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IExecuteFunctions,
    IHttpRequestOptions,
} from 'n8n-workflow';


export class Matool implements INodeType {
	description: INodeTypeDescription = {
        usableAsTool: true,
        displayName: 'MATOOL',
        name: 'matool',
        icon: 'file:logo.svg',
        group: ['transform'],
        version: 1,
        description: 'Consume MATOOL API',
        defaults: {
            name: 'Matool',
        },
        inputs: ['main'],
		outputs: ['main'],
        credentials: [
            {
                name: 'matoolApi',
                required: true,
            },
        ],
		properties: [
            {
                displayName: 'Action',
                name: 'action',
                type: 'options',
                options: [
                    { name: 'Get Account Name', value: 'getAccountname' },
                    { name: 'Create Prospect', value: 'createProspect' },
                ],
                default: 'getAccountname',
                description: 'Choose your MATOOL action',
            },       
            {
                displayName: 'First Name',
                name: 'firstName',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        action: [
                            'createProspect',
                        ],
                    },
                },
                default:'',
                placeholder: 'e.g. Max',
                description: 'First name of the prospect to create'
            },
            {
                displayName: 'Last Name',
                name: 'lastName',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        action: [
                            'createProspect',
                        ],
                    },
                },
                default:'',
                placeholder: 'e.g. Mustermann',
                description: 'Last name of the prospect to create'
            },            
            {
                displayName: 'Additional Fields',
                name: 'additionalFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: { action: ['createProspect',],},
                },
                options: [
                    {
                        displayName: 'City',
                        name: 'city',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. Nürnberg',
                    },
                    {
                        displayName: 'Contact',
                        name: 'contact',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. Kontakt',
                    },
                    {
                        displayName: 'Contact Type',
                        name: 'contactType',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. Kontaktart',
                    },
                    {
                        displayName: 'Creation Date',
                        name: 'creationDate',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. 2025-11-21',
                    },
                    {
                        displayName: 'EMail',
                        name: 'eMail',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. max@mustermann.de',
                    },
                    {
                        displayName: 'Memo',
                        name: 'memo',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. Anmerkung/Text',
                    },
                    {
                        displayName: 'Mobile',
                        name: 'mobile',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. +491701234567',
                    }, 
                    {
                        displayName: 'Phone',
                        name: 'phone',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. +4991123456789',
                    },
                    {
                        displayName: 'Service',
                        name: 'service',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. Leistung',
                    },
                    {
                        displayName: 'Source',
                        name: 'source',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. Quelle',
                    },                 
                    {
                        displayName: 'Status',
                        name: 'status',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. Status',
                    },                                                                                                                                
                    {
                        displayName: 'Street',
                        name: 'street',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. Hauptstraße 1',
                    },
                    {
                        displayName: 'Zip Code',
                        name: 'zipCode',
                        type: 'string',
                        default: '',
                        placeholder: 'e.g. 90411',
                    },                                                                                                                                                                                                                           
                ],
            },                      
		],
	};

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        let responseData;
        const returnData = [];
        const action = this.getNodeParameter('action', 0) as string;

        for (let i = 0; i < items.length; i++) {
            if (action === 'getAccountname') {
                const options: IHttpRequestOptions = {
                    method: 'GET',
                    url: 'https://api.matool.de/service/index.php?todo=accountname',                   
                    json: true,
                };
                responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'matoolApi', options);
                returnData.push(responseData);
            }            
            if (action === 'createProspect') {
                const creationDate = "" as string;               
                const firstName = this.getNodeParameter('firstName', i) as string;
                const lastName = this.getNodeParameter('lastName', i) as string;
                const street = "" as string;
                const zipCode = "" as string;
                const city = "" as string;
                const phone = "" as string;
                const mobile = "" as string;
                const eMail = "" as string;
                const source = "" as string;
                const contact = "" as string;  
                const contactType = "" as string;
                const service = "" as string;
                const status = "" as string;
                const memo = "" as string;
                
                const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
                const data: IDataObject = {
                    creationDate,
                    firstName,
                    lastName,
                    street,
                    zipCode,
                    city,
                    phone,
                    mobile,
                    eMail,
                    source,
                    contact,
                    contactType,
                    service,
                    status,
                    memo,
                };
                Object.assign(data, additionalFields);

                const options: IHttpRequestOptions = {
                    method: 'POST',
                    url: 'https://api.matool.de/service/?todo=prospect',
                    body: data, // send object; with json: true it will be serialized
                    json: true,
                };

                responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'matoolApi', options);
                returnData.push(responseData);
            }

        }
        return [this.helpers.returnJsonArray(returnData)];        
	}
}
