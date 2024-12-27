import trash from "../../../images/icons/trash.svg";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./notifDetails.css";

export default function NotifDetails({
  allViewed,
  setAllViewed,
  notifications,
  setNotifications,
  isVisible,
  userId,
}) {
  const containerRef = useRef(null);
  const notifListRef = useRef(null);
  const [removing, setRemoving] = useState([]);
  const [removingAll, setRemovingAll] = useState();

  useEffect(() => {
    // Fetch notifications from the backend
    const fetchNotifications = async () => {
      try {
        const userId = sessionStorage.getItem("userId");
        const response = await axios.get(
          `http://${LOCAL_IP}:5000/api/notifications/${userId}`
        );
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
  }, [userId, setNotifications]);

  useEffect(() => {
    if (containerRef.current) {
      if (isVisible) {
        containerRef.current.style.display = "flex";
        containerRef.current.offsetHeight;
        containerRef.current.classList.add("visible");
      } else {
        containerRef.current.classList.remove("visible");
        const timer = setTimeout(() => {
          if (!isVisible && containerRef.current) {
            containerRef.current.style.display = "none";
          }
        }, 250);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible]);

  function handleRemoveAll() {
    setRemovingAll(true);

    setTimeout(() => {
      setRemovingAll(false);
      setNotifications([]);
    }, 250);
  }

  const handleNotifDelete = async (notificationId) => {
    try {
      const userId = sessionStorage.getItem("userId");
      await axios.delete(`http://${LOCAL_IP}:5000/api/notifications/delete`, {
        headers: { "Content-Type": "application/json" },
        data: { userId, notificationId },
      });

      setRemoving((prev) => [...prev, notificationId]);
      setTimeout(() => {
        setNotifications((curr) =>
          curr.filter((notif) => notif.id !== notificationId)
        );
        setRemoving((prev) => prev.filter((remId) => remId !== notificationId));
      }, 250);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleScroll = () => {
    if (notifListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = notifListRef.current;
      if (Math.ceil(scrollTop + clientHeight) >= scrollHeight) {
        setAllViewed(true);
      }
    }
  };

  useEffect(() => {
    const notifList = notifListRef.current;
    if (notifList) {
      notifList.addEventListener("scroll", handleScroll);
      return () => notifList.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const handleNotificationClick = (blogUrl) => {
    if (blogUrl) {
      window.open(blogUrl, "_blank");
    } else {
      alert("No related blog found.");
    }
  };
  return (
    <div className="notifDetails" ref={containerRef}>
      <div
        className={`topDetails  ${
          notifications.length === 0 ? "no-dismiss" : ""
        }`}
      >
        <h3>Notifications</h3>
        {notifications.length > 0 && (
          <button
            className={`dismiss ${removingAll ? "hidden" : ""}`}
            onClick={handleRemoveAll}
          >
            Dismiss All
          </button>
        )}
      </div>
      <div
        className={`notif-list ${removingAll ? "removing" : ""}`}
        ref={notifListRef}
      >
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              className={`messageContainer ${
                removing.includes(notification.id) ? "removing" : ""
              }`}
              key={notification.id}
            >
                <div key={notification.id} className="notifItem">
                <div className="mainContent" onClick={() => handleNotificationClick(notification.blogUrl)}
                style={{ cursor: notification.blogUrl ? "pointer" : "default" }}>
                  <h4>{notification.title}</h4>
                  <p>{notification.desc}</p>
                </div>
                <button
                  className="deletebut"
                  onClick={() => handleNotifDelete(notification.id)}
                >
                  <img src={trash} alt="delete" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-notifs">No new notifications</p>
        )}
      </div>
    </div>
  );
}
