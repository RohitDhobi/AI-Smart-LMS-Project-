import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loading, Empty, Page } from "../ui";

function Notifications() {

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function load() {

      try {

        const result =
          await api.notifications();

        setNotifications(
          Array.isArray(result)
            ? result
            : []
        );

      } catch (e) {

        console.error(e);

      } finally {

        setLoading(false);

      }
    }

    load();

  }, []);


  async function markRead(id) {

    try {

      await api.readNotification(id);

      setNotifications(
        current =>
          current.map(
            item =>
              Number(item.id) ===
              Number(id)
                ? {
                    ...item,
                    read: true
                  }
                : item
          )
      );

    } catch (e) {

      console.error(e);

    }
  }


  if (loading) {
    return <Loading />;
  }


  return (
    <Page
      title="Notifications"
      subtitle="Stay updated with your learning activity."
    >

      {notifications.length === 0 ? (

        <Empty
          text="No notifications."
        />

      ) : (

        <div className="notification-list">

          {notifications.map(
            notification => (

              <div
                className={
                  `card notification ${
                    notification.read
                      ? "read"
                      : "unread"
                  }`
                }
                key={
                  notification.id
                }
              >

                <div>
                  <h3>
                    {notification.title ||
                      "Notification"}
                  </h3>

                  <p>
                    {notification.message ||
                      notification.content ||
                      ""}
                  </p>
                </div>


                {!notification.read && (

                  <button
                    className="secondary"
                    onClick={() =>
                      markRead(
                        notification.id
                      )
                    }
                  >
                    Mark as read
                  </button>

                )}

              </div>

            )
          )}

        </div>

      )}

    </Page>
  );
}


// =====================================================
// AI ASSISTANT
// =====================================================


export default Notifications;
