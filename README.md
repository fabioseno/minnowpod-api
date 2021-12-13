# Minnow Pod API

This repo was designed to demonstrate the use of a public API, by periodically syncronizing its data to a local database and providing saved content in another fashior using a custom API written in NodeJS.


## Requirements

1) Build a server (could be setup serverless) that periodically pulls from a Third Party API
2) Data should be parsed and synced in database
3) Create API routes to utilize this data in another fashion
4) You can find public API's here: [https://github.com/public-apis/public-apis](https://github.com/public-apis/public-apis)
5) You can also create your own API to supply data

This should be written in Node.js or Typescript. Please include tests.


## Running the project

1) Run `git clone git@github.com:fabioseno/minnowpod-api.git` to clone the repo and enter the folder

2) Run `npm install`

3) Copy the .env file sent by e-mail to the root folder

4) Run `npm start` to start the server

5) Run `npm test` to run the tests


## Solution

### Thirdy-party API

Choosing an API that satisfied requirement #2 was tough because of the nature of most APIs that either retrieved only a single information for a required search term (e.g. dictionary like APIs) or retrieved too much data for the purpose of this test.

The selected API was the [TheCocktailDB API](https://www.thecocktaildb.com/api.php). This API provides recipes for cocktails and a list of ingredients that make up the drink.

### Job

A job was built to pull data from this external API everyday at 5am and it manipulates incomingo data to split information into two tables: drink and drink_ingredient (Requirement #2).

A timestamp is marked in all imported data so entries with an old timestamp in the database are meant to be deleted from the API and will not be retrieved to the consumers.

### Custom API

For the custom API (Requirement #3), it was considered an endpoint where the user could provide a list of ingredient names joined by a comma symbol (,) and as a result, the endpoint should return the list of cocktails that could be made with these ingredients.

Sample query:
```
GET http://localhost:8081/drinks?ingredients=Vodka,Bourbon
```

List of available ingredient names:
```
https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list
```


## Considerations

### Problems

- the third-party API had lot of inconsistencies that demanded more time than expected such as:
  - cocktails with duplicated ingredients causing local database constraints to break. [duplicated ingredients](https://www.thecocktaildb.com/api/json/v1/1/search.php?s=Kiwi%20Martini).
  - recipes containing non UTF8 characters causing database to crash on insert/update. [non UTF8 character inside instructions](https://www.thecocktaildb.com/api/json/v1/1/search.php?s=Winter%20Rita).
  - drinks with null values in the ```dateModified``` attribute, that led to a change in the syncronization strategy.  

### Code

- used SOLID's Single Responsability Principle (SRC).
- syncronization code was built using a project structure that allowed database transactions to import consistent data.
  

### Performance

- as Node.js is known for hadling I/O intensive tasks very well, it didn't seem necessary to have the syncronization flow running in a different application.
- as a simple test, the API is not paging results and returning all rows if no ingredient is passed in the querystring.


## Improvements

Below is a list of suggestions that could be implemented in a real application and remained out of the scope due to time constraints or just because they were not in the scope of the test.   


### Security
- to avoid/reduce DDoS attacks the API should be authenticated, requiring a different token per client (consumer) to be passed in the HTTP header of the requests.

### Database
- adopt a migrations approach to automatically apply database changes.

### Performance
- if it was a requirement to build an API that would receive an enormous amount of requests, there could be a NoSQL database to store data in a structure that was closer to what the consumer needed and avoid too much processing for data transformations.
- the sync algorythm was adopted based on the size of the current dataset. It wouldn't be performant for large datasets.

### Logging
- ideally, there must be a logging system to store all errors/exceptions caught in the sync process or API invocation.

### Testing
- wanted to improve the test but already spent too much time on issues involving the third-party API.