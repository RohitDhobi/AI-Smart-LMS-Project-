import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loading, Empty } from "../ui";

function Certificates() {

  const [certificates, setCertificates] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function load() {

      try {

        const result =
          await api.certificates();

        setCertificates(
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


  if (loading) {
    return <Loading />;
  }


  return (

    <div className="page certificates-page">

      {/* hero banner */}

      <div className="analytics-hero">

        <div>

          <h2>🏆 Certificates</h2>

          <p>
            Your course completion certificates
            and achievements.
          </p>

        </div>

      </div>

      {certificates.length === 0 ? (

        <Empty
          text="You don't have any certificates yet."
        />

      ) : (

        <div className="certificate-grid">

          {certificates.map(
            (certificate, index) => {

              const tints = [
                "blue",
                "orange",
                "purple",
                "green"
              ];

              const tint =
                tints[index % tints.length];

              return (

                <div
                  className={`card certificate tint-${tint}`}
                  key={
                    certificate.id ||
                    certificate.certificateId
                  }
                >

                  <div className="certificate-top">

                    <div className="medal">
                      🏆
                    </div>

                    <span className="certificate-badge">
                      Completed
                    </span>

                  </div>

                  <h2>
                    Certificate
                  </h2>

                  <p>
                    {certificate.course?.title ||
                      certificate.courseTitle ||
                      "Completed Course"}
                  </p>

                  <div className="certificate-footer">

                    <span className="certificate-id">
                      {certificate.certificateId ||
                        certificate.id}
                    </span>

                    <span className="certificate-date">
                      {certificate.issuedAt ||
                        certificate.completedAt ||
                        ""}
                    </span>

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
// NOTIFICATIONS
// =====================================================


export default Certificates;
