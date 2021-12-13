const axios = require('axios');
const endpointsConfig = require('../config/endpoints');
const axiosClient = axios.create({});

const mapParameters = (url, parameters) => {
    const extra = [];
    let param;
    let newUrl;
    let result = url;

    if (parameters) {
        for (param in parameters) {
            if (parameters[param] !== undefined && url.indexOf(':' + param) < 0) {
                extra.push(param + '=' + encodeURIComponent(parameters[param]));
            }
        }

        newUrl = url.replace(/:(\w+)/g, (substring, match) => {
            parameters = parameters || {};

            let routeValue = parameters[match];
            if (!routeValue) {
                routeValue = ':' + match;
            }
            return routeValue;
        });

        // missing parameter replacement
        if (newUrl.indexOf('/:') > 0) {
            throw 'HTTP CLIENT: not all route values were matched (' + url + ')';
        }

        let querySymbol = '?';
        if (newUrl.indexOf('?') >= 0) { querySymbol = '&' };

        result = (extra.length === 0) ? newUrl : newUrl + querySymbol + extra.join('&');
    }

    return result;
}

const httpClient = () => {
    const loadEndpointConfig = (category, operation) => {
        const endpointConfig = {};
        let found = false;

        for (const group in endpointsConfig) {
            if (endpointsConfig[group][category] && endpointsConfig[group][category][operation]) {
                found = true;

                endpointConfig.baseUrl = endpointsConfig[group].baseUrl || '';
                endpointConfig.defaults = endpointsConfig[group].defaults || {};
                endpointConfig.endpoint = endpointsConfig[group][category][operation];

                break;
            }
        }

        if (!found) {
            throw 'Endpoint not found for category [' + category + '] and operation [' + operation + ']';
        }

        return endpointConfig;
    };

    const mountUrl = (category, operation, params) => {
        const endpointConfig = loadEndpointConfig(category, operation);
        let url = endpointConfig.endpoint.baseUrl || endpointConfig.baseUrl || '';

        if (endpointConfig.endpoint.url) {
            url += endpointConfig.endpoint.url;
        }

        url = mapParameters(url, params.query);

        return url;
    };

    const invoke = (category, operation, params = {}, formData = null) => {
        const endpointConfig = loadEndpointConfig(category, operation);
        const options = {};

        const url = mountUrl(category, operation, params);

        // global headers
        options.headers = endpointConfig.defaults.headers || {};

        // endpoint headers
        if (endpointConfig.endpoint.headers) {
            options.headers = Object.assign(options.headers, endpointConfig.endpoint.headers);
        }

        // operation headers
        if (params.headers) {
            options.headers = Object.assign(options.headers, params.headers);
        }

        for (const property in options.headers) {
            if (!options.headers[property]) {
                delete options.headers[property];
            }
        }

        // endpoint options
        if (endpointConfig.endpoint.options) {
            for (const i in endpointConfig.endpoint.options) {
                options[i] = endpointConfig.endpoint.options[i];
            }
        }

        // operation options
        if (params.options) {
            for (const i in params.options) {
                options[i] = params.options[i];
            }
        }

        if (formData) {
            options.data = formData;
        } else if (params.data) {
            options.data = params.data;
        }

        options.method = endpointConfig.endpoint.method;
        options.url = url;

        return axiosClient(options);
    };

    return {
        invoke
    };
}

module.exports = httpClient();