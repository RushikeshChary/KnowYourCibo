const { searchResult } = require("../../controllers/searchController");
const Item = require("../../models/item");

jest.mock("../../models/item"); // Mock the Item model

describe("searchResult Controller Tests", () => {
  const mockResponse = () => {
    const res = {};
    res.render = jest.fn().mockReturnValue(res);
    return res;
  };

  it("should render searchPage with items matching the search query", async () => {
    const req = {
      body: { search: "someQuery", referrer: "/" },
      headers: { referer: '/previousPage' }
    };
    const res = mockResponse();

    // Mock the behavior of Item.find to return items
    Item.find.mockResolvedValueOnce([{ name: "Item 1" }, { name: "Item 2" }]);

    await searchResult(req, res);

    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [{ name: "Item 1" }, { name: "Item 2" }],
      referrer: '/',
    });
  });

  it("should render searchPage with an empty items array if no items are found", async () => {
    const req = {
      body: { search: "nonExistentQuery", referrer: "/" },
      headers: { referer: '/previousPage' }
    };
    const res = mockResponse();

    Item.find.mockResolvedValueOnce([]);

    await searchResult(req, res);

    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [],
      referrer: '/',
    });
  });

  it("should render searchPage with an empty items array if the search query is empty", async () => {
    const req = {
      body: { search: "", referrer: "/" },
      headers: { referer: '/previousPage' }
    };
    const res = mockResponse();

    await searchResult(req, res);

    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [],
      referrer: '/',
    });
  });

  it("should render searchPage with an empty items array if an error occurs during the search", async () => {
    const req = {
      body: { search: "someQuery", referrer: "/" },
      headers: { referer: '/previousPage' }
    };
    const res = mockResponse();

    Item.find.mockRejectedValueOnce(new Error("Database error"));

    await searchResult(req, res);

    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [],
      referrer: '/',
    });
  });

  it("should default to '/' if the referer header is missing", async () => {
    const req = {
      body: { search: "query" },
      headers: {}
    };
    const res = mockResponse();

    // Mock the behavior of Item.find to return an empty array
    Item.find.mockResolvedValueOnce([]);

    await searchResult(req, res);

    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [],
      referrer: '/'
    });
  });
});
