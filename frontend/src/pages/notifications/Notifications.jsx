
import { useEffect, useState } from 'react';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '../../services/notificationService';
import './Notifications.css';

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState('');

    // Fetch notifications from the backend.
    const fetchNotifications = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await getNotifications();

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to fetch notifications'
                );
            }

            setNotifications(
                Array.isArray(result.data) ? result.data : []
            );
        } catch (err) {
            console.error('Notifications page error:', err);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Something went wrong.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Mark one notification as read.
    const handleMarkAsRead = async (id) => {
        setError('');
        setSuccess('');
        setActionLoading(id);

        try {
            const result = await markNotificationAsRead(id);

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to update notification'
                );
            }

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification._id === id
                        ? { ...notification, isRead: true }
                        : notification
                )
            );

            setSuccess('Notification marked as read.');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to mark notification as read.'
            );
        } finally {
            setActionLoading('');
        }
    };

    // Mark all notifications as read.
    const handleMarkAllAsRead = async () => {
        setError('');
        setSuccess('');
        setActionLoading('all');

        try {
            const result = await markAllNotificationsAsRead();

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to update notifications'
                );
            }

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    isRead: true,
                }))
            );

            setSuccess('All notifications marked as read.');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to mark all notifications as read.'
            );
        } finally {
            setActionLoading('');
        }
    };

    // Calculate notification statistics.
    const unreadNotifications = notifications.filter(
        (notification) => !notification.isRead
    );

    const getTypeClass = (type) => {
        return type?.toLowerCase().replace('_', '-') || 'system';
    };

    const formatDate = (date) => {
        if (!date) return 'Date unavailable';

        return new Date(date).toLocaleString();
    };

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <div>
                    <h1>My Notifications</h1>
                    <p>
                        Stay updated with your CampusFind activities.
                    </p>
                </div>

                <button
                    className="notification-primary-button"
                    onClick={handleMarkAllAsRead}
                    disabled={
                        loading ||
                        unreadNotifications.length === 0 ||
                        actionLoading !== ''
                    }
                >
                    {actionLoading === 'all'
                        ? 'Updating...'
                        : 'Mark All as Read'}
                </button>
            </div>

            {error && (
                <div className="notifications-alert notifications-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="notifications-alert notifications-success">
                    {success}
                </div>
            )}

            {loading ? (
                <p className="notifications-loading">
                    Loading notifications...
                </p>
            ) : (
                <>
                    <div className="notifications-stats">
                        <div className="notification-stat-card">
                            <span>Total Notifications</span>
                            <h2>{notifications.length}</h2>
                        </div>

                        <div className="notification-stat-card">
                            <span>Unread</span>
                            <h2>{unreadNotifications.length}</h2>
                        </div>

                        <div className="notification-stat-card">
                            <span>Read</span>
                            <h2>
                                {notifications.length -
                                    unreadNotifications.length}
                            </h2>
                        </div>
                    </div>

                    <section className="notifications-list-section">
                        <div className="notifications-list-header">
                            <h2>Recent Notifications</h2>

                            <span>
                                {notifications.length} notifications
                            </span>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="notifications-empty">
                                <div className="notification-empty-icon">
                                    ♡
                                </div>

                                <h3>No Notifications Yet</h3>

                                <p>
                                    You will see updates about your claims,
                                    matches and items here.
                                </p>
                            </div>
                        ) : (
                            <div className="notifications-list">
                                {notifications.map((notification) => (
                                    <article
                                        key={notification._id}
                                        className={`notification-card ${notification.isRead
                                                ? 'read'
                                                : 'unread'
                                            }`}
                                    >
                                        <div className="notification-card-top">
                                            <div className="notification-title-area">
                                                <span
                                                    className={`notification-type ${getTypeClass(
                                                        notification.type
                                                    )}`}
                                                >
                                                    {notification.type?.replace(
                                                        '_',
                                                        ' '
                                                    ) || 'SYSTEM'}
                                                </span>

                                                {!notification.isRead && (
                                                    <span className="notification-unread-dot" />
                                                )}
                                            </div>

                                            <span className="notification-date">
                                                {formatDate(
                                                    notification.createdAt
                                                )}
                                            </span>
                                        </div>

                                        <h3>{notification.title}</h3>

                                        <p className="notification-message">
                                            {notification.message}
                                        </p>

                                        <div className="notification-card-footer">
                                            <span
                                                className={
                                                    notification.isRead
                                                        ? 'notification-read-label'
                                                        : 'notification-unread-label'
                                                }
                                            >
                                                {notification.isRead
                                                    ? 'Read'
                                                    : 'Unread'}
                                            </span>

                                            {!notification.isRead && (
                                                <button
                                                    className="notification-read-button"
                                                    onClick={() =>
                                                        handleMarkAsRead(
                                                            notification._id
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading !== ''
                                                    }
                                                >
                                                    {actionLoading ===
                                                        notification._id
                                                        ? 'Updating...'
                                                        : 'Mark as Read'}
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default Notifications;
