import React, { useEffect, useState } from "react";
import { getGamification, getBadges } from "../gamification";
import { Page } from "../ui";

function Leaderboard() {

  const [game, setGame] =
    useState(getGamification);

  const badges = getBadges().filter(
    b => game.badges?.[b.id]
  );

  // Sample classmates so students can compare
  // XP and streaks. Gamification is stored in
  // the browser, so peers are demo data.

  const classmates = [
    { name: "Aarav", xp: 1280, streak: 12, avatar: "🦊" },
    { name: "Priya", xp: 1045, streak: 9, avatar: "🦁" },
    { name: "Rohan", xp: 860, streak: 7, avatar: "🐼" },
    { name: "Sneha", xp: 640, streak: 5, avatar: "🐨" },
    { name: "Vikram", xp: 420, streak: 3, avatar: "🐯" },
    { name: "Ananya", xp: 205, streak: 2, avatar: "🐸" }
  ];

  const me = {
    name: "You",
    xp: game.xp || 0,
    streak: game.streak || 0,
    avatar: "🙋",
    you: true,
    badges: badges.length
  };

  const rows = [
    ...classmates,
    me
  ].sort((a, b) => b.xp - a.xp);

  const myRank =
    rows.findIndex(r => r.you) + 1;

  const medal = rank =>
    rank === 1
      ? "🥇"
      : rank === 2
      ? "🥈"
      : rank === 3
      ? "🥉"
      : rank;

  useEffect(() => {

    const refresh = () =>
      setGame(getGamification());

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

  return (

    <Page
      title="Leaderboard"
      subtitle="Compare XP and streaks with your classmates."
    >

      <div className="leaderboard-top">

        <div className="card leaderboard-rank-card">
          <span className="eyebrow">Your Rank</span>
          <strong>#{myRank}</strong>
          <p>
            of {rows.length} students
          </p>
        </div>

        <div className="card leaderboard-rank-card">
          <span className="eyebrow">XP Points</span>
          <strong>⚡ {game.xp || 0}</strong>
          <p>
            keep learning to climb!
          </p>
        </div>

        <div className="card leaderboard-rank-card">
          <span className="eyebrow">Day Streak</span>
          <strong>🔥 {game.streak || 0}</strong>
          <p>
            {badges.length} badges earned
          </p>
        </div>

      </div>

      <div className="card leaderboard-card">

        <h3>
          🏅 Class Rankings
        </h3>

        <div className="leaderboard-list">

          {rows.map((row, index) => {

            const rank = index + 1;

            return (

              <div
                className={
                  `leaderboard-row ${row.you ? "you" : ""}`
                }
                key={row.name}
              >

                <span className="leaderboard-rank">
                  {medal(rank)}
                </span>

                <span className="leaderboard-avatar">
                  {row.avatar}
                </span>

                <span className="leaderboard-name">
                  <strong>
                    {row.name}
                  </strong>

                  {row.you && (
                    <small>(you)</small>
                  )}

                  {row.badges > 0 && (
                    <small>
                      {row.badges} badges
                    </small>
                  )}
                </span>

                <span className="leaderboard-xp">
                  <strong>⚡ {row.xp}</strong>
                  <small>XP</small>
                </span>

                <span className="leaderboard-streak">
                  <strong>🔥 {row.streak}</strong>
                  <small>day streak</small>
                </span>

              </div>

            );

          })}

        </div>

      </div>

      <p className="leaderboard-note">
        ⚠️ XP, streaks and badges are stored in your
        browser — classmates shown are sample data.
      </p>

    </Page>

  );
}


// =====================================================
// COURSE DETAILS
// =====================================================


export default Leaderboard;
