
const test = require("node:test");
const assert = require("node:assert/strict");

const Claim = require("../src/models/Claim");
const Item = require("../src/models/Item");
const Notification = require("../src/models/Notification");

const {
    getClaims,
    getPendingClaims,
    getVerificationQueue,
    createClaim,
    updateClaimStatus,
    verifyClaim,
} = require("../src/controllers/claimController");

const createResponse = () => ({
    statusCode: null,
    body: null,

    status(code) {
        this.statusCode = code;
        return this;
    },

    json(data) {
        this.body = data;
        return this;
    },
});

const createNext = () => {
    const state = { called: false, error: null };

    return {
        state,
        next(error) {
            state.called = true;
            state.error = error || null;
        },
    };
};

const restoreMethod = (object, method, original) => {
    object[method] = original;
};

const createClaimQuery = (expectedClaims) => ({
    populate() {
        return this;
    },
    sort() {
        return Promise.resolve(expectedClaims);
    },
});

test("getClaims returns all claims", async () => {
    const originalFind = Claim.find;

    try {
        const expectedClaims = [{ _id: "claim-1" }];
        Claim.find = () => createClaimQuery(expectedClaims);

        const res = createResponse();
        const { next, state } = createNext();

        await getClaims({}, res, next);

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.deepEqual(res.body.data, expectedClaims);
    } finally {
        restoreMethod(Claim, "find", originalFind);
    }
});

test("getPendingClaims fetches only pending claims", async () => {
    const originalFind = Claim.find;

    try {
        const expectedClaims = [{ _id: "claim-1", status: "PENDING" }];
        let capturedFilter;

        Claim.find = (filter) => {
            capturedFilter = filter;
            return createClaimQuery(expectedClaims);
        };

        const res = createResponse();
        const { next, state } = createNext();

        await getPendingClaims({}, res, next);

        assert.equal(state.called, false);
        assert.deepEqual(capturedFilter, { status: "PENDING" });
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body.data, expectedClaims);
    } finally {
        restoreMethod(Claim, "find", originalFind);
    }
});

test("getVerificationQueue fetches approved claims awaiting verification", async () => {
    const originalFind = Claim.find;

    try {
        const expectedClaims = [{ _id: "claim-1", status: "APPROVED" }];
        let capturedFilter;

        Claim.find = (filter) => {
            capturedFilter = filter;
            return createClaimQuery(expectedClaims);
        };

        const res = createResponse();
        const { next, state } = createNext();

        await getVerificationQueue({}, res, next);

        assert.equal(state.called, false);
        assert.deepEqual(capturedFilter, {
            status: "APPROVED",
            "verification.result": { $exists: false },
        });
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body.data, expectedClaims);
    } finally {
        restoreMethod(Claim, "find", originalFind);
    }
});

test("getClaims forwards database errors to next", async () => {
    const originalFind = Claim.find;

    try {
        const expectedError = new Error("Database error");
        Claim.find = () => ({
            populate() {
                return this;
            },
            sort() {
                return Promise.reject(expectedError);
            },
        });

        const res = createResponse();
        const { next, state } = createNext();

        await getClaims({}, res, next);

        assert.equal(state.called, true);
        assert.equal(state.error, expectedError);
    } finally {
        restoreMethod(Claim, "find", originalFind);
    }
});

test("createClaim rejects a missing item ID", async () => {
    const res = createResponse();
    const { next, state } = createNext();

    await createClaim(
        { body: {}, user: { userId: "user-1" } },
        res,
        next
    );

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Item ID is required");
    assert.equal(state.called, false);
});

test("createClaim rejects a missing proof description", async () => {
    const res = createResponse();
    const { next, state } = createNext();

    await createClaim(
        {
            body: { itemId: "item-1", proof: {} },
            user: { userId: "user-1" },
        },
        res,
        next
    );

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Proof description is required");
    assert.equal(state.called, false);
});

test("createClaim returns 404 when the item does not exist", async () => {
    const originalFindById = Item.findById;

    try {
        Item.findById = async () => null;

        const res = createResponse();
        const { next, state } = createNext();

        await createClaim(
            {
                body: {
                    itemId: "missing-item",
                    proof: { description: "I own this item" },
                },
                user: { userId: "user-1" },
            },
            res,
            next
        );

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Item not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Item, "findById", originalFindById);
    }
});

