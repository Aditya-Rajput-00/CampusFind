
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { getItems } from '../../services/itemService';
import {
    getClaims,
    createClaim,
    updateClaimStatus,
    verifyClaim,
} from '../../services/claimService';
import './Claims.css';

const CLAIMS_PAGE_SIZE = 20;

function Claims() {
    const { user } = useAuth();

    const isStudent = user?.role === 'student';
    const isStaff = user?.role === 'staff' || user?.role === 'admin';

    const [claims, setClaims] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: CLAIMS_PAGE_SIZE, totalRecords: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [items, setItems] = useState([]);

    const [itemId, setItemId] = useState('');
    const [description, setDescription] = useState('');
    const [additionalDetails, setAdditionalDetails] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState('');

    const [verificationNotes, setVerificationNotes] = useState({});
    const hasLoadedAvailableItems = useRef(false);

    // Fetch claims and available items.
    const loadClaimsData = useCallback(async (requestedPage) => {
        const claimsResult = await getClaims({
            page: requestedPage,
            limit: CLAIMS_PAGE_SIZE,
        });

        if (!claimsResult.success) {
            throw new Error(
                claimsResult.message || 'Unable to fetch claims'
            );
        }

        let availableItems;

        if (isStudent && !hasLoadedAvailableItems.current) {
            const itemsResult = await getItems({
                type: 'found',
                status: 'ACTIVE',
                limit: 100,
            });

            if (!itemsResult.success) {
                throw new Error(
                    itemsResult.message || 'Unable to fetch items'
                );
            }

            availableItems = itemsResult.data?.items || [];
            hasLoadedAvailableItems.current = true;
        }

        return {
            claims: Array.isArray(claimsResult.data)
                ? claimsResult.data
                : [],
            items: availableItems,
            pagination: claimsResult.pagination || {
                page: requestedPage,
                limit: CLAIMS_PAGE_SIZE,
                totalRecords: Array.isArray(claimsResult.data) ? claimsResult.data.length : 0,
                totalPages: 1,
            },
        };
    }, [isStudent]);

    // Refresh claims data after an action.
    const fetchData = useCallback(async (requestedPage = page) => {
        setLoading(true);
        try {
            const data = await loadClaimsData(requestedPage);

            setClaims(data.claims);
            if (Array.isArray(data.items)) setItems(data.items);
            setPagination(data.pagination);
            if (requestedPage > data.pagination.totalPages && data.pagination.totalPages > 0) {
                setPage(data.pagination.totalPages);
            }
            setError('');
        } catch (err) {
            console.error('Claims page error:', err);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Something went wrong.'
            );
        } finally {
            setLoading(false);
        }
    }, [loadClaimsData, page]);

    // Load claims when the page opens or user role changes.
    useEffect(() => {
        let isActive = true;

        loadClaimsData(page)
            .then((data) => {
                if (!isActive) return;

                setClaims(data.claims);
                if (Array.isArray(data.items)) setItems(data.items);
                setPagination(data.pagination);
                if (page > data.pagination.totalPages && data.pagination.totalPages > 0) {
                    setPage(data.pagination.totalPages);
                }
                setError('');
            })
            .catch((err) => {
                if (!isActive) return;

                console.error('Claims page error:', err);

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Something went wrong.'
                );
            })
            .finally(() => {
                if (isActive) {
                    setLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [loadClaimsData, page]);

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
        setLoading(true);
        setPage(nextPage);
    };

    // Submit a new claim.
    const handleSubmitClaim = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (!itemId || !description.trim()) {
            setError(
                'Please select an item and enter proof description.'
            );
            return;
        }

        setSubmitting(true);

        try {
            const result = await createClaim({
                itemId,
                proof: {
                    description: description.trim(),
                    additionalDetails: additionalDetails.trim(),
                },
            });

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to submit claim'
                );
            }

            setSuccess('Your claim has been submitted successfully.');

            setItemId('');
            setDescription('');
            setAdditionalDetails('');

            if (page === 1) {
                await fetchData(1);
            } else {
                setPage(1);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to submit claim.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Approve or reject a claim.
    const handleStatusUpdate = async (id, status) => {
        setError('');
        setSuccess('');
        setActionLoading(id);

        try {
            const result = await updateClaimStatus(id, status);

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to update claim'
                );
            }

            setSuccess(
                `Claim ${status.toLowerCase()} successfully.`
            );

            await fetchData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to update claim.'
            );
        } finally {
            setActionLoading('');
        }
    };

    // Verify ownership.
    const handleVerification = async (id, resultValue) => {
        setError('');
        setSuccess('');
        setActionLoading(id);

        try {
            const result = await verifyClaim(
                id,
                resultValue,
                verificationNotes[id] || ''
            );

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to verify claim'
                );
            }

            setSuccess(
                `Ownership verification recorded: ${resultValue}.`
            );

            setVerificationNotes((previous) => ({
                ...previous,
                [id]: '',
            }));

            await fetchData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to verify claim.'
            );
        } finally {
            setActionLoading('');
        }
    };

    // Calculate statistics.
    const pendingClaims = claims.filter(
        (claim) => claim.status === 'PENDING'
    );

    const approvedClaims = claims.filter(
        (claim) => claim.status === 'APPROVED'
    );

    const rejectedClaims = claims.filter(
        (claim) => claim.status === 'REJECTED'
    );

    const getStatusClass = (status) => {
        return status?.toLowerCase() || 'unknown';
    };

    return (
        <div className="claims-page">
            <div className="claims-header">
                <h1>
                    {isStudent ? 'My Claims' : 'Claims Management'}
                </h1>

                <p>
                    {isStudent
                        ? 'Submit ownership requests and track their progress.'
                        : 'Review submitted claims and verify item ownership.'}
                </p>
            </div>

            {error && (
                <div className="claims-alert claims-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="claims-alert claims-success">
                    {success}
                </div>
            )}

            {loading ? (
                <p className="claims-loading">Loading claims...</p>
            ) : (
                <>
                    <div className="claims-stats">
                        <div className="claim-stat-card">
                            <span>Total Claims</span>
                            <h2>{pagination.totalRecords}</h2>
                        </div>

                        <div className="claim-stat-card">
                            <span>Pending</span>
                            <h2>{pendingClaims.length}</h2>
                        </div>

                        <div className="claim-stat-card">
                            <span>Approved</span>
                            <h2>{approvedClaims.length}</h2>
                        </div>

                        <div className="claim-stat-card">
                            <span>Rejected</span>
                            <h2>{rejectedClaims.length}</h2>
                        </div>
                    </div>
                    <p className="claims-page-summary-note">Status counts reflect the claims shown on this page.</p>

                    {isStudent && (
                        <section className="claim-form-section">
                            <h2>Submit a New Claim</h2>

                            <form
                                className="claim-form"
                                onSubmit={handleSubmitClaim}
                            >
                                <div className="claim-form-group">
                                    <label htmlFor="claim-item">
                                        Select Found Item
                                    </label>

                                    <select
                                        id="claim-item"
                                        value={itemId}
                                        onChange={(event) =>
                                            setItemId(event.target.value)
                                        }
                                        required
                                    >
                                        <option value="">
                                            Choose an item
                                        </option>

                                        {items.map((item) => (
                                            <option
                                                key={item._id}
                                                value={item._id}
                                            >
                                                {item.title}
                                            </option>
                                        ))}
                                    </select>

                                    <small>
                                        {items.length} active found items available.
                                    </small>
                                </div>

                                <div className="claim-form-group">
                                    <label htmlFor="claim-description">
                                        Proof of Ownership
                                    </label>

                                    <textarea
                                        id="claim-description"
                                        rows="4"
                                        placeholder="Describe how you can prove this item belongs to you..."
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div className="claim-form-group">
                                    <label htmlFor="claim-details">
                                        Additional Details (Optional)
                                    </label>

                                    <textarea
                                        id="claim-details"
                                        rows="3"
                                        placeholder="Add any other useful information..."
                                        value={additionalDetails}
                                        onChange={(event) =>
                                            setAdditionalDetails(event.target.value)
                                        }
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="claim-primary-button"
                                    disabled={submitting || items.length === 0}
                                >
                                    {submitting
                                        ? 'Submitting...'
                                        : 'Submit Claim'}
                                </button>

                                {items.length === 0 && (
                                    <p className="claims-empty-note">
                                        No active found items are available for claiming.
                                    </p>
                                )}
                            </form>
                        </section>
                    )}

                    <section className="claims-list-section">
                        <h2>
                            {isStudent ? 'My Submitted Claims' : 'All Claims'}
                        </h2>

                        <p className="claims-count">
                            Showing {claims.length ? (page - 1) * pagination.limit + 1 : 0}–{(page - 1) * pagination.limit + claims.length} of {pagination.totalRecords} claims
                        </p>

                        {claims.length === 0 ? (
                            <div className="claims-empty">
                                <h3>No Claims Found</h3>
                                <p>
                                    {isStudent
                                        ? 'You have not submitted any claims yet.'
                                        : 'There are no claims to review.'}
                                </p>
                            </div>
                        ) : (
                            <div className="claims-grid">
                                {claims.map((claim) => (
                                    <article
                                        className="claim-card"
                                        key={claim._id}
                                    >
                                        <div className="claim-card-header">
                                            <span
                                                className={`claim-status ${getStatusClass(
                                                    claim.status
                                                )}`}
                                            >
                                                {claim.status}
                                            </span>

                                            <span className="claim-date">
                                                {new Date(
                                                    claim.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3>
                                            {claim.itemId?.title ||
                                                'Item information unavailable'}
                                        </h3>

                                        <p className="claim-item-type">
                                            {claim.itemId?.type?.toUpperCase() || 'ITEM'}
                                        </p>

                                        <div className="claim-details">
                                            {!isStudent && (
                                                <p>
                                                    <strong>Claimant:</strong>{' '}
                                                    {claim.claimantId?.name || 'Unknown'}
                                                </p>
                                            )}

                                            <p>
                                                <strong>Proof:</strong>{' '}
                                                {claim.proof?.description || 'Not available'}
                                            </p>

                                            {claim.proof?.additionalDetails && (
                                                <p>
                                                    <strong>Additional details:</strong>{' '}
                                                    {claim.proof.additionalDetails}
                                                </p>
                                            )}

                                            {claim.verification?.result && (
                                                <p>
                                                    <strong>Verification:</strong>{' '}
                                                    {claim.verification.result}
                                                </p>
                                            )}

                                            {claim.verification?.notes && (
                                                <p>
                                                    <strong>Verification notes:</strong>{' '}
                                                    {claim.verification.notes}
                                                </p>
                                            )}
                                        </div>

                                        {isStaff && claim.status === 'PENDING' && (
                                            <div className="claim-actions">
                                                <button
                                                    className="claim-approve-button"
                                                    disabled={actionLoading === claim._id}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            claim._id,
                                                            'APPROVED'
                                                        )
                                                    }
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    className="claim-reject-button"
                                                    disabled={actionLoading === claim._id}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            claim._id,
                                                            'REJECTED'
                                                        )
                                                    }
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {isStaff && claim.status === 'APPROVED' && (
                                            <div className="claim-verification">
                                                <label>Verification Notes</label>

                                                <textarea
                                                    rows="3"
                                                    value={
                                                        verificationNotes[claim._id] || ''
                                                    }
                                                    onChange={(event) =>
                                                        setVerificationNotes(
                                                            (previous) => ({
                                                                ...previous,
                                                                [claim._id]: event.target.value,
                                                            })
                                                        )
                                                    }
                                                    placeholder="Enter verification notes..."
                                                />

                                                <div className="claim-actions">
                                                    <button
                                                        className="claim-approve-button"
                                                        disabled={actionLoading === claim._id}
                                                        onClick={() =>
                                                            handleVerification(
                                                                claim._id,
                                                                'SUCCESS'
                                                            )
                                                        }
                                                    >
                                                        Verify Success
                                                    </button>

                                                    <button
                                                        className="claim-reject-button"
                                                        disabled={actionLoading === claim._id}
                                                        onClick={() =>
                                                            handleVerification(
                                                                claim._id,
                                                                'FAILURE'
                                                            )
                                                        }
                                                    >
                                                        Verify Failure
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}

                        {pagination.totalPages > 1 && (
                            <nav className="claims-pagination" aria-label="Claim pages">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={loading || page <= 1}
                                >
                                    Previous
                                </button>
                                <span>Page {page} of {pagination.totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={loading || page >= pagination.totalPages}
                                >
                                    Next
                                </button>
                            </nav>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default Claims;
