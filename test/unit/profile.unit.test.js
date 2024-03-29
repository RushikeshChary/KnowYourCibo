// Import required modules
const {
  profileRender
} = require("../../controllers/profilecontrollers");
const User = require("../../models/user");
const Item = require("../../models/item");

// Mock the User and Item models
jest.mock("../../models/user");
jest.mock("../../models/item");

// Mock user data
const mockedUser = {
  _id: "65eadd97673a7bf0caf2dc26",
  firstName: "John",
  lastName: "Doe",
  email: "doe@example.com",
  fav_items: ["item1", "item2"]
};

// Mock item data
const mockedItems = [
  { _id: "item1", name: "Item 1" },
  { _id: "item2", name: "Item 2" }
];

// Stub the behavior of User.findById to return the mocked user
User.findById.mockResolvedValueOnce(mockedUser);

// Stub the behavior of Item.find to return the mocked items
Item.find.mockResolvedValueOnce(mockedItems);

// Mock req and res objects
const req = {
  session: { userId: "65eadd97673a7bf0caf2dc26" },
};
const res = {
  status: jest.fn().mockReturnThis(),
  render: jest.fn(),
  redirect: jest.fn(),
};

describe("Profile Rendering", () => {
  it("should render profile with user information and favorite items when user is logged in", async () => {
    // Call profileRender function
    await profileRender(req, res);

    // Expectations
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith("profile", {
      info: mockedUser,
      items: mockedItems,
      userFirstName: mockedUser.firstName
    });
  });
});

