import type {
    IAuthenticateGeneric,
    Icon,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class MatoolApi implements ICredentialType {
    name = 'matoolApi';

    displayName = 'MATOOL API';

    icon: Icon = { light: 'file:../nodes/Matool/logo.svg', dark: 'file:../nodes/Matool/logo_dark.svg' };
    
    documentationUrl =
        'https://api.matool.de/service/api-doc.pdf';

    properties: INodeProperties[] = [
        {
            displayName: 'Api Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                'Accept': 'application/json; charset=utf-8',
                'User-Agent': 'matool-n8n-node/1.0 (+https://www.matool.de)', //inject User-Agent header to bypass 503 service unavailable errors from matool
                'X-API-KEY': '={{$credentials.apiKey}}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://api.matool.de',
            url: '/service?todo=accountname',
            method: 'GET',
            headers: {
                'Accept': 'application/json; charset=utf-8',
                'User-Agent': 'matool-n8n-node/1.0 (+https://www.matool.de)',
                'X-API-KEY': '={{$credentials.apiKey}}',
            },
        },
    };

}
