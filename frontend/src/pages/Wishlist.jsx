import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Loading, Empty } from "../ui";

function Wishlist() {

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function load() {

      try {

        const result =
          await api.wishlist();

        setItems(
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


  async function remove(id) {

    try {

      await api.removeWishlist(id);

      setItems(
        current =>
          current.filter(
            item =>
              Number(
                item.id ||
                item.course?.id
              ) !== Number(id)
          )
      );

    } catch (e) {

      alert(
        e.message ||
        "Unable to remove from wishlist."
      );

    }
  }


  if (loading) {
    return <Loading />;
  }


  const cardTints = [
    "blue",
    "orange",
    "purple",
    "green"
  ];

  return (

    <div className="page wishlist-page">

      {/* hero banner */}

      <div className="analytics-hero">

        <div>

          <h2>❤️ Wishlist</h2>

          <p>
            Courses you want to learn later.
          </p>

        </div>

      </div>

      {items.length === 0 ? (

        <Empty
          text="Your wishlist is empty."
        />

      ) : (

        <div className="courses-grid">

          {items.map(
            (item, index) => {

              const course =
                item.course ||
                item;

              const tint =
                cardTints[index % cardTints.length];

              return (

                <div
                  className={`card course-card tint-${tint}`}
                  key={
                    course.id
                  }
                >

                  <div className="course-card-top">

                    <div className="course-icon">
                      📘
                    </div>

                    <span className="course-price">
                      {course.price != null
                        ? `₹${course.price}`
                        : "Free"}
                    </span>

                  </div>

                  <h2>
                    {course.title}
                  </h2>

                  <p>
                    {course.description ||
                      "No description available."}
                  </p>

                  <div className="course-card-footer">

                    <Link
                      className="primary button-link"
                      to={`/courses/${course.id}`}
                    >
                      View Course
                    </Link>

                    <button
                      className="secondary wishlist-remove"
                      onClick={() =>
                        remove(
                          course.id
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                </div>

              );
            }
          )}

        </div>

      )}

    </div>
  );
}


// =====================================================
// ANALYTICS
// =====================================================


export default Wishlist;
