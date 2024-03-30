const request = require("supertest");
const app = require("../../server"); // Assuming your Express app is exported from server.js
const Item = require("../../models/item");

jest.mock("../../models/item"); // Mock the Item model

describe("Integration Test: searchResult API Endpoint", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test
  });

  it("should return search results when given a valid search query", async () => {
    // Mock the behavior of Item.find to return items
    Item.find.mockResolvedValueOnce([{ name: "Item 1" }, { name: "Item 2" }]);

    // Make a request to the searchResult endpoint with a valid search query
    const { body, statusCode } = await request(app)
      .post("/search")
      .send({ search: "item", referrer: "/" });

    // Check if the response status code is 200
    expect(statusCode).toBe(200);

    // Check if the response body contains the expected items
    expect(body.items).toEqual([{ name: "Item 1" }, { name: "Item 2" }]);
  });

  it("should return an empty array when no items are found for the search query", async () => {
    // Mock the behavior of Item.find to return an empty array
    Item.find.mockResolvedValueOnce([]);

    // Make a request to the searchResult endpoint with a search query that returns no items
    const response = await request(app)
      .post("/search")
      .send({ search: "none", referrer: "/" });

    // Check if the response status code is 200
    expect(response.statusCode).toBe(200);

    // Check if the response body contains an empty array of items
    expect(response.body.items).toEqual([]);
  });

  it("should return an empty array when the search query is empty", async () => {
    // Make a request to the searchResult endpoint with an empty search query
    const response = await request(app)
      .post("/search")
      .send({ search: "", referrer: "/" });

    // Check if the response status code is 200
    expect(response.statusCode).toBe(200);

    // Check if the response body contains an empty array of items
    expect(response.body.items).toEqual([]);
  });

  it("should handle errors gracefully and return an empty array", async () => {
    // Mock the behavior of Item.find to throw an error
    Item.find.mockRejectedValueOnce(new Error("Database error"));

    // Make a request to the searchResult endpoint with a valid search query
    const response = await request(app)
      .post("/search")
      .send({ search: "someQuery", referrer: "/" });

    // Check if the response status code is 200
    expect(response.statusCode).toBe(200);

    // Check if the response body contains an empty array of items
    expect(response.body.items).toEqual([]);
  });
});
