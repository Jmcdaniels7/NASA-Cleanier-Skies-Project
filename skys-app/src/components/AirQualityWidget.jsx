import React, { useEffect, useState } from 'react';

function AirQualityWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // safe credentials from env variables
  const username = process.env.REACT_APP_METEOMATICS_USER;
  const password = process.env.REACT_APP_METEOMATICS_PASS;

  const url =
    "https://api.meteomatics.com/2025-10-04T13:35:00.000-04:00--2025-10-05T13:35:00.000-04:00:PT5M/air_quality:idx/40.3270127,-86.1746933/html?model=mix";

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(url, {
          headers: {
            Authorization: "Basic " + btoa(`${username}:${password}`),
          },
        });

        if (!resp.ok) {
          throw new Error(`HTTP error! status: ${resp.status}`);
        }

        // Since endpoint returns HTML
        const text = await resp.text();
        setData(text);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [url, username, password]);

  if (loading) return <div>Loading air quality data…</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="air-quality-widget">
      <h2>Air Quality Index</h2>
      <div dangerouslySetInnerHTML={{ __html: data }} />
    </div>
  );
}

export default AirQualityWidget;