test("createClaim creates a claim and notifies the item reporter", async () => {
    const originalFindById = Item.findById;
    const originalCreateClaim = Claim.create;
    const originalCreateNotification = Notification.create;

    try {
        let savedClaimData;
        let notificationData;

        Item.findById = async () => ({
            _id: "item-1",
            title: "Lost Wallet",
            reportedBy: "reporter-1",
        });

        Claim.create = async (data) => {
            savedClaimData = data;
            return { _id: "claim-1", ...data };
        };

        Notification.create = async (data) => {
            notificationData = data;
            return data;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await createClaim(
            {
                body: {
                    itemId: "item-1",
                    proof: {
                        description: "It belongs to me",
                        additionalDetails: "It has my initials",
                    },
                },
                user: { userId: "claimant-1" },
            },
            res,
            next
        );

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);
        assert.equal(savedClaimData.itemId, "item-1");
        assert.equal(savedClaimData.claimantId, "claimant-1");
        assert.deepEqual(savedClaimData.proof, {
            description: "It belongs to me",
            additionalDetails: "It has my initials",
        });
        assert.equal(notificationData.userId, "reporter-1");
        assert.equal(notificationData.type, "CLAIM");
        assert.equal(res.body.data.claim._id, "claim-1");
    } finally {
        restoreMethod(Item, "findById", originalFindById);
        restoreMethod(Claim, "create", originalCreateClaim);
        restoreMethod(Notification, "create", originalCreateNotification);
    }
});

test("updateClaimStatus rejects an unsupported status", async () => {
    const res = createResponse();
    const { next, state } = createNext();

    await updateClaimStatus(
        {
            body: { status: "PENDING" },
            params: { id: "claim-1" },
        },
        res,
        next
    );

    assert.equal(res.statusCode, 400);
    assert.equal(
        res.body.message,
        "Status must be APPROVED or REJECTED"
    );
    assert.equal(state.called, false);
});

test("updateClaimStatus returns 404 when the claim does not exist", async () => {
    const originalUpdate = Claim.findByIdAndUpdate;

    try {
        Claim.findByIdAndUpdate = async () => null;

        const res = createResponse();
        const { next, state } = createNext();

        await updateClaimStatus(
            {
                body: { status: "REJECTED" },
                params: { id: "missing-claim" },
            },
            res,
            next
        );

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Claim not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Claim, "findByIdAndUpdate", originalUpdate);
    }
});

test("updateClaimStatus approves a claim and updates its item", async () => {
    const originalUpdate = Claim.findByIdAndUpdate;
    const originalFindById = Item.findById;
    const originalCreateNotification = Notification.create;

    try {
        const claim = {
            _id: "claim-1",
            itemId: "item-1",
            claimantId: "claimant-1",
            status: "APPROVED",
        };

        const item = {
            _id: "item-1",
            status: "ACTIVE",
            async save() {
                return this;
            },
        };

        let notificationData;

        Claim.findByIdAndUpdate = async (id, update, options) => {
            assert.equal(id, "claim-1");
            assert.deepEqual(update, { status: "APPROVED" });
            assert.deepEqual(options, {
                new: true,
                runValidators: true,
            });
            return claim;
        };

        Item.findById = async () => item;

        Notification.create = async (data) => {
            notificationData = data;
            return data;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await updateClaimStatus(
            {
                body: { status: "APPROVED" },
                params: { id: "claim-1" },
            },
            res,
            next
        );

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(item.status, "UNDER_VERIFICATION");
        assert.equal(notificationData.userId, "claimant-1");
        assert.equal(notificationData.title, "Claim Approved");
        assert.equal(res.body.data.claim, claim);
    } finally {
        restoreMethod(Claim, "findByIdAndUpdate", originalUpdate);
        restoreMethod(Item, "findById", originalFindById);
        restoreMethod(Notification, "create", originalCreateNotification);
    }
});

test("updateClaimStatus returns 404 when the related item is missing", async () => {
    const originalUpdate = Claim.findByIdAndUpdate;
    const originalFindById = Item.findById;

    try {
        Claim.findByIdAndUpdate = async () => ({
            _id: "claim-1",
            itemId: "missing-item",
            claimantId: "claimant-1",
        });

        Item.findById = async () => null;

        const res = createResponse();
        const { next, state } = createNext();

        await updateClaimStatus(
            {
                body: { status: "APPROVED" },
                params: { id: "claim-1" },
            },
            res,
            next
        );

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Related item not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Claim, "findByIdAndUpdate", originalUpdate);
        restoreMethod(Item, "findById", originalFindById);
    }
});

