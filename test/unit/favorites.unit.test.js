const { dislikeItem, likeItem } = require("../../controllers/profilecontrollers");
const User = require("../../models/user");

jest.mock("../models/user");
jest.mock("../helperfunctions", () => ({
    rgbStringToColorName: jest.fn(),
  }));
describe("dislikeItem", () => {
  it("should remove the item from favorites and return success message", async () => {
    const req = {
      session: { userId: "65eadd97673a7bf0caf2dc26" },
      body: { item_id: "item1" },
    };

    const res = {
      json: jest.fn(),
    };

    const user = {
      _id: "65eadd97673a7bf0caf2dc26",
      fav_items: ["item1", "item2", "item3"],
    };

    User.findById.mockResolvedValueOnce(user);
    User.findByIdAndUpdate.mockResolvedValueOnce(user); // Mock User.findByIdAndUpdate

    await dislikeItem(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.session.userId);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      req.session.userId,
      { $set: { fav_items: ["item2", "item3"] } },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith({
      message: "This item will be removed from your favorites",
    });
  });

  it("should handle errors gracefully", async () => {
    const req = {
      session: { userId: "65eadd97673a7bf0caf2dc26" },
      body: { item_id: "item1" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
    };
    await dislikeItem(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("likeItem", () => {
  
  it("should add item to favorites if user is logged in and color is grey", async () => {
    const req = {
      session: { userId: "65eadd97673a7bf0caf2dc26" },
      body: { item_id: "item1", color: "grey" },
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const user = {
      _id: "65eadd97673a7bf0caf2dc26",
      fav_items: ["item2", "item3"],
    };
    require("../../helperfunctions").rgbStringToColorName.mockReturnValue("grey");
    User.findById.mockResolvedValueOnce(user);
    User.findByIdAndUpdate.mockResolvedValueOnce(user);

    await likeItem(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.session.userId);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      req.session.userId,
      { $set: { fav_items: ["item2", "item3", "item1"] } },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Favorites updated. You can edit from your favorites in your profile page.",
    });
  });

  it("should remove item from favorites if user is logged in and color is not grey", async () => {
    const req = {
      session: { userId: "65eadd97673a7bf0caf2dc26" },
      body: { item_id: "item2", color: "notgrey" },
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const user = {
      _id: "65eadd97673a7bf0caf2dc26",
      fav_items: ["item1", "item2", "item3"],
    };
    require("../../helperfunctions").rgbStringToColorName.mockReturnValue("unknown");
    User.findById.mockResolvedValueOnce(user);
    User.findByIdAndUpdate.mockResolvedValueOnce(user);

    await likeItem(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.session.userId);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      req.session.userId,
      { $set: { fav_items: ["item1", "item3"] } },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Favorites updated. You can edit from your favorites in your profile page.",
    });
  });

  it("should return error if user is not logged in", async () => {
    const req = {
      session: {},
      body: { item_id: "item1", color: "grey" },
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    await likeItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "You are not logged in" });
  });

  it("should handle errors gracefully", async () => {
    const req = {
      session: { userId: "65eadd97673a7bf0caf2dc26" },
      body: { item_id: "item1", color: "grey" },
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const errorMessage = "Database error";

    User.findById.mockRejectedValueOnce(new Error(errorMessage));

    await likeItem(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.session.userId);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "An error occurred while processing your request",
    });
  });
});
