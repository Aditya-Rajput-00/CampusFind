
import { useCallback, useEffect, useState } from 'react';
import {
    getPendingStaff,
    approveStaff,
    rejectStaff,
} from '../../services/userService';
import './StaffApprovals.css';

// Fetch and validate pending staff registrations.
const fetchPendingStaffList = async () => {
    const result = await getPendingStaff();

    if (!result.success || !Array.isArray(result.data)) {
        throw new Error(
            result.message || 'Unable to fetch pending staff registrations.'
        );
    }

    return result.data;
};

// Extract a useful error message from an API or application error.
const getErrorMessage = (error, fallbackMessage) => {
    return (
        error.response?.data?.message ||
        error.message ||
        fallbackMessage
    );
};

function StaffApprovals() {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [actionId, setActionId] = useState(null);

    // Refresh the pending staff registrations.
    const fetchPendingStaff = useCallback(async () => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const staff = await fetchPendingStaffList();
            setStaffList(staff);
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    'Something went wrong while fetching staff registrations.'
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // Load staff registrations when the page opens.
    useEffect(() => {
        let isActive = true;

        const loadInitialStaff = async () => {
            try {
                const staff = await fetchPendingStaffList();

                if (!isActive) return;

                setStaffList(staff);
                setError('');
            } catch (err) {
                if (!isActive) return;

                setError(
                    getErrorMessage(
                        err,
                        'Something went wrong while fetching staff registrations.'
                    )
                );
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        loadInitialStaff();

        return () => {
            isActive = false;
        };
    }, []);

    // Approve or reject a staff registration.
    const handleAction = async (staff, action) => {
        const staffId = staff._id;

        setActionId(staffId);
        setError('');
        setMessage('');

        try {
            const result = action === 'approve'
                ? await approveStaff(staffId)
                : await rejectStaff(staffId);

            if (!result.success) {
                throw new Error(
                    result.message || `Unable to ${action} this account.`
                );
            }

            setStaffList((previousList) =>
                previousList.filter((item) => item._id !== staffId)
            );

            setMessage(
                result.message ||
                `Staff account ${action === 'approve' ? 'approved' : 'rejected'} successfully.`
            );
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    `Unable to ${action} this staff account.`
                )
            );
        } finally {
            setActionId(null);
        }
    };

    return (
        <main className="staff-approvals-page">
            <div className="staff-approvals-header">
                <div>
                    <h1>Staff Approvals</h1>
                    <p>
                        Review and manage staff account registration requests.
                    </p>
                </div>

                <button
                    type="button"
                    className="staff-refresh-button"
                    onClick={fetchPendingStaff}
                    disabled={loading || actionId !== null}
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div className="staff-alert staff-alert-error" role="alert">
                    {error}
                </div>
            )}

            {message && (
                <div className="staff-alert staff-alert-success" role="status">
                    {message}
                </div>
            )}

            <div className="staff-approvals-summary">
                <span>Pending Requests</span>
                <strong>{staffList.length}</strong>
            </div>

            {loading ? (
                <p className="staff-loading">
                    Loading staff registration requests...
                </p>
            ) : staffList.length === 0 ? (
                <div className="staff-empty-state">
                    <h2>No Pending Requests</h2>
                    <p>
                        There are currently no staff registrations waiting for approval.
                    </p>
                </div>
            ) : (
                <div className="staff-approvals-list">
                    {staffList.map((staff) => (
                        <article
                            className="staff-request-card"
                            key={staff._id}
                        >
                            <div className="staff-request-details">
                                <div className="staff-request-heading">
                                    <h2>{staff.name}</h2>
                                    <span className="staff-pending-badge">
                                        Pending
                                    </span>
                                </div>

                                <p>
                                    <strong>Email:</strong> {staff.email}
                                </p>

                                {staff.department && (
                                    <p>
                                        <strong>Department:</strong> {staff.department}
                                    </p>
                                )}

                                {staff.phone && (
                                    <p>
                                        <strong>Phone:</strong> {staff.phone}
                                    </p>
                                )}
                            </div>

                            <div className="staff-request-actions">
                                <button
                                    type="button"
                                    className="staff-approve-button"
                                    onClick={() => handleAction(staff, 'approve')}
                                    disabled={actionId !== null}
                                >
                                    {actionId === staff._id
                                        ? 'Processing...'
                                        : 'Approve'}
                                </button>

                                <button
                                    type="button"
                                    className="staff-reject-button"
                                    onClick={() => handleAction(staff, 'reject')}
                                    disabled={actionId !== null}
                                >
                                    Reject
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}

export default StaffApprovals;
