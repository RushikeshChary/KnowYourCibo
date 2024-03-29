const { searchResult } = require("../../controllers/searchcontroller");
const Item = require("../../models/item");

jest.mock("../models/item"); // Mock the Item model

describe("searchResult", () => {
  it("should render searchPage with items matching the search query", async () => {
    const req = {
      body: { search: "someQuery", referrer: "/" },
    };
    const res = {
      render: jest.fn(),
    };

    // Mock the behavior of Item.find to return items
    Item.find.mockResolvedValueOnce([{ name: "Item 1" }, { name: "Item 2" }]);

    await searchResult(req, res);

    // Check if render is called with the correct arguments
    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [{ name: "Item 1" }, { name: "Item 2" }],
      referrer: "/",
    });
  });

  it("should render searchPage with empty items array if no items found", async () => {
    const req = {
      body: { search: "nonExistentQuery", referrer: "/" },
    };
    const res = {
      render: jest.fn(),
    };

    // Mock the behavior of Item.find to return an empty array
    Item.find.mockResolvedValueOnce([]);

    await searchResult(req, res);

    // Check if render is called with the correct arguments
    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [],
      referrer: "/",
    });
  });

  it("should render searchPage with empty items array if search query is empty", async () => {
    const req = {
      body: { search: "", referrer: "/" },
    };
    const res = {
      render: jest.fn(),
    };

    await searchResult(req, res);

    // Check if render is called with the correct arguments
    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [],
      referrer: "/",
    });
  });

  it("should render searchPage with empty items array if an error occurs", async () => {
    const req = {
      body: { search: "someQuery", referrer: "/" },
    };
    const res = {
      render: jest.fn(),
    };

    // Mock the behavior of Item.find to throw an error
    Item.find.mockRejectedValueOnce(new Error("Database error"));

    await searchResult(req, res);

    // Check if render is called with the correct arguments
    expect(res.render).toHaveBeenCalledWith("searchPage", {
      items: [],
      referrer: "/",
    });
  });
});
