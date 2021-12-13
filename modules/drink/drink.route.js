module.exports = (context) => {
    
    const drinkController = require('./drink.controller')(context);
    const app = context.app;
    
    // Search drinks
    app.get('/drinks', drinkController.search);

};