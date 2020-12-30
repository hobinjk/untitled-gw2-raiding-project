import React from 'react';

function UploadView() {
  return (
    <section className="section">
      <form action="/api/v0/logs" method="post">
        <div className="field">
          <label className="label" htmlFor="url">dps.report url</label>
          <div className="control">
            <input className="input" type="text" name="url" id="url" required
                   placeholder="https://dps.report/..." />
          </div>
        </div>
        <div className="field">
          <input className="button" type="submit" value="Upload" />
        </div>
      </form>
    </section>
  );
}

export default UploadView;