test("updateClaimStatus rejects a claim and notifies the claimant", async () => {
    const originalUpdate = Claim.findByIdAndUpdate;
    const originalCreateNotification = Notification.create;

    try {
        const claim = {
            _id: "claim-1",
            claimantId: "claimant-1",
            status: "REJECTED",
        };

        let notificationData;

        Claim.findByIdAndUpdate = async () => claim;

        Notification.create = async (data) => {
            notificationData = data;
            return data;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await updateClaimStatus(
            {
                body: { status: "REJECTED" },
                params: { id: "claim-1" },
            },
            res,
            next
        );

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(notificationData.userId, "claimant-1");
        assert.equal(notificationData.title, "Claim Rejected");
        assert.equal(
            notificationData.message,
            "Your claim has been rejected."
        );
    } finally {
        restoreMethod(Claim, "findByIdAndUpdate", originalUpdate);
        restoreMethod(Notification, "create", originalCreateNotification);
    }
});

test("verifyClaim rejects an unsupported verification result", async () => {
    const res = createResponse();
    const { next, state } = createNext();

    await verifyClaim(
        {
            body: { result: "PENDING" },
            params: { id: "claim-1" },
            user: { userId: "verifier-1" },
        },
        res,
        next
    );

    assert.equal(res.statusCode, 400);
    assert.equal(
        res.body.message,
        "Result must be SUCCESS or FAILURE"
    );
    assert.equal(state.called, false);
});

test("verifyClaim returns 404 when the claim does not exist", async () => {
    const originalFindById = Claim.findById;

    try {
        Claim.findById = async () => null;

        const res = createResponse();
        const { next, state } = createNext();

        await verifyClaim(
            {
                body: { result: "SUCCESS" },
                params: { id: "missing-claim" },
                user: { userId: "verifier-1" },
            },
            res,
            next
        );

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "Claim not found");
        assert.equal(state.called, false);
    } finally {
        restoreMethod(Claim, "findById", originalFindById);
    }
});

test("verifyClaim records successful verification and notifies the claimant", async () => {
    const originalFindById = Claim.findById;
    const originalCreateNotification = Notification.create;

    try {
        const claim = {
            _id: "claim-1",
            claimantId: "claimant-1",
            verification: {},
            async save() {
                return this;
            },
        };

        let notificationData;

        Claim.findById = async () => claim;

        Notification.create = async (data) => {
            notificationData = data;
            return data;
        };

        const res = createResponse();
        const { next, state } = createNext();

        await verifyClaim(
            {
                body: {
                    result: "SUCCESS",
                    notes: "Ownership confirmed",
                },
                params: { id: "claim-1" },
                user: { userId: "verifier-1" },
            },
            res,
            next
        );

        assert.equal(state.called, false);
        assert.equal(res.statusCode, 200);
        assert.equal(claim.verification.result, "SUCCESS");
        assert.equal(claim.verification.verifiedBy, "verifier-1");
        assert.equal(
            claim.verification.notes,
            "Ownership confirmed"
        );
        assert.ok(claim.verification.verifiedAt instanceof Date);
        assert.equal(notificationData.userId, "claimant-1");
        assert.equal(notificationData.type, "STATUS_UPDATE");
        assert.equal(
            notificationData.title,
            "Verification Successful"
        );
        assert.equal(res.body.data.claim, claim);
    } finally {
        restoreMethod(Claim, "findById", originalFindById);
        restoreMethod(Notification, "create", originalCreateNotification);
    }
});
