// Import required modules
const {
  editProfileGet,
  editProfilePost,
} = require("../controllers/profilecontrollers");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

// Mock the User and Item models
jest.mock("../models/user");
jest.mock("bcryptjs");

//GET CHECKING.
describe("Edit profile Get", () => {
  // Mock user data
  const mockedUser = {
    _id: "65eadd97673a7bf0caf2dc26",
    firstName: "John",
    lastName: "Doe",
    email: "doe@example.com",
    password: "johndoe",
    fav_items: ["item1", "item2"],
  };

  // Stub the behavior of User.findById to return the mocked user
  User.findById.mockResolvedValueOnce(mockedUser);

  // Mock req and res objects
  const req = {
    session: { userId: mockedUser.userId },
    body: {
      firstName: mockedUser.firstName,
      lastName: mockedUser.lastName,
      password: mockedUser.password,
    },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    render: jest.fn(),
    redirect: jest.fn(),
  };
  it("should render edit profile page with proper details", async () => {
    await editProfileGet(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith("editProfile", {
      userFirstName: mockedUser.firstName,
      lastName: mockedUser.lastName,
      email: mockedUser.email,
    });
  });
});

//POST CHECKING
describe("Edit Profile Post", () => {
  it("should update user profile successfully", async () => {
    const req = {
      session: { userId: "65eadd97673a7bf0caf2dc26" },
      body: {
        firstName: "John",
        lastName: "Doe",
        password: "oldpassword",
        newpassword: "newpassword",
      },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const mockedUser = {
      _id: "65eadd97673a7bf0caf2dc26",
      firstName: "John",
      lastName: "Doe",
      password: "oldpassword", // Not hashed password
    };

    const mockedUser1 = {
      _id: "65eadd97673a7bf0caf2dc26",
      firstName: "John",
      lastName: "Doe",
      password: "newpassword", // Not hashed password
    }

    // Mock User.findById to return the mocked user
    User.findById.mockResolvedValueOnce(mockedUser);
    // Mock bcrypt.compare to always return true
    bcrypt.compare.mockResolvedValueOnce(true);
    // Mock bcrypt.hash to return a fixed hash value
    bcrypt.hash.mockResolvedValueOnce("hashedNewPassword");
    // Mock User.findByIdAndUpdate to return the updated user
    User.findByIdAndUpdate.mockResolvedValueOnce(mockedUser1);

    await editProfilePost(req, res);

    // Assertions
    expect(User.findById).toHaveBeenCalledWith(req.session.userId);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      req.body.password,
      mockedUser.password
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(req.body.newpassword, 10);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      req.session.userId,
      {
        $set: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          password: "hashedNewPassword",
        },
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Updated details successfully",
    });
  });

  it("should return an error if user is not found", async () => {
    const req = {
      session: { userId: "nonexistentuserid" },
      body: {},
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    // Mock User.findById to return null
    User.findById.mockResolvedValueOnce(null);

    await editProfilePost(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found." });
  });

  it("should return an error if password is incorrect", async () => {
    const req = {
      session: { userId: "65eadd97673a7bf0caf2dc26" },
      body: { password: "wrongpassword" },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const mockedUser = {
      _id: "65eadd97673a7bf0caf2dc26",
      password: "oldpassword", // Not hashed password
    };

    // Mock User.findById to return the mocked user
    User.findById.mockResolvedValueOnce(mockedUser);
    // Mock bcrypt.compare to return false
    bcrypt.compare.mockResolvedValueOnce(false);

    await editProfilePost(req, res);

    // Assertions
    expect(res.json).toHaveBeenCalledWith({
      message: "Incorrect password!! Enter correct password to update details",
    });
  });

  it("should handle errors gracefully", async () => {
    const req = {
      session: { userId: "65eadd97673a7bf0caf2dc26" },
      body: {},
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    // Mock User.findById to throw an error
    User.findById.mockRejectedValueOnce(new Error("Database error"));

    await editProfilePost(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Some error occurred in editing profile!! Try again.",
    });
  });
});
