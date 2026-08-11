// Runs the ACTUAL controller functions with the User model's database methods
// temporarily stubbed out (no live MongoDB needed). This exercises real logic -
// password hashing, token generation/hashing, role-injection protection, error
// handling - far more rigorously than a syntax check, without needing jest/mockingoose.
require("dotenv").config();
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret";
process.env.CLIENT_URL = "http://localhost:3000";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const authController = require("./controllers/auth.controller");
const { generateRefreshToken, hashToken } = require("./utils/generateTokens");

let passed = 0;
let failed = 0;
const results = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    results.push(`✅ PASS: ${name}`);
  } else {
    failed++;
    results.push(`❌ FAIL: ${name} ${detail}`);
  }
}

function makeRes() {
  const res = { statusCode: 200 };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

// Builds a fake "query" object that mimics User.findOne(...).select(...) chaining
function fakeQuery(result) {
  return { select: () => fakeQuery(result), then: (resolve) => resolve(result) };
}

// Stubs User.findOne / User.findById / User.create for the duration of one test,
// then restores the originals afterwards so tests don't leak into each other.
async function withStubs(stubs, fn) {
  const original = {
    findOne: User.findOne,
    findById: User.findById,
    create: User.create,
    findByIdAndUpdate: User.findByIdAndUpdate,
  };
  Object.assign(User, stubs);
  try {
    await fn();
  } finally {
    Object.assign(User, original);
  }
}

async function run() {
  const fakeId = new mongoose.Types.ObjectId();

  // ---------- TEST 1: Register (happy path) ----------
  await withStubs(
    {
      findOne: () => fakeQuery(null), // no existing user with this email
      create: async (data) => ({
        _id: fakeId,
        ...data,
        isVerified: false,
        save: async function () {
          return this;
        },
      }),
    },
    async () => {
      const req = { body: { name: "Ahmad", email: "ahmad@test.com", password: "secret123", role: "buyer" } };
      const res = makeRes();
      let capturedErr = null;
      await authController.registerUser(req, res, (err) => (capturedErr = err));
      check("Register: valid input succeeds with no error", !capturedErr, capturedErr?.message);
      check("Register: returns access + refresh tokens", !!(res.body?.accessToken && res.body?.refreshToken));
      check("Register: never returns password field", res.body && !res.body.password);
    }
  );

  // ---------- TEST 2: Security - client cannot self-assign admin role ----------
  await withStubs(
    {
      findOne: () => fakeQuery(null),
      create: async (data) => ({
        _id: fakeId,
        ...data,
        save: async function () {
          return this;
        },
      }),
    },
    async () => {
      const req = { body: { name: "Hacker", email: "hacker@test.com", password: "secret123", role: "admin" } };
      const res = makeRes();
      await authController.registerUser(req, res, () => {});
      check("Security: cannot self-assign admin role at registration", res.body?.role !== "admin", `got role=${res.body?.role}`);
    }
  );

  // ---------- TEST 3: Register rejects short password ----------
  {
    const req = { body: { name: "X", email: "x@test.com", password: "123" } };
    const res = makeRes();
    let capturedErr = null;
    await authController.registerUser(req, res, (err) => (capturedErr = err));
    check("Register: rejects password under 6 chars", !!capturedErr && res.statusCode === 400, capturedErr?.message);
  }

  // ---------- TEST 4: Register rejects duplicate email ----------
  await withStubs({ findOne: () => fakeQuery({ _id: fakeId, email: "ahmad@test.com" }) }, async () => {
    const req = { body: { name: "Ahmad2", email: "ahmad@test.com", password: "secret123" } };
    const res = makeRes();
    let capturedErr = null;
    await authController.registerUser(req, res, (err) => (capturedErr = err));
    check("Register: rejects duplicate email", !!capturedErr && res.statusCode === 400, capturedErr?.message);
  });

  // ---------- TEST 5: Login (happy path + wrong password) ----------
  const hashedPw = await bcrypt.hash("correctpassword", 10);
  const loginUserDoc = {
    _id: fakeId,
    name: "Ahmad",
    email: "ahmad@test.com",
    password: hashedPw,
    role: "buyer",
    isActive: true,
    isVerified: false,
    matchPassword: async function (entered) {
      return bcrypt.compare(entered, this.password);
    },
    save: async function () {
      return this;
    },
  };
  await withStubs({ findOne: () => fakeQuery(loginUserDoc) }, async () => {
    let req = { body: { email: "ahmad@test.com", password: "correctpassword" } };
    let res = makeRes();
    await authController.loginUser(req, res, (err) => check("Login: valid credentials succeed", !err, err?.message));
    check("Login: returns access + refresh tokens", !!(res.body?.accessToken && res.body?.refreshToken));

    req = { body: { email: "ahmad@test.com", password: "wrongpassword" } };
    res = makeRes();
    let capturedErr = null;
    await authController.loginUser(req, res, (err) => (capturedErr = err));
    check("Login: wrong password rejected with 401", res.statusCode === 401 && !!capturedErr);
    check(
      "Security: error message doesn't reveal whether email exists",
      capturedErr?.message === "Invalid email or password"
    );
  });

  // ---------- TEST 6: Login rejects deactivated account ----------
  const deactivatedUser = { ...loginUserDoc, isActive: false };
  await withStubs({ findOne: () => fakeQuery(deactivatedUser) }, async () => {
    const req = { body: { email: "ahmad@test.com", password: "correctpassword" } };
    const res = makeRes();
    let capturedErr = null;
    await authController.loginUser(req, res, (err) => (capturedErr = err));
    check("Login: deactivated account is rejected", res.statusCode === 403 && !!capturedErr, capturedErr?.message);
  });

  // ---------- TEST 7: Refresh token rotation ----------
  const realRefreshToken = generateRefreshToken(fakeId.toString());
  const refreshUserDoc = {
    _id: fakeId,
    refreshTokenHash: hashToken(realRefreshToken),
    save: async function () {
      return this;
    },
  };
  await withStubs({ findById: () => fakeQuery(refreshUserDoc) }, async () => {
    const req = { body: { refreshToken: realRefreshToken } };
    const res = makeRes();
    await authController.refreshAccessToken(req, res, (err) =>
      check("Refresh: valid refresh token succeeds", !err, err?.message)
    );
    check("Refresh: issues a new access token", !!res.body?.accessToken);
    check(
      "Refresh: rotates refresh token (new differs from old)",
      res.body?.refreshToken && res.body.refreshToken !== realRefreshToken
    );
  });

  // ---------- TEST 8: Refresh token with mismatched hash (tampered/stolen) is rejected ----------
  const wrongHashUserDoc = { _id: fakeId, refreshTokenHash: "somethingElseEntirely", save: async function () { return this; } };
  await withStubs({ findById: () => fakeQuery(wrongHashUserDoc) }, async () => {
    const req = { body: { refreshToken: realRefreshToken } };
    const res = makeRes();
    let capturedErr = null;
    await authController.refreshAccessToken(req, res, (err) => (capturedErr = err));
    check("Security: refresh token not matching stored hash is rejected", res.statusCode === 401 && !!capturedErr);
  });

  // ---------- TEST 9: Refresh rejects malformed token ----------
  {
    const req = { body: { refreshToken: "not.a.valid.jwt" } };
    const res = makeRes();
    let capturedErr = null;
    await authController.refreshAccessToken(req, res, (err) => (capturedErr = err));
    check("Refresh: malformed token is rejected", res.statusCode === 401 && !!capturedErr);
  }

  // ---------- TEST 10: Forgot password - email enumeration protection ----------
  await withStubs({ findOne: () => fakeQuery(null) }, async () => {
    const req = { body: { email: "doesnotexist@test.com" } };
    const res = makeRes();
    await authController.forgotPassword(req, res, () => {});
    check(
      "Security: forgot-password gives generic response for non-existent email",
      res.body?.message?.includes("If an account")
    );
  });

  const forgotUserDoc = { _id: fakeId, email: "ahmad@test.com", save: async function () { return this; } };
  await withStubs({ findOne: () => fakeQuery(forgotUserDoc) }, async () => {
    const req = { body: { email: "ahmad@test.com" } };
    const res = makeRes();
    await authController.forgotPassword(req, res, (err) => check("Forgot password: succeeds for real user", !err, err?.message));
    check("Forgot password: generates a reset token on the user", !!forgotUserDoc.resetPasswordTokenHash);
  });

  // ---------- TEST 11: Reset password with the token just generated ----------
  {
    // Extract the raw token that was emailed (dev-mode logs it) by regenerating with the same hash utility
    // Simulate: use resetPasswordTokenHash directly since we don't have the raw token here -
    // instead, directly test the "invalid token" path, and a valid round-trip using our own token.
    const { generateRawAndHashedToken } = require("./utils/generateTokens");
    const { rawToken, hashedToken } = generateRawAndHashedToken();
    const resetUserDoc = {
      _id: fakeId,
      resetPasswordTokenHash: hashedToken,
      resetPasswordExpires: Date.now() + 60 * 60 * 1000,
      save: async function () {
        return this;
      },
    };
    await withStubs({ findOne: () => fakeQuery(resetUserDoc) }, async () => {
      const req = { body: { token: rawToken, password: "newSecurePass123" } };
      const res = makeRes();
      let capturedErr = null;
      await authController.resetPassword(req, res, (err) => (capturedErr = err));
      check("Reset password: valid token succeeds", !capturedErr, capturedErr?.message);
      check("Reset password: clears refreshTokenHash (logs out old sessions)", resetUserDoc.refreshTokenHash === undefined);
    });

    // Invalid/expired token
    await withStubs({ findOne: () => fakeQuery(null) }, async () => {
      const req = { body: { token: "expiredOrWrongToken", password: "newSecurePass123" } };
      const res = makeRes();
      let capturedErr = null;
      await authController.resetPassword(req, res, (err) => (capturedErr = err));
      check("Reset password: invalid/expired token is rejected", res.statusCode === 400 && !!capturedErr);
    });
  }

  // ---------- TEST 12: Verify email ----------
  await withStubs({ findOne: () => fakeQuery(null) }, async () => {
    const req = { query: { token: "invalidtoken" } };
    const res = makeRes();
    let capturedErr = null;
    await authController.verifyEmail(req, res, (err) => (capturedErr = err));
    check("Verify email: invalid/expired token is rejected", res.statusCode === 400 && !!capturedErr);
  });

  {
    const { generateRawAndHashedToken } = require("./utils/generateTokens");
    const { rawToken, hashedToken } = generateRawAndHashedToken();
    const verifyUserDoc = {
      _id: fakeId,
      isVerified: false,
      emailVerificationTokenHash: hashedToken,
      emailVerificationExpires: Date.now() + 1000 * 60,
      save: async function () {
        return this;
      },
    };
    await withStubs({ findOne: () => fakeQuery(verifyUserDoc) }, async () => {
      const req = { query: { token: rawToken } };
      const res = makeRes();
      let capturedErr = null;
      await authController.verifyEmail(req, res, (err) => (capturedErr = err));
      check("Verify email: valid token succeeds", !capturedErr, capturedErr?.message);
      check("Verify email: sets isVerified = true", verifyUserDoc.isVerified === true);
    });
  }

  // ---------- TEST 13: Logout clears refresh token ----------
  await withStubs(
    {
      findByIdAndUpdate: async (id, update) => {
        check("Logout: unsets refreshTokenHash", !!update.$unset?.refreshTokenHash);
        return {};
      },
    },
    async () => {
      const req = { user: { _id: fakeId } };
      const res = makeRes();
      let capturedErr = null;
      await authController.logoutUser(req, res, (err) => (capturedErr = err));
      check("Logout: succeeds without error", !capturedErr, capturedErr?.message);
    }
  );

  // ---------- Print report ----------
  console.log("\n" + results.join("\n"));
  console.log(`\n${passed} passed, ${failed} failed (out of ${passed + failed})`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
