import React, { useEffect, useState } from "react";
import { api } from "../api";
import { getGamification, getBadges, syncGamificationWithBackend } from "../gamification";
import { Loading } from "../ui";

function Profile() {

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [game, setGame] =
    useState(() =>
      getGamification()
    );

  const [badges, setBadges] =
    useState(() =>
      getBadges()
    );

  useEffect(() => {

    syncGamificationWithBackend().then(stats => {
      if (stats) setGame(stats);
      setBadges(getBadges());
    });

    const refresh = () => {
      setGame(getGamification());
      setBadges(getBadges());
    };

    window.addEventListener(
      "lms-gamification-update",
      refresh
    );

    return () =>
      window.removeEventListener(
        "lms-gamification-update",
        refresh
      );

  }, []);


  useEffect(() => {

    async function load() {

      try {

        const result =
          await api.profile();

        setProfile(
          result || {}
        );

      } catch (e) {

        setError(
          e.message ||
          "Unable to load profile."
        );

      } finally {

        setLoading(false);

      }
    }

    load();

  }, []);


  async function saveProfile(
    event
  ) {

    event.preventDefault();

    try {

      setSaving(true);

      setMessage("");
      setError("");

      const result =
        await api.updateProfile(
          profile
        );

      setProfile(
        result || profile
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          result || profile
        )
      );

      setMessage(
        "Profile updated successfully."
      );

    } catch (e) {

      setError(
        e.message ||
        "Unable to update profile."
      );

    } finally {

      setSaving(false);

    }
  }


  if (loading) {
    return <Loading />;
  }


  return (

    <div className="page profile-page">

      {/* hero banner */}

      <div className="analytics-hero">

        <div>

          <h2>👤 Profile</h2>

          <p>
            Manage your account information.
          </p>

        </div>

      </div>

      <section className="card profile-card">

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {message && (
          <div className="notice">
            {message}
          </div>
        )}


        <form
          onSubmit={saveProfile}
        >

          <label>
            Name
          </label>

          <input
            value={
              profile?.name ||
              ""
            }
            onChange={e =>
              setProfile(
                current => ({
                  ...current,
                  name:
                    e.target.value
                })
              )
            }
          />


          <label>
            Email
          </label>

          <input
            type="email"
            value={
              profile?.email ||
              ""
            }
            onChange={e =>
              setProfile(
                current => ({
                  ...current,
                  email:
                    e.target.value
                })
              )
            }
          />


          <label>
            Phone
          </label>

          <input
            value={
              profile?.phone ||
              ""
            }
            onChange={e =>
              setProfile(
                current => ({
                  ...current,
                  phone:
                    e.target.value
                })
              )
            }
          />


          <button
            className="primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </form>

      </section>

      {/* =============================================
          GAMIFICATION
      ============================================= */}

      <section className="card badges-card">

        <h2>🏆 Your Achievements</h2>

        <div className="badge-stats">

          <div>
            <strong>
              {game?.xp || 0}
            </strong>
            <span>Total XP</span>
          </div>

          <div>
            <strong>
              {game?.streak || 0}
            </strong>
            <span>Day streak</span>
          </div>

          <div>
            <strong>
              {game?.focusMinutes || 0}
            </strong>
            <span>Focus minutes</span>
          </div>

          <div>
            <strong>
              {game?.lessonsCompleted || 0}
            </strong>
            <span>Lessons done</span>
          </div>

        </div>

        <div className="badge-grid">

          {badges.map(badge => (

            <div
              className={
                badge.unlocked
                  ? "badge unlocked"
                  : "badge locked"
              }
              key={badge.id}
              title={badge.desc}
            >

              <span className="badge-icon">
                {badge.unlocked
                  ? badge.icon
                  : "🔒"}
              </span>

              <strong>
                {badge.name}
              </strong>

              <small>
                {badge.desc}
              </small>

            </div>

          ))}

        </div>

      </section>

    </div>
  );
}


// =====================================================
// LEARNING PATH (AI)
// =====================================================


export default Profile;
