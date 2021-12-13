const config = require('./config');

module.exports = {
    endpoints: {
        baseUrl: config.apiURL,

        defaults: {
            headers: {
                'Content-Type': 'application/json'
            }
        },

        category: {
            list: {
                url: '/list.php?c=list',
                method: 'GET'
            }
        },

        drink: {
            list: {
                url: '/search.php?f=:firstLetter',
                method: 'GET'
            }
        },

        ingredient: {
            list: {
                url: '/list.php?i=list',
                method: 'GET'
            }
        }
    }
};